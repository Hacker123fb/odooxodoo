import pool from '../config/db.js';

const TRIP_STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DELAYED: 'Delayed'
};

const MAINTENANCE_STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const EXPENSE_CATEGORY_LABELS = {
  FUEL: 'Fuel',
  MAINTENANCE: 'Maintenance',
  TOLL: 'Toll',
  INSURANCE: 'Insurance',
  REGISTRATION: 'Registration',
  SALARY: 'Salary',
  PENALTY: 'Penalty',
  OTHER: 'Other'
};

const VEHICLE_STATUS_LABELS = {
  available: 'Available',
  onTrip: 'On Trip',
  inMaintenance: 'In Maintenance',
  inactive: 'Inactive',
  retired: 'Retired'
};

const toNumber = (value) => Number(value) || 0;

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const fillMonthlySeries = (rows, valueKey = 'count') => {
  const map = new Map(rows.map((row) => [row.month, toNumber(row[valueKey])]));
  const series = [];

  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - i);

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    series.push({
      month: monthKey,
      label: formatMonthLabel(monthKey),
      [valueKey]: map.get(monthKey) ?? 0
    });
  }

  return series;
};

const mapTripRecord = (row) => ({
  id: row.id,
  tripNumber: row.trip_number,
  vehiclePlate: row.vehicle_plate,
  driverName: row.driver_name,
  sourceLocation: row.source_location,
  destinationLocation: row.destination_location,
  status: TRIP_STATUS_LABELS[row.status] || row.status,
  statusCode: row.status,
  scheduledDeparture: row.scheduled_departure,
  createdAt: row.created_at
});

const mapFuelRecord = (row) => ({
  id: row.id,
  vehiclePlate: row.vehicle_plate,
  fuelType: row.fuel_type_label,
  totalCost: toNumber(row.total_cost),
  quantity: toNumber(row.quantity),
  fuelingDate: row.fueling_date,
  createdAt: row.created_at
});

const mapMaintenanceRecord = (row) => ({
  id: row.id,
  vehiclePlate: row.vehicle_plate,
  maintenanceType: row.description,
  status: MAINTENANCE_STATUS_LABELS[row.status] || row.status,
  statusCode: row.status,
  cost: toNumber(row.cost),
  startDate: row.start_date,
  createdAt: row.created_at
});

const mapExpenseRecord = (row) => ({
  id: row.id,
  expenseNumber: row.expense_number,
  category: EXPENSE_CATEGORY_LABELS[row.category] || row.category,
  categoryCode: row.category,
  amount: toNumber(row.amount),
  description: row.description,
  expenseDate: row.expense_date,
  createdAt: row.created_at
});

/**
 * Aggregates live fleet, trip, fuel, expense, and maintenance data for the dashboard.
 */
export const dashboardService = {
  async getDashboardData() {
    const [
      [fleetRows],
      [driverRows],
      [tripRows],
      [fuelRows],
      [expenseRows],
      [maintenanceRows],
      [tripsPerMonthRows],
      [fuelTrendRows],
      [expenseCategoryRows],
      [vehicleStatusRows],
      [tripStatusRows],
      [maintenanceStatusRows],
      [recentTrips],
      [recentFuelLogs],
      [recentMaintenance],
      [recentExpenses]
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_vehicles,
          SUM(CASE
            WHEN v.status = 'ACTIVE' AND NOT EXISTS (
              SELECT 1 FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'IN_PROGRESS'
            ) THEN 1 ELSE 0
          END) AS available_vehicles,
          SUM(CASE
            WHEN v.status = 'ACTIVE' AND EXISTS (
              SELECT 1 FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'IN_PROGRESS'
            ) THEN 1 ELSE 0
          END) AS vehicles_on_trip,
          SUM(CASE WHEN v.status = 'IN_MAINTENANCE' THEN 1 ELSE 0 END) AS vehicles_in_maintenance
        FROM vehicles v
      `),
      pool.query(`
        SELECT
          COUNT(*) AS total_drivers,
          SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS drivers_available,
          SUM(CASE WHEN status = 'ON_TRIP' THEN 1 ELSE 0 END) AS drivers_on_trip
        FROM drivers
      `),
      pool.query(`
        SELECT
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS active_trips,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_trips,
          SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_trips
        FROM trips
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN DATE(fueling_date) = CURDATE() THEN total_cost ELSE 0 END), 0) AS today_fuel_cost,
          COALESCE(SUM(
            CASE
              WHEN YEAR(fueling_date) = YEAR(CURDATE()) AND MONTH(fueling_date) = MONTH(CURDATE())
              THEN total_cost ELSE 0
            END
          ), 0) AS month_fuel_cost
        FROM fuel_logs
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN expense_date = CURDATE() THEN amount ELSE 0 END), 0) AS today_expenses,
          COALESCE(SUM(
            CASE
              WHEN YEAR(expense_date) = YEAR(CURDATE()) AND MONTH(expense_date) = MONTH(CURDATE())
              THEN amount ELSE 0
            END
          ), 0) AS month_expenses
        FROM expenses
      `),
      pool.query(`
        SELECT
          SUM(CASE WHEN status = 'SCHEDULED' THEN 1 ELSE 0 END) AS scheduled,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
          COUNT(*) AS total
        FROM maintenance_logs
      `),
      pool.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
        FROM trips
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `),
      pool.query(`
        SELECT DATE_FORMAT(fueling_date, '%Y-%m') AS month, COALESCE(SUM(total_cost), 0) AS cost
        FROM fuel_logs
        WHERE fueling_date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
        GROUP BY DATE_FORMAT(fueling_date, '%Y-%m')
        ORDER BY month ASC
      `),
      pool.query(`
        SELECT category, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
        FROM expenses
        GROUP BY category
        ORDER BY amount DESC
      `),
      pool.query(`
        SELECT
          SUM(CASE
            WHEN v.status = 'ACTIVE' AND NOT EXISTS (
              SELECT 1 FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'IN_PROGRESS'
            ) THEN 1 ELSE 0
          END) AS available,
          SUM(CASE
            WHEN v.status = 'ACTIVE' AND EXISTS (
              SELECT 1 FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'IN_PROGRESS'
            ) THEN 1 ELSE 0
          END) AS on_trip,
          SUM(CASE WHEN v.status = 'IN_MAINTENANCE' THEN 1 ELSE 0 END) AS in_maintenance,
          SUM(CASE WHEN v.status = 'INACTIVE' THEN 1 ELSE 0 END) AS inactive,
          SUM(CASE WHEN v.status = 'RETIRED' THEN 1 ELSE 0 END) AS retired
        FROM vehicles v
      `),
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM trips
        GROUP BY status
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM maintenance_logs
        GROUP BY status
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT t.*, v.registration_number AS vehicle_plate, d.full_name AS driver_name
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT f.*, v.registration_number AS vehicle_plate, ft.label AS fuel_type_label
        FROM fuel_logs f
        JOIN vehicles v ON f.vehicle_id = v.id
        JOIN fuel_types ft ON f.fuel_type_id = ft.id
        ORDER BY f.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT m.*, v.registration_number AS vehicle_plate
        FROM maintenance_logs m
        JOIN vehicles v ON m.vehicle_id = v.id
        ORDER BY m.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT e.*
        FROM expenses e
        ORDER BY e.created_at DESC
        LIMIT 10
      `)
    ]);

    const fleet = fleetRows[0] || {};
    const drivers = driverRows[0] || {};
    const trips = tripRows[0] || {};
    const fuel = fuelRows[0] || {};
    const expenses = expenseRows[0] || {};
    const maintenance = maintenanceRows[0] || {};
    const vehicleStatus = vehicleStatusRows[0] || {};

    const totalVehicles = toNumber(fleet.total_vehicles);
    const vehiclesOnTrip = toNumber(fleet.vehicles_on_trip);
    const fleetUtilizationPercent = totalVehicles > 0
      ? Math.round((vehiclesOnTrip / totalVehicles) * 100)
      : 0;

    const tripsPerMonth = fillMonthlySeries(tripsPerMonthRows).map((item) => ({
      month: item.month,
      label: item.label,
      count: item.count
    }));

    const fuelCostTrend = fillMonthlySeries(fuelTrendRows, 'cost').map((item) => ({
      month: item.month,
      label: item.label,
      cost: item.cost
    }));

    return {
      fleetSummary: {
        totalVehicles,
        availableVehicles: toNumber(fleet.available_vehicles),
        vehiclesOnTrip,
        vehiclesInMaintenance: toNumber(fleet.vehicles_in_maintenance),
        totalDrivers: toNumber(drivers.total_drivers),
        driversAvailable: toNumber(drivers.drivers_available),
        driversOnTrip: toNumber(drivers.drivers_on_trip),
        fleetUtilizationPercent
      },
      tripSummary: {
        activeTrips: toNumber(trips.active_trips),
        completedTrips: toNumber(trips.completed_trips),
        cancelledTrips: toNumber(trips.cancelled_trips)
      },
      maintenanceSummary: {
        total: toNumber(maintenance.total),
        scheduled: toNumber(maintenance.scheduled),
        inProgress: toNumber(maintenance.in_progress),
        completed: toNumber(maintenance.completed),
        cancelled: toNumber(maintenance.cancelled)
      },
      fuelSummary: {
        todayFuelCost: toNumber(fuel.today_fuel_cost),
        thisMonthFuelCost: toNumber(fuel.month_fuel_cost)
      },
      expenseSummary: {
        todayExpenses: toNumber(expenses.today_expenses),
        thisMonthExpenses: toNumber(expenses.month_expenses)
      },
      charts: {
        tripsPerMonth,
        fuelCostTrend,
        expenseCategoryDistribution: expenseCategoryRows.map((row) => ({
          category: EXPENSE_CATEGORY_LABELS[row.category] || row.category,
          categoryCode: row.category,
          count: toNumber(row.count),
          amount: toNumber(row.amount)
        })),
        vehicleStatusDistribution: [
          { status: VEHICLE_STATUS_LABELS.available, count: toNumber(vehicleStatus.available) },
          { status: VEHICLE_STATUS_LABELS.onTrip, count: toNumber(vehicleStatus.on_trip) },
          { status: VEHICLE_STATUS_LABELS.inMaintenance, count: toNumber(vehicleStatus.in_maintenance) },
          { status: VEHICLE_STATUS_LABELS.inactive, count: toNumber(vehicleStatus.inactive) },
          { status: VEHICLE_STATUS_LABELS.retired, count: toNumber(vehicleStatus.retired) }
        ].filter((item) => item.count > 0),
        tripStatusDistribution: tripStatusRows.map((row) => ({
          status: TRIP_STATUS_LABELS[row.status] || row.status,
          statusCode: row.status,
          count: toNumber(row.count)
        })),
        maintenanceStatusDistribution: maintenanceStatusRows.map((row) => ({
          status: MAINTENANCE_STATUS_LABELS[row.status] || row.status,
          statusCode: row.status,
          count: toNumber(row.count)
        }))
      },
      recentActivities: {
        trips: recentTrips.map(mapTripRecord),
        fuelLogs: recentFuelLogs.map(mapFuelRecord),
        maintenanceRecords: recentMaintenance.map(mapMaintenanceRecord),
        expenses: recentExpenses.map(mapExpenseRecord)
      }
    };
  }
};

export default dashboardService;
