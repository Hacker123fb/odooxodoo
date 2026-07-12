import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseService } from '../../api/apiService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

const CATEGORIES = [
  'Maintenance', 'Fuel', 'Insurance', 'Toll', 'Parking',
  'Repair', 'Driver Allowance', 'Office Expense', 'Miscellaneous'
];

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Company Account', 'Other'];

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid'];

export const ExpenseForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Determine which statuses the user can set
  const canApprove = user?.role === 'SUPER_ADMIN' || user?.role === 'FINANCIAL_ANALYST';

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      expenseDate: '',
      category: '',
      vehicleId: '',
      tripId: '',
      amount: '',
      vendorName: '',
      invoiceNumber: '',
      paymentMethod: 'Cash',
      description: '',
      remarks: '',
      status: 'Pending'
    }
  });

  // Load select options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await expenseService.getOptions();
        if (res.success && res.data) {
          setVehicles(res.data.vehicles || []);
          setTrips(res.data.trips || []);
        }
      } catch (err) {
        showToast('Failed to load selector options.', 'error');
      }
    };
    loadOptions();
  }, []);

  // Load single record if editing
  useEffect(() => {
    if (!isEdit) return;
    const fetchRecord = async () => {
      setIsLoading(true);
      try {
        const res = await expenseService.getById(id);
        if (res.success && res.data) {
          const e = res.data;
          setValue('expenseDate', e.expenseDate || '');
          setValue('category', e.category || '');
          setValue('vehicleId', e.vehicleId || '');
          setValue('tripId', e.tripId || '');
          setValue('amount', e.amount || '');
          setValue('vendorName', e.vendorName || '');
          setValue('invoiceNumber', e.invoiceNumber || '');
          setValue('paymentMethod', e.paymentMethod || 'Cash');
          setValue('description', e.description || '');
          setValue('remarks', e.remarks || '');
          setValue('status', e.status || 'Pending');
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve expense details.', 'error');
        navigate('/expenses');
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
      expenseDate: data.expenseDate,
      category: data.category,
      vehicleId: data.vehicleId ? parseInt(data.vehicleId, 10) : null,
      tripId: data.tripId ? parseInt(data.tripId, 10) : null,
      amount: parseFloat(data.amount),
      vendorName: data.vendorName,
      invoiceNumber: data.invoiceNumber || null,
      paymentMethod: data.paymentMethod,
      description: data.description,
      remarks: data.remarks,
      status: data.status
    };

    try {
      let res;
      if (isEdit) {
        res = await expenseService.update(id, payload);
      } else {
        res = await expenseService.create(payload);
      }

      if (res.success) {
        showToast(
          isEdit ? 'Expense updated successfully.' : 'Expense recorded successfully.',
          'success'
        );
        navigate('/expenses');
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
        showToast(msg || 'Saving expense failed.', 'error');
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
          {isEdit ? 'Edit Expense' : 'Record New Expense'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Fill in the details below. Required fields are marked with red asterisks (*).
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit, onInvalid)} error={apiError}>

        {/* Date, Category, Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="expenseDate"
            label="Expense Date *"
            type="date"
            error={errors.expenseDate}
            {...register('expenseDate', {
              required: 'Expense Date is required.',
              validate: (val) => {
                const d = new Date(val);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return d <= today || 'Expense Date cannot be in the future.';
              }
            })}
          />

          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="category" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Expense Category *
            </label>
            <select
              id="category"
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.category
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('category', { required: 'Expense Category is required.' })}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.category.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="status" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Status *
            </label>
            <select
              id="status"
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.status
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('status', { required: 'Status is required.' })}
            >
              {STATUSES.map(s => {
                // FLEET_MANAGER cannot set Approved or Paid
                const disabled = !canApprove && (s === 'Approved' || s === 'Paid');
                return <option key={s} value={s} disabled={disabled}>{s}</option>;
              })}
            </select>
            {errors.status && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.status.message}</span>
            )}
          </div>
        </div>

        {/* Vehicle & Trip Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="vehicleId" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Vehicle (Optional)
            </label>
            <select
              id="vehicleId"
              className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
              {...register('vehicleId')}
            >
              <option value="">None</option>
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

          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="tripId" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Trip (Optional)
            </label>
            <select
              id="tripId"
              className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
              {...register('tripId')}
            >
              <option value="">None</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>
                  {t.trip_number} ({t.source_location} ➔ {t.destination_location})
                </option>
              ))}
            </select>
            {errors.tripId && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.tripId.message}</span>
            )}
          </div>
        </div>

        {/* Amount, Vendor, Invoice Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="amount"
            label="Amount (₹) *"
            type="number"
            step="0.01"
            placeholder="e.g. 5000.00"
            error={errors.amount}
            {...register('amount', {
              required: 'Amount is required.',
              min: { value: 0.01, message: 'Amount must be greater than zero.' }
            })}
          />

          <Input
            id="vendorName"
            label="Vendor Name"
            placeholder="e.g. ABC Repairs Ltd."
            error={errors.vendorName}
            {...register('vendorName')}
          />

          <Input
            id="invoiceNumber"
            label="Invoice Number"
            placeholder="e.g. INV-2025-0042"
            error={errors.invoiceNumber}
            {...register('invoiceNumber')}
          />
        </div>

        {/* Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="paymentMethod" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.paymentMethod
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('paymentMethod', { required: 'Payment Method is required.' })}
            >
              {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.paymentMethod && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.paymentMethod.message}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="description" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Description *
          </label>
          <textarea
            id="description"
            rows="3"
            placeholder="Describe the expense — what was purchased, services rendered, etc."
            className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100 ${
              errors.description ? 'border-rose-500' : 'border-slate-350 dark:border-slate-700'
            }`}
            {...register('description', {
              required: 'Description is required.',
              minLength: { value: 3, message: 'Description must be at least 3 characters.' }
            })}
          />
          {errors.description && (
            <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.description.message}</span>
          )}
        </div>

        {/* Remarks */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="remarks" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Remarks
          </label>
          <textarea
            id="remarks"
            rows="2"
            placeholder="Any additional notes, justifications, or comments..."
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('remarks')}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button variant="secondary" onClick={() => navigate('/expenses')} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            {isEdit ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>

      </FormWrapper>
    </div>
  );
};

export default ExpenseForm;
