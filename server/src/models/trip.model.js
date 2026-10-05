import pool from '../config/db.js';

/**
 * Database queries abstraction for the Trips table
 */
export const tripModel = {
  /**
   * Retrieves all trips matching optional filters and search patterns
   */
  async findAll({ search = '', status = '', vehicleId = '', driverId = '', startDate = '', endDate = '', page, limit } = {}) {
    let sql = `
      SELECT t.*, 
             v.registration_number AS vehicle_plate,
             vm.name AS vehicle_model,
             vma.name AS vehicle_make,
             d.full_name AS driver_name,
             d.employee_id AS driver_code,
             u.full_name AS creator_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN drivers d ON t.driver_id = d.id
      JOIN users u ON t.created_by = u.id
    `;
    
    const conditions = [];
    const params = [];

    // Search query matches trip number, driver name, vehicle plate, or locations
    if (search.trim() !== '') {
      conditions.push('(t.trip_number LIKE ? OR d.full_name LIKE ? OR v.registration_number LIKE ? OR t.source_location LIKE ? OR t.destination_location LIKE ?)');
      const wild = `%${search}%`;
      params.push(wild, wild, wild, wild, wild);
    }

    if (status.trim() !== '') {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (vehicleId && vehicleId.toString().trim() !== '') {
      conditions.push('t.vehicle_id = ?');
      params.push(parseInt(vehicleId, 10));
    }

    if (driverId && driverId.toString().trim() !== '') {
      conditions.push('t.driver_id = ?');
      params.push(parseInt(driverId, 10));
    }

    // Departure Date Range filters
    if (startDate.trim() !== '') {
      conditions.push('t.scheduled_departure >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate.trim() !== '') {
      conditions.push('t.scheduled_departure <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
      const offset = (pageNum - 1) * limitNum;

      const countSql = `
        SELECT COUNT(*) AS total
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        ${whereClause}
      `;
      const [countRows] = await pool.query(countSql, params);
      const total = parseInt(countRows[0]?.total || 0, 10);
      const totalPages = Math.ceil(total / limitNum) || 1;

      sql += whereClause + ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
      const [rows] = await pool.query(sql, [...params, limitNum, offset]);

      return {
        rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        }
      };
    }

    sql += whereClause + ' ORDER BY t.created_at DESC LIMIT 100';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieves details for a single trip
   */
  async findById(id) {
    const sql = `
      SELECT t.*, 
             v.registration_number AS vehicle_plate,
             vm.name AS vehicle_model,
             vma.name AS vehicle_make,
             d.full_name AS driver_name,
             d.employee_id AS driver_code,
             u.full_name AS creator_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN drivers d ON t.driver_id = d.id
      JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find driver by ID with licensing details
   */
  async findDriverById(id) {
    const sql = `
      SELECT id, full_name, employee_id, license_number, license_class, license_expiry, status
      FROM drivers
      WHERE id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find vehicle by ID with status
   */
  async findVehicleById(id) {
    const sql = `
      SELECT v.id, v.registration_number, v.status, vm.name AS model_name
      FROM vehicles v
      JOIN vehicle_models vm ON v.model_id = vm.id
      WHERE v.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Check if driver has an overlapping active or scheduled trip
   */
  async findOverlappingDriverTrip(driverId, departure, arrival, excludeTripId = null) {
    let sql = `
      SELECT id, trip_number, scheduled_departure, scheduled_arrival, status
      FROM trips
      WHERE driver_id = ?
        AND status IN ('SCHEDULED', 'IN_PROGRESS', 'DELAYED')
        AND scheduled_departure < ?
        AND scheduled_arrival > ?
    `;
    const params = [driverId, arrival, departure];
    if (excludeTripId !== null) {
      sql += ' AND id != ?';
      params.push(excludeTripId);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Check if vehicle has an overlapping active or scheduled trip
   */
  async findOverlappingVehicleTrip(vehicleId, departure, arrival, excludeTripId = null) {
    let sql = `
      SELECT id, trip_number, scheduled_departure, scheduled_arrival, status
      FROM trips
      WHERE vehicle_id = ?
        AND status IN ('SCHEDULED', 'IN_PROGRESS', 'DELAYED')
        AND scheduled_departure < ?
        AND scheduled_arrival > ?
    `;
    const params = [vehicleId, arrival, departure];
    if (excludeTripId !== null) {
      sql += ' AND id != ?';
      params.push(excludeTripId);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Insert new trip record
   */
  async create({ tripNumber, vehicleId, driverId, sourceLocation, destinationLocation, scheduledDeparture, scheduledArrival, distanceKm, status, notes, createdBy }) {
    const sql = `
      INSERT INTO trips (trip_number, vehicle_id, driver_id, source_location, destination_location, scheduled_departure, scheduled_arrival, distance_km, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      tripNumber,
      vehicleId,
      driverId,
      sourceLocation,
      destinationLocation,
      scheduledDeparture,
      scheduledArrival,
      distanceKm,
      status,
      notes,
      createdBy
    ]);
    return result.insertId;
  },

  /**
   * Update existing trip record
   */
  async update(id, { vehicleId, driverId, sourceLocation, destinationLocation, scheduledDeparture, scheduledArrival, distanceKm, status, notes, actualDeparture, actualArrival, cancellationReason }) {
    const sql = `
      UPDATE trips
      SET vehicle_id = ?, driver_id = ?, source_location = ?, destination_location = ?, scheduled_departure = ?, scheduled_arrival = ?, distance_km = ?, status = ?, notes = ?, actual_departure = ?, actual_arrival = ?, cancellation_reason = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      vehicleId,
      driverId,
      sourceLocation,
      destinationLocation,
      scheduledDeparture,
      scheduledArrival,
      distanceKm,
      status,
      notes,
      actualDeparture || null,
      actualArrival || null,
      cancellationReason || null,
      id
    ]);
  },

  /**
   * Delete trip from inventory
   */
  async delete(id) {
    const sql = 'DELETE FROM trips WHERE id = ?';
    await pool.query(sql, [id]);
  },

  /**
   * Retrieve active vehicles that have no scheduled or in-progress trips (including assigned vehicle if editing)
   */
  async getAvailableVehicles(excludeTripId = null) {
    let sql = `
      SELECT v.id, v.registration_number, vm.name AS model_name, vma.name AS make_name, vt.name AS type_name
      FROM vehicles v
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN vehicle_types vt ON vm.vehicle_type_id = vt.id
      WHERE (
        (
          v.status = 'ACTIVE'
          AND NOT EXISTS (
            SELECT 1 FROM trips t 
            WHERE t.vehicle_id = v.id 
              AND t.status IN ('SCHEDULED', 'IN_PROGRESS', 'DELAYED')
              ${excludeTripId !== null ? 'AND t.id != ?' : ''}
          )
        )
        ${excludeTripId !== null ? 'OR v.id = (SELECT vehicle_id FROM trips WHERE id = ?)' : ''}
      )
      ORDER BY vma.name, vm.name
    `;
    
    const params = [];
    if (excludeTripId !== null) {
      params.push(excludeTripId);
      params.push(excludeTripId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieve available drivers (including assigned driver if editing)
   */
  async getAvailableDrivers(excludeTripId = null, targetArrival = null) {
    let sql = `
      SELECT d.id, d.full_name, d.employee_id, d.license_number, d.license_class, d.license_expiry
      FROM drivers d
      WHERE (
        (
          d.status = 'AVAILABLE'
          ${targetArrival ? 'AND d.license_expiry > ?' : 'AND d.license_expiry > CURRENT_DATE'}
          AND NOT EXISTS (
            SELECT 1 FROM trips t 
            WHERE t.driver_id = d.id 
              AND t.status IN ('SCHEDULED', 'IN_PROGRESS', 'DELAYED')
              ${excludeTripId !== null ? 'AND t.id != ?' : ''}
          )
        )
        ${excludeTripId !== null ? 'OR d.id = (SELECT driver_id FROM trips WHERE id = ?)' : ''}
      )
      ORDER BY d.full_name
    `;
    
    const params = [];
    if (targetArrival) {
      params.push(targetArrival);
    }
    if (excludeTripId !== null) {
      params.push(excludeTripId);
      params.push(excludeTripId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieve depots / customer locations
   */
  async getLocations() {
    const sql = 'SELECT id, name, city, state FROM locations WHERE is_active = 1 ORDER BY name';
    const [rows] = await pool.query(sql);
    return rows;
  }
};

export default tripModel;
