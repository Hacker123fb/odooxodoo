import tripModel from '../models/trip.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import pool from '../config/db.js';

// JSON serializer for estimated fuel and passenger/cargo text inside notes
const serializeNotes = (estimatedFuel = null, cargoDesc = '', userNotes = '') => {
  return JSON.stringify({
    estimatedFuel: estimatedFuel !== undefined && estimatedFuel !== null ? parseFloat(estimatedFuel) : null,
    cargoPassengerDesc: cargoDesc || '',
    userRemarks: userNotes || ''
  });
};

// JSON deserializer for notes
const deserializeNotes = (notesField) => {
  if (!notesField) {
    return { estimatedFuel: null, cargoPassengerDesc: '', userNotes: '' };
  }
  try {
    const parsed = JSON.parse(notesField);
    if (parsed && typeof parsed === 'object') {
      return {
        estimatedFuel: parsed.estimatedFuel ?? null,
        cargoPassengerDesc: parsed.cargoPassengerDesc ?? '',
        userNotes: parsed.userRemarks ?? parsed.userNotes ?? ''
      };
    }
  } catch (e) {
    // Return raw text if not JSON
  }
  return { estimatedFuel: null, cargoPassengerDesc: '', userNotes: notesField };
};

// Helper to update driver status
const updateDriverStatus = async (connection, driverId, status) => {
  await connection.query('UPDATE drivers SET status = ? WHERE id = ?', [status, driverId]);
};

export const tripService = {
  /**
   * Fetches lists of trips and deserializes notes to camelCase
   */
  async getTrips(filters) {
    const rows = await tripModel.findAll(filters);
    return rows.map(t => {
      const parsedNotes = deserializeNotes(t.notes);
      const departureDate = new Date(t.scheduled_departure).toISOString().split('T')[0];
      const departureTime = new Date(t.scheduled_departure).toTimeString().slice(0, 5);
      const expectedArrivalDate = new Date(t.scheduled_arrival).toISOString().split('T')[0];
      const expectedArrivalTime = new Date(t.scheduled_arrival).toTimeString().slice(0, 5);

      return {
        ...t,
        ...parsedNotes,
        sourceLocation: t.source_location,
        destinationLocation: t.destination_location,
        vehicleId: t.vehicle_id,
        driverId: t.driver_id,
        departureDate,
        departureTime,
        expectedArrivalDate,
        expectedArrivalTime,
        distanceKm: t.distance_km
      };
    });
  },

  /**
   * Fetches single trip details formatted to camelCase
   */
  async getTripById(id) {
    const trip = await tripModel.findById(id);
    if (!trip) {
      throw new AppError('Trip not found.', HttpStatusCodes.NOT_FOUND);
    }
    const parsedNotes = deserializeNotes(trip.notes);
    const departureDate = new Date(trip.scheduled_departure).toISOString().split('T')[0];
    const departureTime = new Date(trip.scheduled_departure).toTimeString().slice(0, 5);
    const expectedArrivalDate = new Date(trip.scheduled_arrival).toISOString().split('T')[0];
    const expectedArrivalTime = new Date(trip.scheduled_arrival).toTimeString().slice(0, 5);

    return {
      ...trip,
      ...parsedNotes,
      sourceLocation: trip.source_location,
      destinationLocation: trip.destination_location,
      vehicleId: trip.vehicle_id,
      driverId: trip.driver_id,
      departureDate,
      departureTime,
      expectedArrivalDate,
      expectedArrivalTime,
      distanceKm: trip.distance_km
    };
  },

  /**
   * Schedules a new trip with camelCase properties
   */
  async createTrip(data, creatorId) {
    // 1. Verify vehicle is available
    const availableVehicles = await tripModel.getAvailableVehicles();
    const vehicleIsAvailable = availableVehicles.some(v => v.id === parseInt(data.vehicleId, 10));
    if (!vehicleIsAvailable) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
        { field: 'vehicleId', message: 'The selected vehicle is currently not available for trip assignment.' }
      ]);
    }

    // 2. Verify driver is available
    const availableDrivers = await tripModel.getAvailableDrivers();
    const driverIsAvailable = availableDrivers.some(d => d.id === parseInt(data.driverId, 10));
    if (!driverIsAvailable) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
        { field: 'driverId', message: 'The selected driver is currently not available or holds an expired license.' }
      ]);
    }

    // 3. Generate unique Trip Number (TRP-YYYYMMDD-RAND)
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const tripNumber = `TRP-${yyyymmdd}-${rand}`;

    // 4. Serialize estimated fuel and details inside notes
    const serializedNotes = serializeNotes(
      data.estimatedFuel,
      data.cargoPassengerDesc,
      data.userNotes
    );

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const tripId = await tripModel.create({
        tripNumber,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        sourceLocation: data.sourceLocation,
        destinationLocation: data.destinationLocation,
        scheduledDeparture: `${data.departureDate} ${data.departureTime}:00`,
        scheduledArrival: `${data.expectedArrivalDate} ${data.expectedArrivalTime}:00`,
        distanceKm: data.distanceKm,
        status: data.status || 'SCHEDULED',
        notes: serializedNotes,
        createdBy: creatorId
      });

      // 5. Automatic status transition updates: If starts in progress immediately
      if (data.status === 'IN_PROGRESS') {
        await updateDriverStatus(connection, data.driverId, 'ON_TRIP');
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
      const departureDateDb = new Date(trip.scheduled_departure).toISOString().split('T')[0];
      const departureTimeDb = new Date(trip.scheduled_departure).toTimeString().slice(0, 5);
      const arrivalDateDb = new Date(trip.scheduled_arrival).toISOString().split('T')[0];
      const arrivalTimeDb = new Date(trip.scheduled_arrival).toTimeString().slice(0, 5);

      const departureSame = departureDateDb === data.departureDate && departureTimeDb === data.departureTime;
      const arrivalSame = arrivalDateDb === data.expectedArrivalDate && arrivalTimeDb === data.expectedArrivalTime;
      
      const fieldsChanged =
        trip.vehicle_id !== parseInt(data.vehicleId, 10) ||
        trip.driver_id !== parseInt(data.driverId, 10) ||
        trip.source_location !== data.sourceLocation ||
        trip.destination_location !== data.destinationLocation ||
        !departureSame ||
        !arrivalSame ||
        parseFloat(trip.distance_km) !== parseFloat(data.distanceKm);

      if (fieldsChanged) {
        throw new AppError(
          'Business Rule Violation: Completed or Cancelled trips cannot be edited except for their status.',
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    // 2. Verify vehicle availability (excluding this current trip!)
    const availableVehicles = await tripModel.getAvailableVehicles(id);
    const vehicleIsAvailable = availableVehicles.some(v => v.id === parseInt(data.vehicleId, 10)) || trip.vehicle_id === parseInt(data.vehicleId, 10);
    if (!vehicleIsAvailable) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
        { field: 'vehicleId', message: 'The selected vehicle is currently not available for trip assignment.' }
      ]);
    }

    // 3. Verify driver availability (excluding this current trip!)
    const availableDrivers = await tripModel.getAvailableDrivers(id);
    const driverIsAvailable = availableDrivers.some(d => d.id === parseInt(data.driverId, 10)) || trip.driver_id === parseInt(data.driverId, 10);
    if (!driverIsAvailable) {
      throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
        { field: 'driverId', message: 'The selected driver is currently not available or holds an expired license.' }
      ]);
    }

    const serializedNotes = serializeNotes(
      data.estimatedFuel,
      data.cargoPassengerDesc,
      data.userNotes
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
          await updateDriverStatus(connection, data.driverId, 'ON_TRIP');
          if (!actualDeparture) actualDeparture = new Date();
        }
        
        // Transition: Completing Trip (In Progress -> Completed)
        if (targetStatus === 'COMPLETED') {
          await updateDriverStatus(connection, data.driverId, 'AVAILABLE');
          if (!actualArrival) actualArrival = new Date();
        }

        // Transition: Cancelling Trip (Scheduled/In Progress -> Cancelled)
        if (targetStatus === 'CANCELLED') {
          await updateDriverStatus(connection, data.driverId, 'AVAILABLE');
          cancellationReason = data.cancellation_reason || 'Cancelled by dispatcher.';
        }

        // Transition: Reverting completed/cancelled back to active/scheduled
        if ((currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') && (targetStatus === 'SCHEDULED' || targetStatus === 'IN_PROGRESS')) {
          const isDriverCurrentlyAssigned = await connection.query(
            `SELECT 1 FROM trips WHERE driver_id = ? AND status = 'IN_PROGRESS' AND id != ?`,
            [data.driverId, id]
          );
          const driverStatus = isDriverCurrentlyAssigned[0].length > 0 ? 'ON_TRIP' : (targetStatus === 'IN_PROGRESS' ? 'ON_TRIP' : 'AVAILABLE');
          await updateDriverStatus(connection, data.driverId, driverStatus);
          
          if (targetStatus === 'SCHEDULED') {
            actualDeparture = null;
            actualArrival = null;
            cancellationReason = null;
          }
        }
      }

      await tripModel.update(id, {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        sourceLocation: data.sourceLocation,
        destinationLocation: data.destinationLocation,
        scheduledDeparture: `${data.departureDate} ${data.departureTime}:00`,
        scheduledArrival: `${data.expectedArrivalDate} ${data.expectedArrivalTime}:00`,
        distanceKm: data.distanceKm,
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
