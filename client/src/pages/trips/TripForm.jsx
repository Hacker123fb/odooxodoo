import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { tripService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

/**
 * Creation and Editing Form for scheduling operations trips
 */
export const TripForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');

  // Lock checks: Completed or Cancelled trips cannot be edited except status updates
  const isEnded = isEdit && (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED');

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      origin_id: '',
      destination_id: '',
      vehicle_id: '',
      driver_id: '',
      departure_date: '',
      departure_time: '',
      arrival_date: '',
      arrival_time: '',
      distance_km: '',
      estimated_fuel: '',
      cargo_passenger_desc: '',
      user_notes: '',
      status: 'SCHEDULED'
    }
  });

  // Fetch dropdown selector lists
  const loadOptions = async () => {
    try {
      const res = await tripService.getOptions(isEdit ? { excludeTripId: id } : {});
      if (res.success && res.data) {
        setVehicles(res.data.vehicles || []);
        setDrivers(res.data.drivers || []);
        setLocations(res.data.locations || []);
      }
    } catch (err) {
      showToast('Failed to load selector options.', 'error');
    }
  };

  useEffect(() => {
    loadOptions();
  }, [id, isEdit]);

  // Load existing trip details
  useEffect(() => {
    if (!isEdit) return;
    const fetchTrip = async () => {
      setIsLoading(true);
      try {
        const res = await tripService.getById(id);
        if (res.success && res.data) {
          const t = res.data;
          
          setValue('origin_id', t.origin_id);
          setValue('destination_id', t.destination_id);
          setValue('vehicle_id', t.vehicle_id);
          setValue('driver_id', t.driver_id);

          // Split Departure datetime ISO string
          if (t.scheduled_departure) {
            const depDate = new Date(t.scheduled_departure).toISOString().split('T')[0];
            const depTime = new Date(t.scheduled_departure).toTimeString().slice(0, 5);
            setValue('departure_date', depDate);
            setValue('departure_time', depTime);
          }

          // Split Arrival datetime ISO string
          if (t.scheduled_arrival) {
            const arrDate = new Date(t.scheduled_arrival).toISOString().split('T')[0];
            const arrTime = new Date(t.scheduled_arrival).toTimeString().slice(0, 5);
            setValue('arrival_date', arrDate);
            setValue('arrival_time', arrTime);
          }

          setValue('distance_km', t.distance_km);
          setValue('estimated_fuel', t.estimated_fuel || '');
          setValue('cargo_passenger_desc', t.cargo_passenger_desc || '');
          setValue('user_notes', t.user_remarks || '');
          setValue('status', t.status);
          setCurrentStatus(t.status);
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve trip profile.', 'error');
        navigate('/trips');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrip();
  }, [id, isEdit, setValue]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    setApiError(null);

    // Combine Date and Time pickers into single ISO strings
    const scheduled_departure = new Date(`${data.departure_date}T${data.departure_time}:00`).toISOString();
    const scheduled_arrival = new Date(`${data.arrival_date}T${data.arrival_time}:00`).toISOString();

    const payload = {
      origin_id: parseInt(data.origin_id, 10),
      destination_id: parseInt(data.destination_id, 10),
      vehicle_id: parseInt(data.vehicle_id, 10),
      driver_id: parseInt(data.driver_id, 10),
      scheduled_departure,
      scheduled_arrival,
      distance_km: parseFloat(data.distance_km),
      estimated_fuel: data.estimated_fuel ? parseFloat(data.estimated_fuel) : null,
      cargo_passenger_desc: data.cargo_passenger_desc,
      user_notes: data.user_notes,
      status: data.status
    };

    try {
      let res;
      if (isEdit) {
        res = await tripService.update(id, payload);
      } else {
        res = await tripService.create(payload);
      }

      if (res.success) {
        showToast(
          isEdit ? 'Trip updated successfully.' : 'Trip scheduled successfully.',
          'success'
        );
        navigate('/trips');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(e => {
          let fieldName = e.field;
          if (fieldName === 'scheduled_departure') fieldName = 'departure_date';
          if (fieldName === 'scheduled_arrival') fieldName = 'arrival_date';
          setError(fieldName, { type: 'server', message: e.message });
        });
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        setApiError(err.message);
        showToast(err.message || 'Saving dispatch failed.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
      <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
          {isEdit ? 'Edit Scheduled Trip' : 'Schedule New Trip'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isEnded 
            ? 'Completed or Cancelled trip: Only status transitions may be modified.'
            : 'Populate parameters below to update transport route dispatches. Required fields are marked with red asterisks (*).'}
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit)} error={apiError}>
        
        {/* Source and Destination row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Source Location *
            </label>
            <select
              disabled={isEnded}
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.origin_id
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('origin_id', { required: 'Source location is required.' })}
            >
              <option value="">Select origin...</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
              ))}
            </select>
            {errors.origin_id && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.origin_id.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Destination Location *
            </label>
            <select
              disabled={isEnded}
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.destination_id
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('destination_id', { required: 'Destination location is required.' })}
            >
              <option value="">Select destination...</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
              ))}
            </select>
            {errors.destination_id && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.destination_id.message}</span>
            )}
          </div>

        </div>

        {/* Assigned Vehicle & Driver */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Assigned Vehicle *
            </label>
            <select
              disabled={isEnded}
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.vehicle_id
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('vehicle_id', { required: 'Vehicle is required.' })}
            >
              <option value="">Select vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration_number} ({v.make_name} {v.model_name})</option>
              ))}
            </select>
            {errors.vehicle_id && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.vehicle_id.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Assigned Driver *
            </label>
            <select
              disabled={isEnded}
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.driver_id
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('driver_id', { required: 'Driver is required.' })}
            >
              <option value="">Select driver...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.full_name} (Code: {d.employee_id})</option>
              ))}
            </select>
            {errors.driver_id && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.driver_id.message}</span>
            )}
          </div>

        </div>

        {/* Departure Dates & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            label="Departure Date *"
            type="date"
            disabled={isEnded}
            error={errors.departure_date}
            {...register('departure_date', { required: 'Departure date is required.' })}
          />

          <Input
            label="Departure Time *"
            type="time"
            disabled={isEnded}
            error={errors.departure_time}
            {...register('departure_time', { required: 'Departure time is required.' })}
          />

        </div>

        {/* Arrival Dates & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            label="Expected Arrival Date *"
            type="date"
            disabled={isEnded}
            error={errors.arrival_date}
            {...register('arrival_date', { required: 'Expected arrival date is required.' })}
          />

          <Input
            label="Expected Arrival Time *"
            type="time"
            disabled={isEnded}
            error={errors.arrival_time}
            {...register('arrival_time', { required: 'Expected arrival time is required.' })}
          />

        </div>

        {/* Distances and fuel metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            label="Distance (km) *"
            type="number"
            step="0.1"
            disabled={isEnded}
            error={errors.distance_km}
            placeholder="e.g. 240.5"
            {...register('distance_km', { 
              required: 'Distance is required.',
              min: { value: 0.1, message: 'Distance must be greater than zero.' }
            })}
          />

          <Input
            label="Estimated Fuel Consumption (L)"
            type="number"
            step="0.01"
            disabled={isEnded}
            error={errors.estimated_fuel}
            placeholder="e.g. 45.5"
            {...register('estimated_fuel', {
              min: { value: 0, message: 'Fuel consumption cannot be negative.' }
            })}
          />

        </div>

        {/* Cargo Passenger Description */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Cargo / Passenger Description
          </label>
          <textarea
            rows="2"
            disabled={isEnded}
            placeholder="Specify materials details, passenger groups info, load lists details..."
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('cargo_passenger_desc')}
          />
        </div>

        {/* Remarks */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Remarks
          </label>
          <textarea
            rows="2"
            disabled={isEnded}
            placeholder="Route alerts, depot instructions, or operational remarks..."
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('user_notes')}
          />
        </div>

        {/* Trip Status dropdown */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Trip Status *
          </label>
          <select
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('status', { required: 'Status is required.' })}
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/trips')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            {isEdit ? 'Save Changes' : 'Confirm Dispatch'}
          </Button>
        </div>

      </FormWrapper>
    </div>
  );
};

export default TripForm;
