import maintenanceModel from '../models/maintenance.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import pool from '../config/db.js';

// Maps UI maintenance types to database ENUM values
const mapUiTypeToDb = (uiType) => {
  const routineTypes = ['Routine Service', 'Oil Change', 'Other'];
  const repairTypes = ['Tyre Replacement', 'Brake Service', 'Engine Repair', 'Accident Repair'];
  if (routineTypes.includes(uiType)) return 'ROUTINE';
  if (repairTypes.includes(uiType)) return 'REPAIR';
  if (uiType === 'Inspection') return 'INSPECTION';
  return 'ROUTINE';
};

// Maps UI status to database status ENUMs
const mapUiStatusToDb = (uiStatus) => {
  const map = {
    'Scheduled': 'SCHEDULED',
    'In Progress': 'IN_PROGRESS',
    'Completed': 'COMPLETED',
    'Cancelled': 'CANCELLED'
  };
  return map[uiStatus] || 'SCHEDULED';
};

// Maps database status ENUMs to UI status labels
const mapDbStatusToUi = (dbStatus) => {
  if (dbStatus === 'SCHEDULED') return 'Scheduled';
  if (dbStatus === 'IN_PROGRESS') return 'In Progress';
  if (dbStatus === 'COMPLETED') return 'Completed';
  if (dbStatus === 'CANCELLED') return 'Cancelled';
  return 'Scheduled';
};

// JSON serializer for notes
const serializeNotes = (serviceCenter = '', estimatedCompletionDate = null, technicianName = '', remarks = '') => {
  return JSON.stringify({
    serviceCenter: serviceCenter || '',
    estimatedCompletionDate: estimatedCompletionDate || null,
    technicianName: technicianName || '',
    remarks: remarks || ''
  });
};

// JSON deserializer for notes
const deserializeNotes = (notesField) => {
  if (!notesField) {
    return { serviceCenter: '', estimatedCompletionDate: null, technicianName: '', remarks: '' };
  }
  try {
    const parsed = JSON.parse(notesField);
    if (parsed && typeof parsed === 'object') {
      return {
        serviceCenter: parsed.serviceCenter || '',
        estimatedCompletionDate: parsed.estimatedCompletionDate || null,
        technicianName: parsed.technicianName || '',
        remarks: parsed.remarks || ''
      };
    }
  } catch (e) {
    // Return raw text if not JSON
  }
  return { serviceCenter: '', estimatedCompletionDate: null, technicianName: '', remarks: notesField };
};

// Formats returned query rows
const formatRow = (r) => {
  if (!r) return null;
  const parsedNotes = deserializeNotes(r.notes);
  const maintenanceDate = r.start_date ? new Date(r.start_date).toISOString().split('T')[0] : '';
  const actualCompletionDate = r.end_date ? new Date(r.end_date).toISOString().split('T')[0] : null;
  const estimatedCompletionDate = parsedNotes.estimatedCompletionDate ? new Date(parsedNotes.estimatedCompletionDate).toISOString().split('T')[0] : null;

  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    vehicle_plate: r.vehicle_plate,
    vehicle_make: r.vehicle_make,
    vehicle_model: r.vehicle_model,
    maintenanceType: r.description, // User interface logs type stored in description
    maintenanceDate,
    estimatedCompletionDate,
    actualCompletionDate,
    cost: parseFloat(r.cost),
    odometerReading: r.odometer_reading,
    status: mapDbStatusToUi(r.status),
    serviceCenter: parsedNotes.serviceCenter,
    technicianName: parsedNotes.technicianName,
    remarks: parsedNotes.remarks,
    creator_name: r.creator_name,
    created_at: r.created_at,
    updated_at: r.updated_at
  };
};

export const maintenanceService = {
  /**
   * Fetches lists of maintenance records
   */
  async getRecords(filters) {
    const rows = await maintenanceModel.findAll(filters);
    return rows.map(formatRow);
  },

  /**
   * Fetches single maintenance record by ID
   */
  async getRecordById(id) {
    const record = await maintenanceModel.findById(id);
    if (!record) {
      throw new AppError('Maintenance record not found.', HttpStatusCodes.NOT_FOUND);
    }
    return formatRow(record);
  },

  /**
   * Creates a new maintenance record
   */
  async createRecord(data, creatorId) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verify vehicle existence and fetch current odometer reading
      const [vehicleRows] = await connection.query('SELECT current_odometer, status FROM vehicles WHERE id = ?', [data.vehicleId]);
      if (vehicleRows.length === 0) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          { field: 'vehicleId', message: 'Vehicle not found.' }
        ]);
      }
      const vehicle = vehicleRows[0];

      // 2. Odometer Reading cannot decrease below current recorded odometer
      if (parseInt(data.odometerReading, 10) < vehicle.current_odometer) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          {
            field: 'odometerReading',
            message: `Odometer Reading cannot be lower than the vehicle's current recorded odometer (${vehicle.current_odometer} km).`
          }
        ]);
      }

      // 3. A vehicle already in maintenance cannot have another active maintenance record
      const hasActive = await maintenanceModel.hasActiveMaintenance(data.vehicleId);
      if (hasActive && (data.status === 'Scheduled' || data.status === 'In Progress')) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          {
            field: 'vehicleId',
            message: 'Vehicle already has another active maintenance record scheduled or in progress.'
          }
        ]);
      }

      // 4. Map UI status/type parameters
      const statusDb = mapUiStatusToDb(data.status);
      const maintenanceTypeDb = mapUiTypeToDb(data.maintenanceType);
      
      const serializedNotes = serializeNotes(
        data.serviceCenter,
        data.estimatedCompletionDate,
        data.technicianName,
        data.remarks
      );

      const recordId = await maintenanceModel.create({
        vehicleId: data.vehicleId,
        maintenanceTypeDb,
        description: data.maintenanceType, // Stores exact UI type text
        cost: data.cost || 0,
        odometerReading: data.odometerReading,
        startDate: data.maintenanceDate,
        endDate: data.actualCompletionDate,
        statusDb,
        notes: serializedNotes,
        createdBy: creatorId
      });

      // 5. Automatic status transition changes:
      // Scheduled or In Progress ➔ update vehicle status to 'IN_MAINTENANCE' (In Shop)
      if (data.status === 'Scheduled' || data.status === 'In Progress') {
        await connection.query("UPDATE vehicles SET status = 'IN_MAINTENANCE' WHERE id = ?", [data.vehicleId]);
      }

      // If created directly in Completed status: update vehicle status back to 'ACTIVE'
      // and update vehicle's current odometer reading to match the maintenance record
      if (data.status === 'Completed') {
        await connection.query(
          "UPDATE vehicles SET status = 'ACTIVE', current_odometer = ? WHERE id = ?",
          [data.odometerReading, data.vehicleId]
        );
      }

      await connection.commit();
      return this.getRecordById(recordId);

    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Updates an existing maintenance record
   */
  async updateRecord(id, data) {
    const record = await maintenanceModel.findById(id);
    if (!record) {
      throw new AppError('Maintenance record not found.', HttpStatusCodes.NOT_FOUND);
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verify vehicle existence and check current odometer reading
      const [vehicleRows] = await connection.query('SELECT current_odometer, status FROM vehicles WHERE id = ?', [data.vehicleId]);
      if (vehicleRows.length === 0) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          { field: 'vehicleId', message: 'Vehicle not found.' }
        ]);
      }
      const vehicle = vehicleRows[0];

      // 2. Odometer Reading cannot decrease below current recorded odometer
      if (parseInt(data.odometerReading, 10) < vehicle.current_odometer) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          {
            field: 'odometerReading',
            message: `Odometer Reading cannot be lower than the vehicle's current recorded odometer (${vehicle.current_odometer} km).`
          }
        ]);
      }

      // 3. A vehicle already in maintenance cannot have another active maintenance record (excluding current record)
      const hasActive = await maintenanceModel.hasActiveMaintenance(data.vehicleId, id);
      if (hasActive && (data.status === 'Scheduled' || data.status === 'In Progress')) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          {
            field: 'vehicleId',
            message: 'Vehicle already has another active maintenance record scheduled or in progress.'
          }
        ]);
      }

      const statusDb = mapUiStatusToDb(data.status);
      const maintenanceTypeDb = mapUiTypeToDb(data.maintenanceType);
      
      const serializedNotes = serializeNotes(
        data.serviceCenter,
        data.estimatedCompletionDate,
        data.technicianName,
        data.remarks
      );

      await maintenanceModel.update(id, {
        vehicleId: data.vehicleId,
        maintenanceTypeDb,
        description: data.maintenanceType,
        cost: data.cost || 0,
        odometerReading: data.odometerReading,
        startDate: data.maintenanceDate,
        endDate: data.actualCompletionDate,
        statusDb,
        notes: serializedNotes
      });

      // 4. Automatic status transition changes:
      // Scheduled or In Progress ➔ update vehicle status to 'IN_MAINTENANCE'
      if (data.status === 'Scheduled' || data.status === 'In Progress') {
        await connection.query("UPDATE vehicles SET status = 'IN_MAINTENANCE' WHERE id = ?", [data.vehicleId]);
      }

      // Completed or Cancelled ➔ update vehicle status back to 'ACTIVE'
      if (data.status === 'Completed' || data.status === 'Cancelled') {
        await connection.query("UPDATE vehicles SET status = 'ACTIVE' WHERE id = ?", [data.vehicleId]);
      }

      // If Completed ➔ additionally update vehicle's current odometer reading if higher
      if (data.status === 'Completed') {
        await connection.query(
          "UPDATE vehicles SET current_odometer = ? WHERE id = ?",
          [data.odometerReading, data.vehicleId]
        );
      }

      await connection.commit();
      return this.getRecordById(id);

    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Deletes a maintenance record
   */
  async deleteRecord(id) {
    const record = await maintenanceModel.findById(id);
    if (!record) {
      throw new AppError('Maintenance record not found.', HttpStatusCodes.NOT_FOUND);
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // If we are deleting a scheduled/in-progress maintenance record, revert the vehicle back to active
      if (record.status === 'SCHEDULED' || record.status === 'IN_PROGRESS') {
        await connection.query("UPDATE vehicles SET status = 'ACTIVE' WHERE id = ?", [record.vehicle_id]);
      }

      await maintenanceModel.delete(id);

      await connection.commit();
      return true;

    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }
  }
};

export default { maintenanceService };
