import fuelModel from '../models/fuel.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import pool from '../config/db.js';

// JSON serializer for notes
const serializeNotes = (fuelStation = '', paymentMethod = 'Cash', remarks = '') => {
  return JSON.stringify({
    fuelStation: fuelStation || '',
    paymentMethod: paymentMethod || 'Cash',
    remarks: remarks || ''
  });
};

// JSON deserializer for notes
const deserializeNotes = (notesField) => {
  if (!notesField) {
    return { fuelStation: '', paymentMethod: 'Cash', remarks: '' };
  }
  try {
    const parsed = JSON.parse(notesField);
    if (parsed && typeof parsed === 'object') {
      return {
        fuelStation: parsed.fuelStation || '',
        paymentMethod: parsed.paymentMethod || 'Cash',
        remarks: parsed.remarks || ''
      };
    }
  } catch (e) {
    // Return raw text if not JSON
  }
  return { fuelStation: '', paymentMethod: 'Cash', remarks: notesField };
};

// Formats returned query rows to camelCase
const formatRow = (r) => {
  if (!r) return null;
  const parsedNotes = deserializeNotes(r.notes);
  const fuelDate = r.fueling_date ? new Date(r.fueling_date).toISOString().split('T')[0] : '';

  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    vehicle_plate: r.vehicle_plate,
    vehicle_make: r.vehicle_make,
    vehicle_model: r.vehicle_model,
    tripId: r.trip_id,
    trip_code: r.trip_code,
    driverId: r.driver_id,
    fuelTypeId: r.fuel_type_id,
    fuel_type_label: r.fuel_type_label,
    fuelQuantity: parseFloat(r.quantity),
    costPerLitre: parseFloat(r.price_per_unit),
    totalCost: parseFloat(r.total_cost),
    odometerReading: r.odometer_reading,
    fuelDate,
    invoiceNumber: r.receipt_number,
    fuelStation: parsedNotes.fuelStation,
    paymentMethod: parsedNotes.paymentMethod,
    remarks: parsedNotes.remarks,
    creator_name: r.creator_name,
    created_at: r.created_at,
    updated_at: r.updated_at
  };
};

export const fuelService = {
  /**
   * Fetches lists of fuel log records
   */
  async getRecords(filters) {
    const rows = await fuelModel.findAll(filters);
    return rows.map(formatRow);
  },

  /**
   * Fetches single fuel log by ID
   */
  async getRecordById(id) {
    const record = await fuelModel.findById(id);
    if (!record) {
      throw new AppError('Fuel log not found.', HttpStatusCodes.NOT_FOUND);
    }
    return formatRow(record);
  },

  /**
   * Registers a new fuel log
   */
  async createRecord(data, creatorId) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verify vehicle existence and fetch current odometer reading
      const [vehicleRows] = await connection.query('SELECT current_odometer FROM vehicles WHERE id = ?', [data.vehicleId]);
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

      // 3. Invoice Number uniqueness checking
      if (data.invoiceNumber) {
        const duplicate = await fuelModel.findByInvoice(data.invoiceNumber);
        if (duplicate) {
          throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
            { field: 'invoiceNumber', message: 'Invoice Number is already registered.' }
          ]);
        }
      }

      // 4. Dynamically lookup driverId from trip if tripId is provided
      let driverId = null;
      if (data.tripId) {
        const [tripRows] = await connection.query('SELECT driver_id FROM trips WHERE id = ?', [data.tripId]);
        if (tripRows.length > 0) {
          driverId = tripRows[0].driver_id;
        }
      }

      // 5. Compute Total Cost (auto-calculated)
      const quantity = parseFloat(data.fuelQuantity);
      const pricePerUnit = parseFloat(data.costPerLitre);
      const totalCost = parseFloat((quantity * pricePerUnit).toFixed(2));

      const serializedNotes = serializeNotes(
        data.fuelStation,
        data.paymentMethod,
        data.remarks
      );

      const recordId = await fuelModel.create({
        vehicleId: data.vehicleId,
        driverId,
        tripId: data.tripId,
        fuelTypeId: data.fuelTypeId,
        quantity,
        pricePerUnit,
        totalCost,
        odometerReading: data.odometerReading,
        fuelingDate: data.fuelDate,
        receiptNumber: data.invoiceNumber,
        notes: serializedNotes,
        createdBy: creatorId
      });

      // 6. Update vehicle's odometer if greater than the current value
      if (parseInt(data.odometerReading, 10) > vehicle.current_odometer) {
        await connection.query(
          'UPDATE vehicles SET current_odometer = ? WHERE id = ?',
          [parseInt(data.odometerReading, 10), data.vehicleId]
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
   * Updates an existing fuel log
   */
  async updateRecord(id, data) {
    const record = await fuelModel.findById(id);
    if (!record) {
      throw new AppError('Fuel log not found.', HttpStatusCodes.NOT_FOUND);
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verify vehicle existence and check current odometer reading
      const [vehicleRows] = await connection.query('SELECT current_odometer FROM vehicles WHERE id = ?', [data.vehicleId]);
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

      // 3. Invoice Number uniqueness checking (excluding current log)
      if (data.invoiceNumber) {
        const duplicate = await fuelModel.findByInvoice(data.invoiceNumber, id);
        if (duplicate) {
          throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
            { field: 'invoiceNumber', message: 'Invoice Number is already registered.' }
          ]);
        }
      }

      // 4. Dynamically lookup driverId from trip
      let driverId = null;
      if (data.tripId) {
        const [tripRows] = await connection.query('SELECT driver_id FROM trips WHERE id = ?', [data.tripId]);
        if (tripRows.length > 0) {
          driverId = tripRows[0].driver_id;
        }
      }

      // 5. Compute Total Cost
      const quantity = parseFloat(data.fuelQuantity);
      const pricePerUnit = parseFloat(data.costPerLitre);
      const totalCost = parseFloat((quantity * pricePerUnit).toFixed(2));

      const serializedNotes = serializeNotes(
        data.fuelStation,
        data.paymentMethod,
        data.remarks
      );

      await fuelModel.update(id, {
        vehicleId: data.vehicleId,
        driverId,
        tripId: data.tripId,
        fuelTypeId: data.fuelTypeId,
        quantity,
        pricePerUnit,
        totalCost,
        odometerReading: data.odometerReading,
        fuelingDate: data.fuelDate,
        receiptNumber: data.invoiceNumber,
        notes: serializedNotes
      });

      // 6. Update vehicle's odometer if greater than the current value
      if (parseInt(data.odometerReading, 10) > vehicle.current_odometer) {
        await connection.query(
          'UPDATE vehicles SET current_odometer = ? WHERE id = ?',
          [parseInt(data.odometerReading, 10), data.vehicleId]
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
   * Deletes a fuel log
   */
  async deleteRecord(id) {
    const record = await fuelModel.findById(id);
    if (!record) {
      throw new AppError('Fuel log not found.', HttpStatusCodes.NOT_FOUND);
    }

    await fuelModel.delete(id);
    return true;
  },

  /**
   * Retrieves dropdown options lists for vehicles, fuel types, and trips
   */
  async getMetadataOptions() {
    const [vehicles] = await pool.query(
      `SELECT v.id, v.registration_number, vm.name AS model_name, vma.name AS make_name, v.current_odometer
       FROM vehicles v
       JOIN vehicle_models vm ON v.model_id = vm.id
       JOIN vehicle_makes vma ON vm.make_id = vma.id
       WHERE v.status = 'ACTIVE'
       ORDER BY v.registration_number`
    );

    const [trips] = await pool.query(
      `SELECT t.id, t.trip_number, t.source_location, t.destination_location
       FROM trips t
       WHERE t.status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED')
       ORDER BY t.created_at DESC`
    );

    const fuelTypes = await fuelModel.getFuelTypes();

    return { vehicles, trips, fuelTypes };
  }
};

export default { fuelService };
