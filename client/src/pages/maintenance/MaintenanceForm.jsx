import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { maintenanceService, vehicleService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

export const MaintenanceForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      vehicleId: '',
      maintenanceType: '',
      serviceCenter: '',
      maintenanceDate: '',
      estimatedCompletionDate: '',
      actualCompletionDate: '',
      cost: '',
      odometerReading: '',
      technicianName: '',
      remarks: '',
      status: 'Scheduled'
    }
  });

  const watchVehicleId = watch('vehicleId');
  const watchMaintenanceDate = watch('maintenanceDate');

  // Sync selected vehicle details to validate odometer client-side
  useEffect(() => {
    if (watchVehicleId) {
      const v = vehicles.find(item => item.id === parseInt(watchVehicleId, 10));
      setSelectedVehicle(v || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [watchVehicleId, vehicles]);

  // Load all vehicles to filter available ones
  const fetchVehiclesList = async (currentVehicleId = null) => {
    try {
      const res = await vehicleService.getAll();
      if (res.success && res.data) {
        // Filter options: Only ACTIVE (Available) vehicles OR the currently assigned vehicle if editing
        const filtered = res.data.filter(v => v.status === 'ACTIVE' || v.id === currentVehicleId);
        setVehicles(filtered);
      }
    } catch (err) {
      showToast('Failed to load vehicles list.', 'error');
    }
  };

  useEffect(() => {
    if (!isEdit) {
      fetchVehiclesList();
    }
  }, [isEdit]);

  // Load details if editing
  useEffect(() => {
    if (!isEdit) return;
    const fetchRecord = async () => {
      setIsLoading(true);
      try {
        const res = await maintenanceService.getById(id);
        if (res.success && res.data) {
          const m = res.data;
          
          // Load vehicles list first including this log's vehicle
          await fetchVehiclesList(m.vehicleId);

          setValue('vehicleId', m.vehicleId);
          setValue('maintenanceType', m.maintenanceType);
          setValue('serviceCenter', m.serviceCenter || '');
          setValue('maintenanceDate', m.maintenanceDate);
          setValue('estimatedCompletionDate', m.estimatedCompletionDate || '');
          setValue('actualCompletionDate', m.actualCompletionDate || '');
          setValue('cost', m.cost || '');
          setValue('odometerReading', m.odometerReading);
          setValue('technicianName', m.technicianName || '');
          setValue('remarks', m.remarks || '');
          setValue('status', m.status);
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve maintenance details.', 'error');
        navigate('/maintenance');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecord();
  }, [id, isEdit, setValue]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    setApiError(null);

    const payload = {
      vehicleId: parseInt(data.vehicleId, 10),
      maintenanceType: data.maintenanceType,
      serviceCenter: data.serviceCenter,
      maintenanceDate: data.maintenanceDate,
      estimatedCompletionDate: data.estimatedCompletionDate || null,
      actualCompletionDate: data.actualCompletionDate || null,
      cost: data.cost ? parseFloat(data.cost) : 0,
      odometerReading: parseInt(data.odometerReading, 10),
      technicianName: data.technicianName,
      remarks: data.remarks,
      status: data.status
    };

    try {
      let res;
      if (isEdit) {
        res = await maintenanceService.update(id, payload);
      } else {
        res = await maintenanceService.create(payload);
      }

      if (res.success) {
        showToast(
          isEdit ? 'Maintenance log updated successfully.' : 'Maintenance record scheduled successfully.',
          'success'
        );
        navigate('/maintenance');
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
        showToast(msg || 'Saving maintenance log failed.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = (errs) => {
    const firstError = Object.keys(errs)[0];
    if (firstError) {
      const element = document.getElementsByName(firstError)[0] || document.getElementById(firstError);
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
          {isEdit ? 'Edit Maintenance Work Order' : 'Log Vehicle Maintenance'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Populate details below to register vehicle maintenance logs. Required fields are marked with red asterisks (*).
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit, onInvalid)} error={apiError}>
        
        {/* Vehicle and Service Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Vehicle Dropdown */}
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="vehicleId" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Vehicle *
            </label>
            <select
              id="vehicleId"
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.vehicleId
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('vehicleId', { required: 'Vehicle selection is required.' })}
            >
              <option value="">Select vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} ({v.make_name} {v.model_name})
                </option>
              ))}
            </select>
            {errors.vehicleId && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.vehicleId.message}</span>
            )}
          </div>

          {/* Maintenance Type Dropdown */}
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="maintenanceType" className="text-xs font-semibold text-slate-655 dark:text-slate-400">
              Maintenance Type *
            </label>
            <select
              id="maintenanceType"
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.maintenanceType
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('maintenanceType', { required: 'Maintenance Type is required.' })}
            >
              <option value="">Select type...</option>
              <option value="Routine Service">Routine Service</option>
              <option value="Oil Change">Oil Change</option>
              <option value="Tyre Replacement">Tyre Replacement</option>
              <option value="Brake Service">Brake Service</option>
              <option value="Engine Repair">Engine Repair</option>
              <option value="Accident Repair">Accident Repair</option>
              <option value="Inspection">Inspection</option>
              <option value="Other">Other</option>
            </select>
            {errors.maintenanceType && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.maintenanceType.message}</span>
            )}
          </div>

        </div>

        {/* Service Center & Technician name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            id="serviceCenter"
            label="Service Center"
            placeholder="e.g. Tata Motors Service Center"
            error={errors.serviceCenter}
            {...register('serviceCenter')}
          />

          <Input
            id="technicianName"
            label="Technician Name"
            placeholder="e.g. Rajesh Kumar"
            error={errors.technicianName}
            {...register('technicianName')}
          />

        </div>

        {/* Maintenance Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <Input
            id="maintenanceDate"
            label="Maintenance Date *"
            type="date"
            error={errors.maintenanceDate}
            {...register('maintenanceDate', { 
              required: 'Maintenance Date is required.',
              validate: (val) => {
                const inputDate = new Date(val);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return inputDate <= today || 'Maintenance Date cannot be in the future.';
              }
            })}
          />

          <Input
            id="estimatedCompletionDate"
            label="Estimated Completion"
            type="date"
            error={errors.estimatedCompletionDate}
            {...register('estimatedCompletionDate', { 
              validate: (val) => {
                if (!val || !watchMaintenanceDate) return true;
                return new Date(val) >= new Date(watchMaintenanceDate) || 'Estimated Completion Date must be after Maintenance Date.';
              }
            })}
          />

          <Input
            id="actualCompletionDate"
            label="Actual Completion"
            type="date"
            error={errors.actualCompletionDate}
            {...register('actualCompletionDate', { 
              validate: (val) => {
                if (!val || !watchMaintenanceDate) return true;
                return new Date(val) >= new Date(watchMaintenanceDate) || 'Actual Completion Date cannot be before Maintenance Date.';
              }
            })}
          />

        </div>

        {/* Cost & Odometer Readings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            id="cost"
            label="Cost (₹)"
            type="number"
            step="0.01"
            placeholder="e.g. 15000"
            error={errors.cost}
            {...register('cost', {
              min: { value: 0, message: 'Cost cannot be negative.' }
            })}
          />

          <Input
            id="odometerReading"
            label="Odometer Reading (km) *"
            type="number"
            placeholder="e.g. 45000"
            error={errors.odometerReading}
            {...register('odometerReading', { 
              required: 'Odometer Reading is required.',
              validate: (val) => {
                if (!selectedVehicle) return true;
                const reading = parseInt(val, 10);
                return reading >= selectedVehicle.current_odometer || `Odometer cannot decrease below the vehicle's current odometer (${selectedVehicle.current_odometer} km).`;
              }
            })}
          />

        </div>

        {/* Remarks logs */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="remarks" className="text-xs font-semibold text-slate-655 dark:text-slate-400">
            Remarks
          </label>
          <textarea
            id="remarks"
            rows="3"
            placeholder="Document replacement parts, engine logs, inspection details, etc..."
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('remarks')}
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="status" className="text-xs font-semibold text-slate-655 dark:text-slate-400">
            Status *
          </label>
          <select
            id="status"
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('status', { required: 'Status is required.' })}
          >
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/maintenance')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            {isEdit ? 'Save Changes' : 'Log Maintenance'}
          </Button>
        </div>

      </FormWrapper>
    </div>
  );
};

export default MaintenanceForm;
