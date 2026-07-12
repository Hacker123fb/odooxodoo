import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { vehicleService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

/**
 * Creation and Editing Form for Rigs / Vehicles
 */
export const VehicleForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [models, setModels] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');

  // Lock status check: Retired vehicles cannot be edited except status
  const isRetired = isEdit && currentStatus === 'Retired';

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      registration_number: '',
      model_id: '',
      fuel_type_id: '',
      year: new Date().getFullYear(),
      capacity: '',
      current_odometer: 0,
      purchase_price: '',
      status: 'Available'
    }
  });

  // Fetch dropdown lists options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await vehicleService.getOptions();
        if (res.success) {
          setModels(res.data.models || []);
          setFuels(res.data.fuelTypes || []);
        }
      } catch (err) {
        showToast('Failed to load list selections.', 'error');
      }
    };
    fetchOptions();
  }, []);

  // If editing, load current vehicle details
  useEffect(() => {
    if (!isEdit) return;
    const fetchVehicle = async () => {
      setIsLoading(true);
      try {
        const res = await vehicleService.getById(id);
        if (res.success && res.data) {
          const v = res.data;
          setValue('registration_number', v.registration_number);
          setValue('model_id', v.model_id);
          setValue('fuel_type_id', v.fuel_type_id);
          setValue('year', v.year);
          setValue('capacity', v.capacity);
          setValue('current_odometer', v.current_odometer);
          setValue('purchase_price', v.purchase_price);
          setValue('status', v.ui_status);
          setCurrentStatus(v.ui_status);
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve vehicle details.', 'error');
        navigate('/vehicles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicle();
  }, [id, isEdit, setValue]);

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

  const onSubmit = async (data) => {
    setIsSaving(true);
    setApiError(null);
    try {
      let res;
      if (isEdit) {
        res = await vehicleService.update(id, data);
      } else {
        res = await vehicleService.create(data);
      }

      if (res.success) {
        showToast(
          isEdit ? 'Vehicle updated successfully.' : 'Vehicle registered successfully.',
          'success'
        );
        navigate('/vehicles');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(e => {
          setError(e.field, { type: 'server', message: e.message });
        });
        setApiError('Validation failed. Please correct the highlighted fields below.');
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        const msg = err.message === 'Validation failed.' ? 'Validation failed. Please check form inputs.' : err.message;
        setApiError(msg);
        showToast(msg || 'Saving record failed.', 'error');
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
          {isEdit ? 'Edit Vehicle Profile' : 'Register New Vehicle'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isRetired
            ? 'Retired vehicle: Only status may be changed.'
            : 'Populate parameters below to update transport details.'}
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit, onInvalid)} error={apiError}>
        
        {/* Registration Number */}
        <Input
          label="Registration Number / License Plate"
          error={errors.registration_number}
          disabled={isRetired}
          placeholder="e.g. CA-102-XY"
          {...register('registration_number', {
            required: 'Registration plate number is required.'
          })}
        />

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Model selection */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Vehicle Model & Brand
            </label>
            <select
              disabled={isRetired}
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.model_id
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('model_id', { required: 'Please select a vehicle model.' })}
            >
              <option value="">Select model...</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.make_name} {m.name} ({m.type_name})
                </option>
              ))}
            </select>
            {errors.model_id && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.model_id.message}</span>
            )}
          </div>

          {/* Fuel selection */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Fuel Type
            </label>
            <select
              disabled={isRetired}
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.fuel_type_id
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('fuel_type_id', { required: 'Please select a fuel type.' })}
            >
              <option value="">Select fuel type...</option>
              {fuels.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            {errors.fuel_type_id && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.fuel_type_id.message}</span>
            )}
          </div>

          {/* Manufacturing Year */}
          <Input
            label="Year of Manufacture"
            type="number"
            disabled={isRetired}
            error={errors.year}
            {...register('year', {
              required: 'Year is required.',
              min: { value: 1900, message: 'Year must be after 1900.' },
              max: { value: new Date().getFullYear() + 2, message: 'Invalid year.' }
            })}
          />

          {/* Max Capacity */}
          <Input
            label="Max Load Capacity (kg)"
            type="number"
            disabled={isRetired}
            error={errors.capacity}
            placeholder="e.g. 12000"
            {...register('capacity', {
              required: 'Load capacity is required.',
              min: { value: 1, message: 'Capacity must be greater than zero.' }
            })}
          />

          {/* Current Odometer */}
          <Input
            label="Current Odometer Reading (km)"
            type="number"
            disabled={isRetired}
            error={errors.current_odometer}
            {...register('current_odometer', {
              required: 'Odometer value is required.',
              min: { value: 0, message: 'Odometer cannot be negative.' }
            })}
          />

          {/* Acquisition Cost */}
          <Input
            label="Acquisition Cost ($)"
            type="number"
            step="0.01"
            disabled={isRetired}
            error={errors.purchase_price}
            placeholder="e.g. 45000.00"
            {...register('purchase_price', {
              required: 'Purchase price / cost is required.',
              min: { value: 0, message: 'Cost cannot be negative.' }
            })}
          />

        </div>

        {/* Vehicle Status */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Duty Status
          </label>
          <select
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('status')}
          >
            <option value="Available">Available</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        {/* Action button rows */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/vehicles')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            {isEdit ? 'Save Changes' : 'Confirm Register'}
          </Button>
        </div>

      </FormWrapper>
    </div>
  );
};

export default VehicleForm;
