import vehicleModel from '../models/vehicle.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import pool from '../config/db.js';

// Maps UI status to DB status ENUM
const mapUiStatusToDb = (uiStatus) => {
  const map = {
    'Available': 'ACTIVE',
    'In Shop': 'IN_MAINTENANCE',
    'Retired': 'RETIRED'
  };
  return map[uiStatus] || 'ACTIVE';
};

// Maps DB status and active trip state back to UI status labels
const mapDbStatusToUi = (dbStatus, isOnTrip) => {
  if (dbStatus === 'ACTIVE' && isOnTrip) return 'On Trip';
  if (dbStatus === 'ACTIVE') return 'Available';
  if (dbStatus === 'IN_MAINTENANCE') return 'In Shop';
  if (dbStatus === 'RETIRED') return 'Retired';
  return 'Available';
};

export const vehicleService = {
  /**
   * Fetches lists of vehicles and resolves UI status labels
   */
  async getVehicles(filters) {
    const result = await vehicleModel.findAll(filters);
    const rows = Array.isArray(result) ? result : (result.rows || []);
    const mapped = rows.map(v => ({
      ...v,
      ui_status: mapDbStatusToUi(v.status, v.is_on_trip)
    }));

    if (result && result.pagination) {
      return { data: mapped, pagination: result.pagination };
    }
    return mapped;
  },

  /**
   * Fetches single vehicle details
   */
  async getVehicleById(id) {
    const vehicle = await vehicleModel.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found.', HttpStatusCodes.NOT_FOUND);
    }
    return {
      ...vehicle,
      ui_status: mapDbStatusToUi(vehicle.status, vehicle.is_on_trip)
    };
  },

  /**
   * Registers a new vehicle in the database
   */
  async createVehicle(data, creatorId) {
    // 1. Verify plate uniqueness
    const exists = await vehicleModel.findByRegistration(data.registration_number);
    if (exists) {
      throw new AppError(
        `Vehicle with registration number '${data.registration_number}' is already registered.`,
        HttpStatusCodes.CONFLICT
      );
    }

    // 2. Map UI status input
    const dbStatus = mapUiStatusToDb(data.status);

    const vehicleId = await vehicleModel.create({
      registrationNumber: data.registration_number,
      modelId: data.model_id,
      fuelTypeId: data.fuel_type_id,
      year: data.year,
      capacity: data.capacity,
      odometer: data.current_odometer,
      price: data.purchase_price,
      status: dbStatus,
      createdBy: creatorId
    });

    return this.getVehicleById(vehicleId);
  },

  /**
   * Updates an existing vehicle
   */
  async updateVehicle(id, data) {
    // 1. Fetch current vehicle record
    const vehicle = await vehicleModel.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found.', HttpStatusCodes.NOT_FOUND);
    }

    // 2. Check plate duplicates
    const duplicate = await vehicleModel.findByRegistration(data.registration_number, id);
    if (duplicate) {
      throw new AppError(
        `Registration number '${data.registration_number}' is already taken by another vehicle.`,
        HttpStatusCodes.CONFLICT
      );
    }

    // 3. Business Rule: "Retired vehicles cannot be edited except status."
    if (vehicle.status === 'RETIRED') {
      const dbStatusTarget = mapUiStatusToDb(data.status);
      
      // If the user tries to update anything besides the status, throw bad request error
      const fieldsChanged = 
        vehicle.registration_number !== data.registration_number ||
        vehicle.model_id !== parseInt(data.model_id, 10) ||
        vehicle.fuel_type_id !== parseInt(data.fuel_type_id, 10) ||
        vehicle.year !== parseInt(data.year, 10) ||
        vehicle.capacity !== parseInt(data.capacity, 10) ||
        vehicle.current_odometer !== parseInt(data.current_odometer, 10) ||
        parseFloat(vehicle.purchase_price) !== parseFloat(data.purchase_price);

      if (fieldsChanged) {
        throw new AppError(
          'Business Rule Violation: Retired vehicles cannot be edited except for their status.',
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    // 4. Odometer reading cannot decrease
    if (parseInt(data.current_odometer, 10) < vehicle.current_odometer) {
      throw new AppError(
        `Odometer reading cannot decrease below the current recorded value (${vehicle.current_odometer} km).`,
        HttpStatusCodes.BAD_REQUEST,
        [{ field: 'current_odometer', message: `Odometer cannot decrease below the current recorded value (${vehicle.current_odometer} km).` }]
      );
    }

    // 5. Map UI status
    const dbStatus = mapUiStatusToDb(data.status);

    // 6. Cannot retire or send to maintenance a vehicle currently on an active trip
    if ((dbStatus === 'RETIRED' || dbStatus === 'IN_MAINTENANCE') && vehicle.status === 'ACTIVE') {
      const [activeTrips] = await pool.query("SELECT trip_number FROM trips WHERE vehicle_id = ? AND status = 'IN_PROGRESS'", [id]);
      if (activeTrips.length > 0) {
        throw new AppError(
          `Vehicle cannot be set to ${data.status} while actively deployed on Trip ${activeTrips[0].trip_number}.`,
          HttpStatusCodes.BAD_REQUEST,
          [{ field: 'status', message: `Vehicle is currently active on Trip ${activeTrips[0].trip_number}. Complete or cancel the trip first.` }]
        );
      }
    }

    await vehicleModel.update(id, {
      registrationNumber: data.registration_number,
      modelId: data.model_id,
      fuelTypeId: data.fuel_type_id,
      year: data.year,
      capacity: data.capacity,
      odometer: data.current_odometer,
      price: data.purchase_price,
      status: dbStatus
    });

    return this.getVehicleById(id);
  },

  /**
   * Removes a vehicle if not associated with active scheduled trips
   */
  async deleteVehicle(id) {
    // 1. Verify existence
    const vehicle = await vehicleModel.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found.', HttpStatusCodes.NOT_FOUND);
    }

    // 2. Business Rule: Cannot delete a vehicle tied to active/scheduled trips
    const [trips] = await pool.query(
      `SELECT id FROM trips 
       WHERE vehicle_id = ? AND status IN ('SCHEDULED', 'IN_PROGRESS', 'DELAYED') 
       LIMIT 1`,
      [id]
    );

    if (trips.length > 0) {
      throw new AppError(
        'Cannot delete vehicle. It is associated with scheduled or active trips.',
        HttpStatusCodes.BAD_REQUEST
      );
    }

    await vehicleModel.delete(id);
    return true;
  },

  /**
   * Exposes dropdown options metadata
   */
  async getMetadataOptions() {
    const [models, fuelTypes, types] = await Promise.all([
      vehicleModel.getModels(),
      vehicleModel.getFuelTypes(),
      vehicleModel.getTypes()
    ]);

    return { models, fuelTypes, types };
  }
};

export default vehicleService;
