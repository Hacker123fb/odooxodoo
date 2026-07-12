import pool from '../config/db.js';

export const notificationService = {
  /**
   * Scans operations logs, schedules, and inventory to generate alerts.
   */
  async generateSystemAlerts() {
    let connection;
    try {
      connection = await pool.getConnection();

      // --- Helper to check duplicate notifications in the last 3 days ---
      const hasRecentNotification = async (type, message) => {
        const [rows] = await connection.query(
          `SELECT id FROM notifications 
           WHERE type = ? AND message = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)`,
          [type, message]
        );
        return rows.length > 0;
      };

      const insertNotification = async (type, title, message) => {
        const isDuplicate = await hasRecentNotification(type, message);
        if (isDuplicate) return;

        await connection.query(
          `INSERT INTO notifications (type, title, message, is_read) 
           VALUES (?, ?, ?, 0)`,
          [type, title, message]
        );
      };

      // 1. Maintenance due alerts (Scheduled logs starting in the next 3 days)
      const [maintRows] = await connection.query(`
        SELECT m.id, m.maintenance_type, m.start_date, v.registration_number
        FROM maintenance_logs m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.status = 'SCHEDULED' 
          AND m.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
      `);
      for (const row of maintRows) {
        const type = 'MAINTENANCE_DUE';
        const title = `Maintenance Scheduled: ${row.registration_number}`;
        const message = `Maintenance order of type ${row.maintenance_type} is scheduled to start on ${new Date(row.start_date).toLocaleDateString()} for vehicle ${row.registration_number}.`;
        await insertNotification(type, title, message);
      }

      // 2. Driver license expiry alerts (Expirations in the next 30 days)
      const [driverRows] = await connection.query(`
        SELECT id, employee_id, full_name, license_expiry
        FROM drivers
        WHERE status != 'INACTIVE' 
          AND license_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      `);
      for (const row of driverRows) {
        const type = 'LICENSE_EXPIRY';
        const title = `License Expiring: ${row.full_name}`;
        const message = `The license for driver ${row.full_name} (${row.employee_id}) is due to expire on ${new Date(row.license_expiry).toLocaleDateString()}.`;
        await insertNotification(type, title, message);
      }

      // 3. Vehicle document expiry alerts (Insurance or registration expiring in 30 days)
      const [vehicleRows] = await connection.query(`
        SELECT id, registration_number, insurance_expiry, license_expiry
        FROM vehicles
        WHERE status != 'RETIRED'
          AND (
            insurance_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            OR license_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          )
      `);
      for (const row of vehicleRows) {
        const type = 'DOC_EXPIRY';
        const insuranceExp = row.insurance_expiry ? new Date(row.insurance_expiry) : null;
        const licenseExp = row.license_expiry ? new Date(row.license_expiry) : null;
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + 30);

        if (insuranceExp && insuranceExp >= new Date() && insuranceExp <= limitDate) {
          const title = `Insurance Expiring: ${row.registration_number}`;
          const message = `The vehicle insurance for ${row.registration_number} expires on ${insuranceExp.toLocaleDateString()}.`;
          await insertNotification(type, title, message);
        }
        if (licenseExp && licenseExp >= new Date() && licenseExp <= limitDate) {
          const title = `Permit/License Expiring: ${row.registration_number}`;
          const message = `The road permit/license for vehicle ${row.registration_number} expires on ${licenseExp.toLocaleDateString()}.`;
          await insertNotification(type, title, message);
        }
      }

      // 4. Upcoming trip reminders (scheduled to depart in the next 24 hours)
      const [tripRows] = await connection.query(`
        SELECT t.id, t.trip_number, t.scheduled_departure, v.registration_number, d.full_name
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        WHERE t.status = 'SCHEDULED'
          AND t.scheduled_departure BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
      `);
      for (const row of tripRows) {
        const type = 'UPCOMING_TRIP';
        const title = `Upcoming Trip: ${row.trip_number}`;
        const message = `Trip ${row.trip_number} with driver ${row.full_name} and rig ${row.registration_number} is scheduled to start at ${new Date(row.scheduled_departure).toLocaleTimeString()}.`;
        await insertNotification(type, title, message);
      }

      // 5. Low fuel efficiency warnings (under 4.0 Km/L)
      const [effRows] = await connection.query(`
        SELECT 
          v.id,
          v.registration_number AS vehiclePlate,
          CASE 
            WHEN COALESCE(f_qty.quantity, 0) > 0 THEN ROUND(COALESCE(t_dist.distance, 0) / COALESCE(f_qty.quantity, 0), 2)
            ELSE 0 
          END AS kmPerLitre
        FROM vehicles v
        LEFT JOIN (
          SELECT vehicle_id, COALESCE(SUM(distance_km), 0) AS distance 
          FROM trips 
          WHERE status = 'COMPLETED' 
          GROUP BY vehicle_id
        ) t_dist ON v.id = t_dist.vehicle_id
        LEFT JOIN (
          SELECT vehicle_id, COALESCE(SUM(quantity), 0) AS quantity 
          FROM fuel_logs 
          GROUP BY vehicle_id
        ) f_qty ON v.id = f_qty.vehicle_id
        GROUP BY v.id
        HAVING kmPerLitre > 0 AND kmPerLitre < 4.0
      `);
      for (const row of effRows) {
        const type = 'LOW_FUEL_EFFICIENCY';
        const title = `Low Efficiency: ${row.vehiclePlate}`;
        const message = `Vehicle ${row.vehiclePlate} has an efficiency rating of ${row.kmPerLitre} Km/L, falling below threshold limit (4.0 Km/L).`;
        await insertNotification(type, title, message);
      }

      // 6. High maintenance cost alerts (cost exceeding ₹50,000)
      const [costRows] = await connection.query(`
        SELECT m.id, m.cost, m.maintenance_type, v.registration_number
        FROM maintenance_logs m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.status = 'COMPLETED' AND m.cost > 50000
      `);
      for (const row of costRows) {
        const type = 'HIGH_MAINTENANCE_COST';
        const title = `High Service Cost: ${row.registration_number}`;
        const message = `A maintenance record (${row.maintenance_type}) for vehicle ${row.registration_number} incurred a cost of ₹${Number(row.cost).toLocaleString()}, exceeding threshold limit (₹50,000).`;
        await insertNotification(type, title, message);
      }

    } catch (err) {
      console.error('[NOTIFICATIONS SERVICE] Diagnostic scanner error:', err.message);
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Retrieves all notifications sorted by newest first.
   */
  async findAll() {
    // Generate alerts dynamically prior to returning rows
    await this.generateSystemAlerts();

    const sql = 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50';
    const [rows] = await pool.query(sql);
    return rows;
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(id) {
    const sql = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
    await pool.query(sql, [id]);
  },

  /**
   * Marks all notifications as read.
   */
  async markAllAsRead() {
    const sql = 'UPDATE notifications SET is_read = 1 WHERE is_read = 0';
    await pool.query(sql);
  }
};

export default notificationService;
