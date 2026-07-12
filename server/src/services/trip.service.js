import tripModel from '../models/trip.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import pool from '../config/db.js';

// JSON serializer for estimated fuel and passenger/cargo text inside notes
const serializeNotes = (estimatedFuel = null, cargoDesc = '', userRemarks = '') => {
  return JSON.stringify({
    estimatedFuel: estimatedFuel !== undefined && estimatedFuel !== null ? parseFloat(estimatedFuel) : null,
    cargoPassengerDesc: cargoDesc || '',
    userRemarks: userRemarks || ''
  });
};

// JSON deserializer for notes
const deserializeNotes = (notesField) => {
  if (!notesField) {
    return { estimated_fuel: null, cargo_passenger_desc: '', user_remarks: '' };
  }
  try {
    const parsed = JSON.parse(notesField);
    if (parsed && typeof parsed === 'object') {
      return {
        estimated_fuel: parsed.estimatedFuel ?? null,
        cargo_passenger_desc: parsed.cargoPassengerDesc ?? '',
        user_remarks: parsed.userRemarks ?? ''
      };
    }
  } catch (e) {
    // Return raw text if not JSON
  }
  return { estimated_fuel: null, cargo_passenger_desc: '', user_remarks: notesField };
};

// Helper to update driver status
const updateDriverStatus = async (connection, driverId, status) => {
  await connection.query('UPDATE drivers SET status = ? WHERE id = ?', [status, driverId]);
};

export const tripService = {
  /**
   * Fetches lists of trips and deserializes notes
   */
  async getTrips(filters) {
    const rows = await tripModel.findAll(filters);
    return rows.map(t => {
      const parsedNotes = deserializeNotes(t.notes);
      return {
        ...t,
        ...parsedNotes
      };
    });
  },

  /**
   * Fetches single trip details
   */
  async getTripById(id) {
    const trip = await tripModel.findById(id);
    if (!trip) {
      throw new AppError('Trip not found.', HttpStatusCodes.NOT_FOUND);
    }
    const parsedNotes = deserializeNotes(trip.notes);
    return {
      ...trip,
      ...parsedNotes
    };
  },

  /**
   * Schedules a new trip
   */
  async createTrip(data, creatorId) {
    // 1. Verify vehicle is available
    const availableVehicles = await tripModel.getAvailableVehicles();
    const vehicleIsAvailable = availableVehicles.some(v => v.id === parseInt(data.vehicle_id, 10));
    if (!vehicleIsAvailable) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
        { field: 'vehicle_id', message: 'The selected vehicle is currently not available for trip assignment.' }
      ]);
    }

    // 2. Verify driver is available
    const availableDrivers = await tripModel.getAvailableDrivers();
    const driverIsAvailable = availableDrivers.some(d => d.id === parseInt(data.driver_id, 10));
    if (!driverIsAvailable) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
        { field: 'driver_id', message: 'The selected driver is currently not available or holds an expired license.' }
      ]);
    }

    // 3. Generate unique Trip Number (TRP-YYYYMMDD-RAND)
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const tripNumber = `TRP-${yyyymmdd}-${rand}`;

    // 4. Serialize estimated fuel and details inside notes
    const serializedNotes = serializeNotes(
      data.estimated_fuel,
      data.cargo_passenger_desc,
      data.user_notes
    );

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const tripId = await tripModel.create({
        tripNumber,
        vehicleId: data.vehicle_id,
        driverId: data.driver_id,
        originId: data.origin_id,
        destinationId: data.destination_id,
        scheduledDeparture: data.scheduled_departure,
        scheduledArrival: data.scheduled_arrival,
        distanceKm: data.distance_km,
        status: data.status || 'SCHEDULED',
        notes: serializedNotes,
        createdBy: creatorId
      });

      // 5. Automatic status transition updates: If starts in progress immediately
      if (data.status === 'IN_PROGRESS') {
        await updateDriverStatus(connection, data.driver_id, 'ON_TRIP');
        // Update departure logs
        await connection.query('UPDATE trips SET actual_departure = CURRENT_TIMESTAMP WHERE id = ?', [tripId]);
      }

      await connection.commit();
      return this.getTripById(tripId);

    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Updates an existing trip record
   */
  async updateTrip(id, data) {
    const trip = await tripModel.findById(id);
    if (!trip) {
      throw new AppError('Trip not found.', HttpStatusCodes.NOT_FOUND);
    }

    // 1. Business Rule: "Completed or Cancelled trips cannot be edited except status updates if required."
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      const departureSame = new Date(trip.scheduled_departure).toISOString() === new Date(data.scheduled_departure).toISOString();
      const arrivalSame = new Date(trip.scheduled_arrival).toISOString() === new Date(data.scheduled_arrival).toISOString();
      
      const fieldsChanged =
        trip.vehicle_id !== parseInt(data.vehicle_id, 10) ||
        trip.driver_id !== parseInt(data.driver_id, 10) ||
        trip.origin_id !== parseInt(data.origin_id, 10) ||
        trip.destination_id !== parseInt(data.destination_id, 10) ||
        !departureSame ||
        !arrivalSame ||
        parseFloat(trip.distance_km) !== parseFloat(data.distance_km);

      if (fieldsChanged) {
        throw new AppError(
          'Business Rule Violation: Completed or Cancelled trips cannot be edited except for their status.',
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    // 2. Verify vehicle availability (excluding this current trip!)
    const availableVehicles = await tripModel.getAvailableVehicles(id);
    const vehicleIsAvailable = availableVehicles.some(v => v.id === parseInt(data.vehicle_id, 10)) || trip.vehicle_id === parseInt(data.vehicle_id, 10);
    if (!vehicleIsAvailable) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
        { field: 'vehicle_id', message: 'The selected vehicle is currently not available for trip assignment.' }
      ]);
    }

    // 3. Verify driver availability (excluding this current trip!)
    const availableDrivers = await tripModel.getAvailableDrivers(id);
    const driverIsAvailable = availableDrivers.some(d => d.id === parseInt(data.driver_id, 10)) || trip.driver_id === parseInt(data.driver_id, 10);
    if (!driverIsAvailable) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
        { field: 'driver_id', message: 'The selected driver is currently not available or holds an expired license.' }
      ]);
    }

    const serializedNotes = serializeNotes(
      data.estimated_fuel,
      data.cargo_passenger_desc,
      data.user_notes
    );

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      let actualDeparture = trip.actual_departure;
      let actualArrival = trip.actual_arrival;
      let cancellationReason = trip.cancellation_reason;

      // 4. State updates transitions
      const currentStatus = trip.status;
      const targetStatus = data.status;

      if (currentStatus !== targetStatus) {
        // Transition: Starting Trip (Scheduled -> In Progress)
        if (targetStatus === 'IN_PROGRESS') {
          await updateDriverStatus(connection, data.driver_id, 'ON_TRIP');
          if (!actualDeparture) actualDeparture = new Date();
        }
        
        // Transition: Completing Trip (In Progress -> Completed)
        if (targetStatus === 'COMPLETED') {
          await updateDriverStatus(connection, data.driver_id, 'AVAILABLE');
          if (!actualArrival) actualArrival = new Date();
        }

        // Transition: Cancelling Trip (Scheduled/In Progress -> Cancelled)
        if (targetStatus === 'CANCELLED') {
          await updateDriverStatus(connection, data.driver_id, 'AVAILABLE');
          cancellationReason = data.cancellation_reason || 'Cancelled by dispatcher.';
        }

        // Transition: Reverting completed/cancelled back to active/scheduled (if status updates required)
        if ((currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') && (targetStatus === 'SCHEDULED' || targetStatus === 'IN_PROGRESS')) {
          const isDriverCurrentlyAssigned = await connection.query(
            `SELECT 1 FROM trips WHERE driver_id = ? AND status = 'IN_PROGRESS' AND id != ?`,
            [data.driver_id, id]
          );
          const driverStatus = isDriverCurrentlyAssigned[0].length > 0 ? 'ON_TRIP' : (targetStatus === 'IN_PROGRESS' ? 'ON_TRIP' : 'AVAILABLE');
          await updateDriverStatus(connection, data.driver_id, driverStatus);
          
          if (targetStatus === 'SCHEDULED') {
            actualDeparture = null;
            actualArrival = null;
            cancellationReason = null;
          }
        }
      }

      await tripModel.update(id, {
        vehicleId: data.vehicle_id,
        driverId: data.driver_id,
        originId: data.origin_id,
        destinationId: data.destination_id,
        scheduledDeparture: data.scheduled_departure,
        scheduledArrival: data.scheduled_arrival,
        distanceKm: data.distance_km,
        status: targetStatus,
        notes: serializedNotes,
        actualDeparture,
        actualArrival,
        cancellationReason
      });

      await connection.commit();
      return this.getTripById(id);

    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Deletes a trip
   */
  async deleteTrip(id) {
    const trip = await tripModel.findById(id);
    if (!trip) {
      throw new AppError('Trip not found.', HttpStatusCodes.NOT_FOUND);
    }

    if (trip.status === 'IN_PROGRESS') {
      throw new AppError('Cannot delete a trip that is currently in progress.', HttpStatusCodes.BAD_REQUEST);
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Revert driver status if scheduled trip was holding them
      await updateDriverStatus(connection, trip.driver_id, 'AVAILABLE');

      await tripModel.delete(id);

      await connection.commit();
      return true;

    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Retrieves dropdown options lists for vehicles, drivers, and locations
   */
  async getMetadataOptions(excludeTripId = null) {
    const vehicles = await tripModel.getAvailableVehicles(excludeTripId);
    const drivers = await tripModel.getAvailableDrivers(excludeTripId);
    const locations = await tripModel.getLocations();

    return { vehicles, drivers, locations };
  }
};

export default tripService;
