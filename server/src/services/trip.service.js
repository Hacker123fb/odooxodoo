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

// Validates driver licensing and overlapping trip edge cases
const validateDriverAndVehicleScheduling = async ({ driverId, vehicleId, scheduledDeparture, scheduledArrival, excludeTripId = null }) => {
  const depDate = new Date(scheduledDeparture);
  const arrDate = new Date(scheduledArrival);
  const now = new Date();

  if (arrDate <= depDate) {
    throw new AppError('Trip arrival time must be strictly after the departure time.', HttpStatusCodes.BAD_REQUEST, [
      { field: 'expectedArrivalDate', message: 'Estimated arrival time must be later than departure time.' }
    ]);
  }

  // 1. Fetch Driver Details
  const driver = await tripModel.findDriverById(driverId);
  if (!driver) {
    throw new AppError('The selected driver does not exist in the system.', HttpStatusCodes.NOT_FOUND, [
      { field: 'driverId', message: 'Driver not found.' }
    ]);
  }

  // Edge Case 1: Driver license is already expired
  const licenseExpiry = new Date(driver.license_expiry);
  // Normalize date without time for day comparison
  const licenseExpiryDay = new Date(licenseExpiry.getFullYear(), licenseExpiry.getMonth(), licenseExpiry.getDate(), 23, 59, 59);

  if (licenseExpiryDay < now) {
    const expiryStr = licenseExpiry.toISOString().split('T')[0];
    throw new AppError(
      `Compliance Violation: Driver ${driver.full_name}'s license expired on ${expiryStr}. Drivers with expired licenses are legally prohibited from driving.`,
      HttpStatusCodes.BAD_REQUEST,
      [{ field: 'driverId', message: `License expired on ${expiryStr}. Expired drivers cannot be assigned to trips.` }]
    );
  }

  // Edge Case 2: Driver license will expire before trip scheduled departure
  if (licenseExpiryDay < depDate) {
    const expiryStr = licenseExpiry.toISOString().split('T')[0];
    throw new AppError(
      `Scheduling Conflict: Driver ${driver.full_name}'s license will be expired by departure date (expires: ${expiryStr}, departure: ${scheduledDeparture}).`,
      HttpStatusCodes.BAD_REQUEST,
      [{ field: 'driverId', message: `License will be expired before scheduled trip departure (${expiryStr}).` }]
    );
  }

  // Edge Case 3: Driver license expires IN BETWEEN the scheduled trip!
  if (licenseExpiryDay <= arrDate) {
    const expiryStr = licenseExpiry.toISOString().split('T')[0];
    throw new AppError(
      `Critical Compliance Alert: Driver ${driver.full_name}'s license expires on ${expiryStr}, which occurs in between the scheduled trip window (completion: ${scheduledArrival}). Drivers are strictly prohibited from driving during or after license expiration.`,
      HttpStatusCodes.BAD_REQUEST,
      [{ field: 'driverId', message: `License expires on ${expiryStr} before trip completes (${scheduledArrival}). Drivers cannot drive with expiring license in-transit.` }]
    );
  }

  // 2. Fetch Vehicle Details
  const vehicle = await tripModel.findVehicleById(vehicleId);
  if (!vehicle) {
    throw new AppError('The selected vehicle does not exist.', HttpStatusCodes.NOT_FOUND, [
      { field: 'vehicleId', message: 'Vehicle not found.' }
    ]);
  }

  if (vehicle.status !== 'ACTIVE') {
    throw new AppError(`Vehicle ${vehicle.registration_number} is currently ${vehicle.status} and cannot be assigned.`, HttpStatusCodes.BAD_REQUEST, [
      { field: 'vehicleId', message: `Vehicle status is ${vehicle.status}. Only ACTIVE vehicles can be dispatched.` }
    ]);
  }

  // Edge Case 4: Overlapping Trip Schedule for Driver
  const overlappingDriverTrip = await tripModel.findOverlappingDriverTrip(driverId, scheduledDeparture, scheduledArrival, excludeTripId);
  if (overlappingDriverTrip) {
    throw new AppError(
      `Scheduling Conflict: Driver ${driver.full_name} is already assigned to trip ${overlappingDriverTrip.trip_number} (${overlappingDriverTrip.status}) during this overlapping time window.`,
      HttpStatusCodes.BAD_REQUEST,
      [{ field: 'driverId', message: `Driver already booked on ${overlappingDriverTrip.trip_number} during this window.` }]
    );
  }

  // Edge Case 5: Overlapping Trip Schedule for Vehicle
  const overlappingVehicleTrip = await tripModel.findOverlappingVehicleTrip(vehicleId, scheduledDeparture, scheduledArrival, excludeTripId);
  if (overlappingVehicleTrip) {
    throw new AppError(
      `Scheduling Conflict: Vehicle ${vehicle.registration_number} is already assigned to trip ${overlappingVehicleTrip.trip_number} (${overlappingVehicleTrip.status}) during this overlapping time window.`,
      HttpStatusCodes.BAD_REQUEST,
      [{ field: 'vehicleId', message: `Vehicle already booked on ${overlappingVehicleTrip.trip_number} during this window.` }]
    );
  }
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
    const scheduledDeparture = `${data.departureDate} ${data.departureTime}:00`;
    const scheduledArrival = `${data.expectedArrivalDate} ${data.expectedArrivalTime}:00`;

    // 1. Strict validation of driver licensing, in-transit expiration, and schedule overlap
    await validateDriverAndVehicleScheduling({
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      scheduledDeparture,
      scheduledArrival,
      excludeTripId: null
    });

    // 2. Generate unique Trip Number (TRP-YYYYMMDD-RAND)
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const tripNumber = `TRP-${yyyymmdd}-${rand}`;

    // 3. Serialize estimated fuel and details inside notes
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
        scheduledDeparture,
        scheduledArrival,
        distanceKm: data.distanceKm,
        status: data.status || 'SCHEDULED',
        notes: serializedNotes,
        createdBy: creatorId
      });

      // 4. Automatic status transition updates: If starts in progress immediately
      if (data.status === 'IN_PROGRESS') {
        await updateDriverStatus(connection, data.driverId, 'ON_TRIP');
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

    // 1. Business Rule: Completed or Cancelled trips cannot be edited except status updates
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

    const scheduledDeparture = `${data.departureDate} ${data.departureTime}:00`;
    const scheduledArrival = `${data.expectedArrivalDate} ${data.expectedArrivalTime}:00`;

    // 2. Strict validation of driver licensing and overlapping assignments (excluding this current trip!)
    await validateDriverAndVehicleScheduling({
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      scheduledDeparture,
      scheduledArrival,
      excludeTripId: id
    });

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

      // 3. State updates transitions
      const currentStatus = trip.status;
      const targetStatus = data.status;

      if (currentStatus !== targetStatus) {
        if (targetStatus === 'IN_PROGRESS') {
          await updateDriverStatus(connection, data.driverId, 'ON_TRIP');
          if (!actualDeparture) actualDeparture = new Date();
        }
        
        if (targetStatus === 'COMPLETED') {
          await updateDriverStatus(connection, data.driverId, 'AVAILABLE');
          if (!actualArrival) actualArrival = new Date();
        }

        if (targetStatus === 'CANCELLED') {
          await updateDriverStatus(connection, data.driverId, 'AVAILABLE');
          cancellationReason = data.cancellation_reason || 'Cancelled by dispatcher.';
        }

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
        scheduledDeparture,
        scheduledArrival,
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
  async getMetadataOptions(excludeTripId = null, targetArrival = null) {
    const vehicles = await tripModel.getAvailableVehicles(excludeTripId);
    const drivers = await tripModel.getAvailableDrivers(excludeTripId, targetArrival);
    const locations = await tripModel.getLocations();

    return { vehicles, drivers, locations };
  }
};

export default tripService;
