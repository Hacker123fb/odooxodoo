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
      sourceLocation: '',
      destinationLocation: '',
      vehicleId: '',
      driverId: '',
      departureDate: '',
      departureTime: '',
      expectedArrivalDate: '',
      expectedArrivalTime: '',
      distanceKm: '',
      estimatedFuel: '',
      cargoPassengerDesc: '',
      userNotes: '',
      status: 'SCHEDULED'
    }
  });

  // Fetch dropdown selector lists for vehicles and drivers
  const loadOptions = async () => {
    try {
      const res = await tripService.getOptions(isEdit ? { excludeTripId: id } : {});
      if (res.success && res.data) {
        setVehicles(res.data.vehicles || []);
        setDrivers(res.data.drivers || []);
      }
    } catch (err) {
      showToast('Failed to load vehicle or driver options.', 'error');
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
          
          setValue('sourceLocation', t.sourceLocation || '');
          setValue('destinationLocation', t.destinationLocation || '');
          setValue('vehicleId', t.vehicleId || '');
          setValue('driverId', t.driverId || '');
          setValue('departureDate', t.departureDate || '');
          setValue('departureTime', t.departureTime || '');
          setValue('expectedArrivalDate', t.expectedArrivalDate || '');
          setValue('expectedArrivalTime', t.expectedArrivalTime || '');
          setValue('distanceKm', t.distanceKm || '');
          setValue('estimatedFuel', t.estimatedFuel || '');
          setValue('cargoPassengerDesc', t.cargoPassengerDesc || '');
          setValue('userNotes', t.userNotes || '');
          setValue('status', t.status || 'SCHEDULED');
          setCurrentStatus(t.status || 'SCHEDULED');
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

    const payload = {
      sourceLocation: data.sourceLocation,
      destinationLocation: data.destinationLocation,
      vehicleId: parseInt(data.vehicleId, 10),
      driverId: parseInt(data.driverId, 10),
      departureDate: data.departureDate,
      departureTime: data.departureTime,
      expectedArrivalDate: data.expectedArrivalDate,
      expectedArrivalTime: data.expectedArrivalTime,
      distanceKm: parseFloat(data.distanceKm),
      estimatedFuel: data.estimatedFuel ? parseFloat(data.estimatedFuel) : null,
      cargoPassengerDesc: data.cargoPassengerDesc,
      userNotes: data.userNotes,
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
          setError(e.field, { type: 'server', message: e.message });
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

  // Scroll to first invalid field on form submission error
  const onInvalid = (errs) => {
    const firstErrorField = Object.keys(errs)[0];
    if (firstErrorField) {
      const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
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

      <FormWrapper onSubmit={handleSubmit(onSubmit, onInvalid)} error={apiError}>
        
        {/* Source and Destination row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            id="sourceLocation"
            label="Source Location *"
            disabled={isEnded}
            error={errors.sourceLocation}
            placeholder="e.g. Ahmedabad"
            {...register('sourceLocation', { 
              required: 'Source Location is required.',
              minLength: { value: 2, message: 'Source Location must be at least 2 characters.' },
              maxLength: { value: 100, message: 'Source Location must not exceed 100 characters.' },
              setValueAs: (val) => val?.trim()
            })}
          />

          <Input
            id="destinationLocation"
            label="Destination Location *"
            disabled={isEnded}
            error={errors.destinationLocation}
            placeholder="e.g. Vadodara"
            {...register('destinationLocation', { 
              required: 'Destination Location is required.',
              minLength: { value: 2, message: 'Destination Location must be at least 2 characters.' },
              maxLength: { value: 100, message: 'Destination Location must not exceed 100 characters.' },
              setValueAs: (val) => val?.trim()
            })}
          />

        </div>

        {/* Assigned Vehicle & Driver */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="vehicleId" className="text-xs font-semibold text-slate-655 dark:text-slate-400">
              Assigned Vehicle *
            </label>
            <select
              id="vehicleId"
              disabled={isEnded}
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.vehicleId
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
              }`}
              {...register('vehicleId', { required: 'Vehicle is required.' })}
            >
              <option value="">Select vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration_number} ({v.make_name} {v.model_name})</option>
              ))}
            </select>
            {errors.vehicleId && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.vehicleId.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="driverId" className="text-xs font-semibold text-slate-655 dark:text-slate-400">
              Assigned Driver *
            </label>
            <select
              id="driverId"
              disabled={isEnded}
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.driverId
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
              }`}
              {...register('driverId', { required: 'Driver is required.' })}
            >
              <option value="">Select driver...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.full_name} (Code: {d.employee_id})</option>
              ))}
            </select>
            {errors.driverId && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.driverId.message}</span>
            )}
          </div>

        </div>

        {/* Departure Dates & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            id="departureDate"
            label="Departure Date *"
            type="date"
            disabled={isEnded}
            error={errors.departureDate}
            {...register('departureDate', { required: 'Departure Date is required.' })}
          />

          <Input
            id="departureTime"
            label="Departure Time *"
            type="time"
            disabled={isEnded}
            error={errors.departureTime}
            {...register('departureTime', { required: 'Departure Time is required.' })}
          />

        </div>

        {/* Arrival Dates & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            id="expectedArrivalDate"
            label="Expected Arrival Date *"
            type="date"
            disabled={isEnded}
            error={errors.expectedArrivalDate}
            {...register('expectedArrivalDate', { required: 'Expected Arrival Date is required.' })}
          />

          <Input
            id="expectedArrivalTime"
            label="Expected Arrival Time *"
            type="time"
            disabled={isEnded}
            error={errors.expectedArrivalTime}
            {...register('expectedArrivalTime', { required: 'Expected Arrival Time is required.' })}
          />

        </div>

        {/* Distances and fuel metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            id="distanceKm"
            label="Distance (km) *"
            type="number"
            step="0.1"
            disabled={isEnded}
            error={errors.distanceKm}
            placeholder="e.g. 240.5"
            {...register('distanceKm', { 
              required: 'Distance is required.',
              min: { value: 0.1, message: 'Distance must be greater than zero.' }
            })}
          />

          <Input
            id="estimatedFuel"
            label="Estimated Fuel Consumption (L)"
            type="number"
            step="0.01"
            disabled={isEnded}
            error={errors.estimatedFuel}
            placeholder="e.g. 45.5"
            {...register('estimatedFuel', {
              min: { value: 0, message: 'Fuel consumption cannot be negative.' }
            })}
          />

        </div>

        {/* Cargo Passenger Description */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="cargoPassengerDesc" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Cargo / Passenger Description
          </label>
          <textarea
            id="cargoPassengerDesc"
            rows="2"
            disabled={isEnded}
            placeholder="Specify materials details, passenger groups info, load lists details..."
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('cargoPassengerDesc')}
          />
        </div>

        {/* Remarks */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="userNotes" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Remarks
          </label>
          <textarea
            id="userNotes"
            rows="2"
            disabled={isEnded}
            placeholder="Route alerts, depot instructions, or operational remarks..."
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('userNotes')}
          />
        </div>

        {/* Trip Status dropdown */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="status" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Trip Status *
          </label>
          <select
            id="status"
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
