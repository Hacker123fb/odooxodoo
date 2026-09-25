import pool from '../config/db.js';

/**
 * Database queries abstraction for the Trips table
 */
export const tripModel = {
  /**
   * Retrieves all trips matching optional filters and search patterns
   */
  async findAll({ search = '', status = '', vehicleId = '', driverId = '', startDate = '', endDate = '' } = {}) {
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

    if (vehicleId.trim() !== '') {
      conditions.push('t.vehicle_id = ?');
      params.push(parseInt(vehicleId, 10));
    }

    if (driverId.trim() !== '') {
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

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY t.created_at DESC';

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
   * Retrieve active vehicles that have no scheduled or in-progress trips
   */
  async getAvailableVehicles(excludeTripId = null) {
    let sql = `
      SELECT v.id, v.registration_number, vm.name AS model_name, vma.name AS make_name, vt.name AS type_name
      FROM vehicles v
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN vehicle_types vt ON vm.vehicle_type_id = vt.id
      WHERE v.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM trips t 
          WHERE t.vehicle_id = v.id 
            AND t.status IN ('SCHEDULED', 'IN_PROGRESS', 'DELAYED')
    `;
    
    const params = [];
    if (excludeTripId !== null) {
      sql += ' AND t.id != ?';
      params.push(excludeTripId);
    }
    
    sql += ' ) ORDER BY vma.name, vm.name';
    
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieve available drivers (no active trips and license not expired)
   */
  async getAvailableDrivers(excludeTripId = null, targetArrival = null) {
    let sql = `
      SELECT d.id, d.full_name, d.employee_id, d.license_number, d.license_class, d.license_expiry
      FROM drivers d
      WHERE d.status = 'AVAILABLE'
    `;
    
    const params = [];
    if (targetArrival) {
      sql += ' AND d.license_expiry > ?';
      params.push(targetArrival);
    } else {
      sql += ' AND d.license_expiry > CURRENT_DATE';
    }

    sql += `
        AND NOT EXISTS (
          SELECT 1 FROM trips t 
          WHERE t.driver_id = d.id 
            AND t.status IN ('SCHEDULED', 'IN_PROGRESS', 'DELAYED')
    `;
    
    if (excludeTripId !== null) {
      sql += ' AND t.id != ?';
      params.push(excludeTripId);
    }
    
    sql += ' ) ORDER BY d.full_name';
    
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
