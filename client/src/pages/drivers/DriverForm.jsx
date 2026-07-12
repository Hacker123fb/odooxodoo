import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { driverService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

/**
 * Creation and Editing Form for drivers roster profiles
 */
export const DriverForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      full_name: '',
      employee_id: '',
      email: '',
      phone: '',
      license_number: '',
      license_expiry: '',
      license_class: '',
      safety_score: 100,
      status: 'Available',
      user_notes: ''
    }
  });

  // If editing, load driver profile details
  useEffect(() => {
    if (!isEdit) return;
    const fetchDriver = async () => {
      setIsLoading(true);
      try {
        const res = await driverService.getById(id);
        if (res.success && res.data) {
          const d = res.data;
          setValue('full_name', d.full_name);
          setValue('employee_id', d.employee_id);
          setValue('email', d.email || '');
          setValue('phone', d.phone);
          setValue('license_number', d.license_number);
          
          // Format expiry date to YYYY-MM-DD for standard input values
          if (d.license_expiry) {
            const dateStr = new Date(d.license_expiry).toISOString().split('T')[0];
            setValue('license_expiry', dateStr);
          }
          
          setValue('license_class', d.license_class);
          setValue('safety_score', d.safety_score);
          setValue('status', d.ui_status);
          setValue('user_notes', d.user_notes || '');
        }
      } catch (err) {
        showToast(err.message || 'Failed to retrieve driver profile.', 'error');
        navigate('/drivers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDriver();
  }, [id, isEdit, setValue]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    setApiError(null);
    try {
      let res;
      if (isEdit) {
        res = await driverService.update(id, data);
      } else {
        res = await driverService.create(data);
      }

      if (res.success) {
        showToast(
          isEdit ? 'Driver profile updated successfully.' : 'Driver profile registered successfully.',
          'success'
        );
        navigate('/drivers');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(e => {
          // Map backend field names (snake_case/camelCase) dynamically to hook form values
          let fieldName = e.field;
          if (fieldName === 'employeeCode' || fieldName === 'employee_id') fieldName = 'employee_id';
          if (fieldName === 'mobileNumber' || fieldName === 'phone') fieldName = 'phone';
          if (fieldName === 'licenseNumber' || fieldName === 'license_number') fieldName = 'license_number';
          if (fieldName === 'licenseCategory' || fieldName === 'license_class') fieldName = 'license_class';
          if (fieldName === 'licenseExpiryDate' || fieldName === 'license_expiry') fieldName = 'license_expiry';
          if (fieldName === 'safetyScore' || fieldName === 'safety_score') fieldName = 'safety_score';
          if (fieldName === 'remarks' || fieldName === 'user_notes') fieldName = 'user_notes';

          setError(fieldName, { type: 'server', message: e.message });
        });
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        setApiError(err.message);
        showToast(err.message || 'Saving profile failed.', 'error');
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
          {isEdit ? 'Edit Operator Profile' : 'Register New Driver'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Populate details below to update professional driver profiles. Required fields are marked with red asterisks (*).
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit)} error={apiError}>
        
        {/* Full Name */}
        <Input
          label="Full Name *"
          error={errors.full_name}
          placeholder="e.g. John Doe"
          {...register('full_name', { 
            required: 'Full Name is required.',
            minLength: { value: 3, message: 'Full Name must be at least 3 characters.' }
          })}
        />

        {/* Identification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Employee ID */}
          <Input
            label="Employee Code *"
            error={errors.employee_id}
            placeholder="e.g. EMP1049"
            {...register('employee_id', { 
              required: 'Employee Code is required.',
              pattern: { value: /^[A-Z0-9]+$/i, message: 'Employee Code must be alphanumeric.' }
            })}
          />

          {/* Phone Number */}
          <Input
            label="Mobile Number *"
            error={errors.phone}
            placeholder="e.g. 9876543210"
            {...register('phone', { 
              required: 'Mobile number is required.',
              pattern: { value: /^\d{10}$/, message: 'Mobile number must contain exactly 10 digits.' }
            })}
          />

          {/* Email Address */}
          <Input
            label="Email *"
            type="email"
            error={errors.email}
            placeholder="name@transitops.com"
            {...register('email', { 
              required: 'Email is required.',
              pattern: { 
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                message: 'Email must be a valid email format.' 
              }
            })}
          />

          {/* License Class */}
          <Input
            label="License Category *"
            error={errors.license_class}
            placeholder="e.g. Class A CDL, Heavy Rigid"
            {...register('license_class', { required: 'License Category is required.' })}
          />

          {/* License Number */}
          <Input
            label="License Number *"
            error={errors.license_number}
            placeholder="e.g. DL9048123"
            {...register('license_number', { required: 'License number is required.' })}
          />

          {/* Expiry Date */}
          <Input
            label="License Expiry Date *"
            type="date"
            error={errors.license_expiry}
            {...register('license_expiry', { 
              required: 'License expiry date is required.',
              validate: (val) => {
                const inputDate = new Date(val);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return inputDate > today || 'License expiry date must be a future date.';
              }
            })}
          />

          {/* Safety Score */}
          <Input
            label="Driver Safety Score (0 - 100)"
            type="number"
            error={errors.safety_score}
            {...register('safety_score', {
              min: { value: 0, message: 'Safety Score must be between 0 and 100.' },
              max: { value: 100, message: 'Safety Score must be between 0 and 100.' }
            })}
          />

          {/* Status Selection */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Status *
            </label>
            <select
              className={`w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                errors.status
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-350 dark:border-slate-700 focus:border-primary-500'
              }`}
              {...register('status', { required: 'Status is required.' })}
            >
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
            {errors.status && (
              <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.status.message}</span>
            )}
          </div>

        </div>

        {/* General Notes */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            Professional Notes / Remarks
          </label>
          <textarea
            rows="3"
            placeholder="Document route references, incidents, physical logs, or dispatch instructions..."
            className="w-full py-2 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-slate-100"
            {...register('user_notes')}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/drivers')}
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

export default DriverForm;
