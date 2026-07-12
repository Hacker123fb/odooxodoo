import driverModel from '../models/driver.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import pool from '../config/db.js';

// Maps UI status labels to DB ENUM values
const mapUiStatusToDb = (uiStatus) => {
  const map = {
    'Available': 'AVAILABLE',
    'On Trip': 'ON_TRIP',
    'Off Duty': 'INACTIVE',
    'Suspended': 'SUSPENDED'
  };
  return map[uiStatus] || 'AVAILABLE';
};

// Maps DB status ENUM values to UI status labels
const mapDbStatusToUi = (dbStatus) => {
  if (dbStatus === 'AVAILABLE') return 'Available';
  if (dbStatus === 'ON_TRIP') return 'On Trip';
  if (dbStatus === 'ON_LEAVE' || dbStatus === 'INACTIVE') return 'Off Duty';
  if (dbStatus === 'SUSPENDED') return 'Suspended';
  return 'Available';
};

// JSON serializer for safety score inside notes column
const serializeNotes = (safetyScore, userNotes = '') => {
  return JSON.stringify({
    safetyScore: safetyScore !== undefined && safetyScore !== null ? parseInt(safetyScore, 10) : 100,
    userNotes: userNotes || ''
  });
};

// JSON deserializer for safety score from notes column
const deserializeNotes = (notesField) => {
  if (!notesField) {
    return { safetyScore: 100, userNotes: '' };
  }
  try {
    const parsed = JSON.parse(notesField);
    if (parsed && typeof parsed === 'object' && 'safetyScore' in parsed) {
      return {
        safetyScore: parsed.safetyScore,
        userNotes: parsed.userNotes || ''
      };
    }
  } catch (e) {
    // Return default values if field contains raw text
  }
  return { safetyScore: 100, userNotes: notesField };
};

export const driverService = {
  /**
   * Fetches lists of drivers and deserializes notes/safety scores
   */
  async getDrivers(filters) {
    const rows = await driverModel.findAll(filters);
    return rows.map(d => {
      const { safetyScore, userNotes } = deserializeNotes(d.notes);
      return {
        ...d,
        safety_score: safetyScore,
        user_notes: userNotes,
        ui_status: mapDbStatusToUi(d.status)
      };
    });
  },

  /**
   * Fetches single driver details
   */
  async getDriverById(id) {
    const driver = await driverModel.findById(id);
    if (!driver) {
      throw new AppError('Driver not found.', HttpStatusCodes.NOT_FOUND);
    }
    const { safetyScore, userNotes } = deserializeNotes(driver.notes);
    return {
      ...driver,
      safety_score: safetyScore,
      user_notes: userNotes,
      ui_status: mapDbStatusToUi(driver.status)
    };
  },

  /**
   * Registers a new driver profile
   */
  async createDriver(data, creatorId) {
    const errors = [];

    // 1. Verify employee ID uniqueness
    const employeeExists = await driverModel.findByEmployeeId(data.employee_id);
    if (employeeExists) {
      errors.push({ field: 'employeeCode', message: 'Employee Code already exists.' });
    }

    // 2. Verify email uniqueness
    const emailExists = await driverModel.findByEmail(data.email);
    if (emailExists) {
      errors.push({ field: 'email', message: 'Email is already registered.' });
    }

    // 3. Verify phone uniqueness
    const phoneExists = await driverModel.findByPhone(data.phone);
    if (phoneExists) {
      errors.push({ field: 'mobileNumber', message: 'Mobile number already exists.' });
    }

    // 4. Verify license uniqueness
    const licenseExists = await driverModel.findByLicense(data.license_number);
    if (licenseExists) {
      errors.push({ field: 'licenseNumber', message: 'License number already exists.' });
    }

    // If any database validation conflicts were found, throw structured validation error response
    if (errors.length > 0) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, errors);
    }

    // Serialize safety score and notes
    const serializedNotes = serializeNotes(data.safety_score, data.user_notes);

    // Map UI status to DB status
    const dbStatus = mapUiStatusToDb(data.status);

    const driverId = await driverModel.create({
      employeeId: data.employee_id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      licenseNumber: data.license_number,
      licenseExpiry: data.license_expiry,
      licenseClass: data.license_class,
      status: dbStatus,
      notes: serializedNotes,
      createdBy: creatorId
    });

    return this.getDriverById(driverId);
  },

  /**
   * Updates an existing driver profile
   */
  async updateDriver(id, data) {
    // Check existence
    const driver = await driverModel.findById(id);
    if (!driver) {
      throw new AppError('Driver not found.', HttpStatusCodes.NOT_FOUND);
    }

    const errors = [];

    // 1. Verify employee ID uniqueness
    const employeeDuplicate = await driverModel.findByEmployeeId(data.employee_id, id);
    if (employeeDuplicate) {
      errors.push({ field: 'employeeCode', message: 'Employee Code already exists.' });
    }

    // 2. Verify email uniqueness
    const emailDuplicate = await driverModel.findByEmail(data.email, id);
    if (emailDuplicate) {
      errors.push({ field: 'email', message: 'Email is already registered.' });
    }

    // 3. Verify phone uniqueness
    const phoneDuplicate = await driverModel.findByPhone(data.phone, id);
    if (phoneDuplicate) {
      errors.push({ field: 'mobileNumber', message: 'Mobile number already exists.' });
    }

    // 4. Verify license uniqueness
    const licenseDuplicate = await driverModel.findByLicense(data.license_number, id);
    if (licenseDuplicate) {
      errors.push({ field: 'licenseNumber', message: 'License number already exists.' });
    }

    // If any database validation conflicts were found, throw structured validation error response
    if (errors.length > 0) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, errors);
    }

    // Serialize safety score and notes
    const serializedNotes = serializeNotes(data.safety_score, data.user_notes);

    // Map status
    const dbStatus = mapUiStatusToDb(data.status);

    await driverModel.update(id, {
      employeeId: data.employee_id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      licenseNumber: data.license_number,
      licenseExpiry: data.license_expiry,
      licenseClass: data.license_class,
      status: dbStatus,
      notes: serializedNotes
    });

    return this.getDriverById(id);
  },

  /**
   * Deletes a driver profile if not linked to active trips
   */
  async deleteDriver(id) {
    const driver = await driverModel.findById(id);
    if (!driver) {
      throw new AppError('Driver not found.', HttpStatusCodes.NOT_FOUND);
    }

    const [trips] = await pool.query(
      `SELECT id FROM trips 
       WHERE driver_id = ? AND status IN ('SCHEDULED', 'IN_PROGRESS', 'DELAYED') 
       LIMIT 1`,
      [id]
    );

    if (trips.length > 0) {
      throw new AppError('Cannot delete driver. Operator is associated with active or scheduled trips.', HttpStatusCodes.BAD_REQUEST);
    }

    await driverModel.delete(id);
    return true;
  }
};

export default driverService;
