import pool from '../config/db.js';

/**
 * Aggregates analytical reports and logs from Vehicles, Drivers, Trips, Fuel, Maintenance and Expenses tables.
 */
export const reportService = {
  async getReportData(type, filters = {}) {
    const {
      startDate,
      endDate,
      vehicleId,
      driverId,
      status,
      category,
      fuelTypeId
    } = filters;

    // Helper for parameterized constraints
    const params = [];
    
    switch (type) {
      case 'vehicle-utilization': {
        // Build SQL utilizing LEFT JOIN so we show all/filtered vehicles even if they have 0 trips in the period
        let tripDateConstraint = "t.status = 'COMPLETED'";
        if (startDate) {
          tripDateConstraint += " AND t.scheduled_departure >= ?";
          params.push(startDate);
        }
        if (endDate) {
          tripDateConstraint += " AND t.scheduled_departure <= ?";
          params.push(`${endDate} 23:59:59`);
        }

        let sql = `
          SELECT 
            v.id, 
            v.registration_number AS vehiclePlate,
            vm.name AS modelName,
            v.status,
            COUNT(t.id) AS totalTrips,
            COALESCE(SUM(t.distance_km), 0) AS totalDistanceKm,
            COALESCE(SUM(t.cargo_weight_kg), 0) AS totalCargoWeightKg,
            COALESCE(SUM(t.passenger_count), 0) AS totalPassengerCount
          FROM vehicles v
          JOIN vehicle_models vm ON v.model_id = vm.id
          LEFT JOIN trips t ON v.id = t.vehicle_id AND ${tripDateConstraint}
        `;

        if (vehicleId) {
          sql += " WHERE v.id = ?";
          params.push(vehicleId);
        }

        sql += " GROUP BY v.id ORDER BY totalDistanceKm DESC";
        const [rows] = await pool.query(sql, params);
        return rows;
      }

      case 'driver-performance': {
        let tripDateConstraint = '1=1';
        if (startDate) {
          tripDateConstraint += " AND t.scheduled_departure >= ?";
          params.push(startDate);
        }
        if (endDate) {
          tripDateConstraint += " AND t.scheduled_departure <= ?";
          params.push(`${endDate} 23:59:59`);
        }

        let sql = `
          SELECT 
            d.id, 
            d.employee_id AS employeeId,
            d.full_name AS driverName,
            d.status,
            COALESCE(SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS completedTrips,
            COALESCE(SUM(CASE WHEN t.status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelledTrips,
            COALESCE(SUM(CASE WHEN t.status = 'COMPLETED' THEN t.distance_km ELSE 0 END), 0) AS totalDistanceKm,
            COALESCE(AVG(CASE WHEN t.status = 'COMPLETED' THEN t.cargo_weight_kg ELSE NULL END), 0) AS avgCargoWeightKg,
            COALESCE(AVG(CASE WHEN t.status = 'COMPLETED' THEN t.passenger_count ELSE NULL END), 0) AS avgPassengerCount
          FROM drivers d
          LEFT JOIN trips t ON d.id = t.driver_id AND ${tripDateConstraint}
        `;

        if (driverId) {
          sql += " WHERE d.id = ?";
          params.push(driverId);
        }

        sql += " GROUP BY d.id ORDER BY completedTrips DESC";
        const [rows] = await pool.query(sql, params);
        return rows;
      }

      case 'trip-summary': {
        let sql = `
          SELECT 
            t.id, 
            t.trip_number AS tripNumber,
            v.registration_number AS vehiclePlate,
            d.full_name AS driverName,
            t.source_location AS sourceLocation,
            t.destination_location AS destinationLocation,
            t.scheduled_departure AS scheduledDeparture,
            t.scheduled_arrival AS scheduledArrival,
            t.actual_departure AS actualDeparture,
            t.actual_arrival AS actualArrival,
            t.status,
            t.distance_km AS distanceKm,
            t.passenger_count AS passengerCount,
            t.cargo_weight_kg AS cargoWeightKg
          FROM trips t
          JOIN vehicles v ON t.vehicle_id = v.id
          JOIN drivers d ON t.driver_id = d.id
        `;

        const conditions = [];

        if (startDate) {
          conditions.push("t.scheduled_departure >= ?");
          params.push(startDate);
        }
        if (endDate) {
          conditions.push("t.scheduled_departure <= ?");
          params.push(`${endDate} 23:59:59`);
        }
        if (vehicleId) {
          conditions.push("t.vehicle_id = ?");
          params.push(vehicleId);
        }
        if (driverId) {
          conditions.push("t.driver_id = ?");
          params.push(driverId);
        }
        if (status) {
          conditions.push("t.status = ?");
          params.push(status);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY t.scheduled_departure DESC";
        const [rows] = await pool.query(sql, params);
        return rows;
      }

      case 'fuel-consumption': {
        let sql = `
          SELECT 
            v.id AS vehicleId,
            v.registration_number AS vehiclePlate,
            ft.label AS fuelType,
            COUNT(f.id) AS fuelingCount,
            COALESCE(SUM(f.quantity), 0) AS totalQuantity,
            COALESCE(SUM(f.total_cost), 0) AS totalCost
          FROM vehicles v
          LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
          LEFT JOIN fuel_types ft ON f.fuel_type_id = ft.id
        `;

        const conditions = [];

        if (startDate) {
          conditions.push("f.fueling_date >= ?");
          params.push(startDate);
        }
        if (endDate) {
          conditions.push("f.fueling_date <= ?");
          params.push(`${endDate} 23:59:59`);
        }
        if (vehicleId) {
          conditions.push("v.id = ?");
          params.push(vehicleId);
        }
        if (fuelTypeId) {
          conditions.push("f.fuel_type_id = ?");
          params.push(fuelTypeId);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " GROUP BY v.id, ft.id HAVING fuelingCount > 0 ORDER BY totalCost DESC";
        const [rows] = await pool.query(sql, params);
        return rows;
      }

      case 'fuel-efficiency': {
        // Query correlates total completed distance in trips with quantity in fuel_logs per vehicle.
        // We use subqueries/CTEs to isolate dates cleanly.
        let tripParams = [];
        let fuelParams = [];

        let tripQuery = "SELECT vehicle_id, COALESCE(SUM(distance_km), 0) AS distance FROM trips WHERE status = 'COMPLETED'";
        if (startDate) {
          tripQuery += " AND scheduled_departure >= ?";
          tripParams.push(startDate);
        }
        if (endDate) {
          tripQuery += " AND scheduled_departure <= ?";
          tripParams.push(`${endDate} 23:59:59`);
        }
        tripQuery += " GROUP BY vehicle_id";

        let fuelQuery = "SELECT vehicle_id, COALESCE(SUM(quantity), 0) AS quantity FROM fuel_logs WHERE 1=1";
        if (startDate) {
          fuelQuery += " AND fueling_date >= ?";
          fuelParams.push(startDate);
        }
        if (endDate) {
          fuelQuery += " AND fueling_date <= ?";
          fuelParams.push(`${endDate} 23:59:59`);
        }
        fuelQuery += " GROUP BY vehicle_id";

        let sql = `
          SELECT 
            v.id,
            v.registration_number AS vehiclePlate,
            COALESCE(t_dist.distance, 0) AS totalDistanceKm,
            COALESCE(f_qty.quantity, 0) AS totalFuelLitres,
            CASE 
              WHEN COALESCE(f_qty.quantity, 0) > 0 THEN ROUND(COALESCE(t_dist.distance, 0) / COALESCE(f_qty.quantity, 0), 2)
              ELSE 0 
            END AS kmPerLitre
          FROM vehicles v
          LEFT JOIN (${tripQuery}) t_dist ON v.id = t_dist.vehicle_id
          LEFT JOIN (${fuelQuery}) f_qty ON v.id = f_qty.vehicle_id
        `;

        if (vehicleId) {
          sql += " WHERE v.id = ?";
          params.push(...tripParams, ...fuelParams, vehicleId);
        } else {
          params.push(...tripParams, ...fuelParams);
        }

        sql += " ORDER BY kmPerLitre DESC";
        const [rows] = await pool.query(sql, params);
        return rows;
      }

      case 'maintenance-cost': {
        let sql = `
          SELECT 
            v.id AS vehicleId,
            v.registration_number AS vehiclePlate,
            COUNT(m.id) AS totalJobs,
            COALESCE(SUM(m.cost), 0) AS totalCost,
            COALESCE(SUM(CASE WHEN m.maintenance_type = 'ROUTINE' THEN m.cost ELSE 0 END), 0) AS routineCost,
            COALESCE(SUM(CASE WHEN m.maintenance_type = 'REPAIR' THEN m.cost ELSE 0 END), 0) AS repairCost,
            COALESCE(SUM(CASE WHEN m.maintenance_type = 'INSPECTION' THEN m.cost ELSE 0 END), 0) AS inspectionCost,
            COALESCE(SUM(CASE WHEN m.maintenance_type = 'EMERGENCY' THEN m.cost ELSE 0 END), 0) AS emergencyCost,
            COALESCE(SUM(CASE WHEN m.maintenance_type = 'RECALL' THEN m.cost ELSE 0 END), 0) AS recallCost
          FROM vehicles v
          LEFT JOIN maintenance_logs m ON v.id = m.vehicle_id AND m.status = 'COMPLETED'
        `;

        const conditions = [];

        if (startDate) {
          conditions.push("m.start_date >= ?");
          params.push(startDate);
        }
        if (endDate) {
          conditions.push("m.start_date <= ?");
          params.push(endDate);
        }
        if (vehicleId) {
          conditions.push("v.id = ?");
          params.push(vehicleId);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " GROUP BY v.id HAVING totalJobs > 0 ORDER BY totalCost DESC";
        const [rows] = await pool.query(sql, params);
        return rows;
      }

      case 'expense-summary': {
        let sql = `
          SELECT 
            category,
            COUNT(id) AS count,
            COALESCE(SUM(amount), 0) AS totalAmount,
            COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN amount ELSE 0 END), 0) AS paidAmount,
            COALESCE(SUM(CASE WHEN payment_status = 'PENDING' THEN amount ELSE 0 END), 0) AS pendingAmount,
            COALESCE(SUM(CASE WHEN payment_status = 'REJECTED' THEN amount ELSE 0 END), 0) AS rejectedAmount,
            COALESCE(SUM(CASE WHEN payment_status = 'REIMBURSED' THEN amount ELSE 0 END), 0) AS reimbursedAmount
          FROM expenses
        `;

        const conditions = [];

        if (startDate) {
          conditions.push("expense_date >= ?");
          params.push(startDate);
        }
        if (endDate) {
          conditions.push("expense_date <= ?");
          params.push(endDate);
        }
        if (vehicleId) {
          conditions.push("vehicle_id = ?");
          params.push(vehicleId);
        }
        if (driverId) {
          conditions.push("driver_id = ?");
          params.push(driverId);
        }
        if (category) {
          conditions.push("category = ?");
          params.push(category);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " GROUP BY category ORDER BY totalAmount DESC";
        const [rows] = await pool.query(sql, params);
        return rows;
      }

      default:
        throw new Error(`Invalid report type: ${type}`);
    }
  }
};

export default reportService;
