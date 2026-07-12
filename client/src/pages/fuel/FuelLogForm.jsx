import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { fuelService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

export const FuelLogForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [totalCostValue, setTotalCostValue] = useState(0);

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
      tripId: '',
      fuelTypeId: '',
      fuelQuantity: '',
      costPerLitre: '',
      odometerReading: '',
      fuelDate: '',
      invoiceNumber: '',
      fuelStation: '',
      paymentMethod: 'Cash',
      remarks: ''
    }
  });

  const watchVehicleId = watch('vehicleId');
  const watchQuantity = watch('fuelQuantity');
  const watchCostPerLitre = watch('costPerLitre');

  // Load select options on mount
  const loadOptions = async () => {
    try {
      const res = await fuelService.getOptions();
      if (res.success && res.data) {
        setVehicles(res.data.vehicles || []);
        setTrips(res.data.trips || []);
        setFuelTypes(res.data.fuelTypes || []);
      }
    } catch (err) {
      showToast('Failed to load selector options.', 'error');
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  // Update selected vehicle reference to validate odometer
  useEffect(() => {
    if (watchVehicleId && vehicles.length > 0) {
      const v = vehicles.find(item => item.id === parseInt(watchVehicleId, 10));
      setSelectedVehicle(v || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [watchVehicleId, vehicles]);

  // Auto-calculate Total Cost dynamically
  useEffect(() => {
    const qty = parseFloat(watchQuantity || 0);
    const cost = parseFloat(watchCostPerLitre || 0);
    setTotalCostValue(parseFloat((qty * cost).toFixed(2)));
  }, [watchQuantity, watchCostPerLitre]);

  // Load single record if editing
  useEffect(() => {
    if (!isEdit) return;
    const fetchRecord = async () => {
      setIsLoading(true);
      try {
        const res = await fuelService.getById(id);
        if (res.success && res.data) {
          const f = res.data;
          
          setValue('vehicleId', f.vehicleId || '');
          setValue('tripId', f.tripId || '');
          setValue('fuelTypeId', f.fuelTypeId || '');
          setValue('fuelQuantity', f.fuelQuantity || '');
          setValue('costPerLitre', f.costPerLitre || '');
          setValue('odometerReading', f.odometerReading || '');
          setValue('fuelDate', f.fuelDate || '');
          setValue('invoiceNumber', f.invoiceNumber || '');
          setValue('fuelStation', f.fuelStation || '');
          setValue('paymentMethod', f.paymentMethod || 'Cash');
          setValue('remarks', f.remarks || '');
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve fuel log details.', 'error');
        navigate('/fuel');
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
      tripId: data.tripId ? parseInt(data.tripId, 10) : null,
      fuelTypeId: parseInt(data.fuelTypeId, 10),
      fuelQuantity: parseFloat(data.fuelQuantity),
      costPerLitre: parseFloat(data.costPerLitre),
      odometerReading: parseInt(data.odometerReading, 10),
      fuelDate: data.fuelDate,
      invoiceNumber: data.invoiceNumber || null,
      fuelStation: data.fuelStation,
      paymentMethod: data.paymentMethod,
      remarks: data.remarks
    };

    try {
      let res;
      if (isEdit) {
        res = await fuelService.update(id, payload);
      } else {
        res = await fuelService.create(payload);
      }

      if (res.success) {
        showToast(
          isEdit ? 'Fuel log updated successfully.' : 'Fuel transaction logged successfully.',
          'success'
        );
        navigate('/fuel');
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
        showToast(msg || 'Saving fueling transaction failed.', 'error');
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
          {isEdit ? 'Edit Fueling Transaction' : 'Log Fueling Transaction'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Populate details below to register fuel logs. Required fields are marked with red asterisks (*).
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit, onInvalid)} error={apiError}>
        
        {/* Vehicle, Trip and Fuel Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
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
              {...register('vehicleId', { required: 'Vehicle is required.' })}
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

          {/* Optional Trip Dropdown */}
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="tripId" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Trip (Optional)
            </label>
            <select
              id="tripId"
              className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
              {...register('tripId')}
            >
              <option value="">Select trip...</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>
                  {t.trip_number} ({t.source_location} ➔ {t.destination_location})
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type Dropdown */}
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="fuelTypeId" className="text-xs font-semibold text-slate-655 dark:text-slate-400">
              Fuel Type *
            </label>
            <select
              id="fuelTypeId"
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.fuelTypeId
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('fuelTypeId', { required: 'Fuel Type is required.' })}
            >
              <option value="">Select type...</option>
              {fuelTypes.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            {errors.fuelTypeId && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.fuelTypeId.message}</span>
            )}
          </div>

        </div>

        {/* Quantities, Cost per litre & auto calculate total cost */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <Input
            id="fuelQuantity"
            label="Fuel Quantity (Litres) *"
            type="number"
            step="0.01"
            placeholder="e.g. 50"
            error={errors.fuelQuantity}
            {...register('fuelQuantity', { 
              required: 'Fuel Quantity is required.',
              min: { value: 0.01, message: 'Fuel Quantity must be greater than zero.' }
            })}
          />

          <Input
            id="costPerLitre"
            label="Cost per Litre (₹) *"
            type="number"
            step="0.01"
            placeholder="e.g. 104.50"
            error={errors.costPerLitre}
            {...register('costPerLitre', { 
              required: 'Cost per Litre is required.',
              min: { value: 0.01, message: 'Cost per Litre must be greater than zero.' }
            })}
          />

          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Cost (Auto Calculate)
            </label>
            <div className="w-full py-2 px-3 text-sm bg-slate-55 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 rounded-lg outline-none font-mono font-bold">
              ₹{totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

        </div>

        {/* Fuel Station & Invoice/Receipt numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Input
            id="fuelStation"
            label="Fuel Station"
            placeholder="e.g. HP Fuel Station, NH-8"
            error={errors.fuelStation}
            {...register('fuelStation')}
          />

          <Input
            id="invoiceNumber"
            label="Invoice Number"
            placeholder="e.g. INV-904231"
            error={errors.invoiceNumber}
            {...register('invoiceNumber')}
          />

        </div>

        {/* Fuel Date & Odometer Readings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <Input
            id="fuelDate"
            label="Fuel Date *"
            type="date"
            error={errors.fuelDate}
            {...register('fuelDate', { 
              required: 'Fuel Date is required.',
              validate: (val) => {
                const inputDate = new Date(val);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return inputDate <= today || 'Fuel Date cannot be in the future.';
              }
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

          {/* Payment Method Dropdown */}
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="paymentMethod" className="text-xs font-semibold text-slate-655 dark:text-slate-400">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
              {...register('paymentMethod')}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Company Account">Company Account</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>

        {/* Remarks logs */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="remarks" className="text-xs font-semibold text-slate-655 dark:text-slate-400">
            Remarks
          </label>
          <textarea
            id="remarks"
            rows="3"
            placeholder="Route fuel, driver notes, full tank verification remarks..."
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('remarks')}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/fuel')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            {isEdit ? 'Save Changes' : 'Log Transaction'}
          </Button>
        </div>

      </FormWrapper>
    </div>
  );
};

export default FuelLogForm;
