import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiSliders, FiHash } from 'react-icons/fi';
import { authService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

/**
 * Modern staff registration portal page for TransitOps with OTP flow
 */
export const Register = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      fullName: '',
      employeeCode: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      roleName: ''
    }
  });

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setIsSaving(true);
    setFormError(null);
    try {
      // 1. Submit registration details to send OTP
      const res = await authService.register({
        fullName: data.fullName,
        employeeCode: data.employeeCode,
        email: data.email,
        phone: data.phone,
        password: data.password,
        roleName: data.roleName
      });

      if (res?.success) {
        showToast('OTP sent successfully. Please check your registered email inbox.', 'success');
        // Redirect to OTP verification page with state context
        navigate('/verify-otp', { state: { email: data.email } });
      } else {
        setFormError(res?.message || 'Registration failed.');
        showToast(res?.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(e => {
          let fieldName = e.field;
          if (fieldName === 'fullName') fieldName = 'fullName';
          if (fieldName === 'employeeCode') fieldName = 'employeeCode';
          if (fieldName === 'email') fieldName = 'email';
          if (fieldName === 'phone') fieldName = 'phone';
          if (fieldName === 'password') fieldName = 'password';
          if (fieldName === 'roleName') fieldName = 'roleName';

          setError(fieldName, { type: 'server', message: e.message });
        });
        setFormError('Validation failed. Please correct the highlighted fields below.');
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        setFormError(err.message || 'An unexpected error occurred.');
        showToast(err.message || 'Registration failed.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const roles = [
    { code: 'SUPER_ADMIN', label: 'Super Admin' },
    { code: 'FLEET_MANAGER', label: 'Fleet Manager' },
    { code: 'DISPATCHER', label: 'Dispatcher' },
    { code: 'SAFETY_OFFICER', label: 'Safety Officer' },
    { code: 'FINANCIAL_ANALYST', label: 'Financial Analyst' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl w-full">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-wide">
          Create Account
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Register operational staff credentials
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit)} error={formError}>
        
        {/* Full Name */}
        <Input
          label="Full Name *"
          placeholder="e.g. John Doe"
          icon={FiUser}
          error={errors.fullName}
          {...register('fullName', {
            required: 'Full name is required'
          })}
        />

        {/* Employee Code */}
        <Input
          label="Employee Code *"
          placeholder="e.g. EMP123"
          icon={FiHash}
          error={errors.employeeCode}
          {...register('employeeCode', {
            required: 'Employee Code is required',
            pattern: {
              value: /^[A-Z0-9\s#\-_]+$/i,
              message: 'Employee Code can contain letters, numbers, spaces, and #-_'
            }
          })}
        />

        {/* Email */}
        <Input
          label="Email Address *"
          type="email"
          placeholder="name@transitops.com"
          icon={FiMail}
          error={errors.email}
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
        />

        {/* Phone / Mobile Number */}
        <Input
          label="Mobile Number *"
          placeholder="e.g. 9876543210"
          icon={FiPhone}
          error={errors.phone}
          {...register('phone', {
            required: 'Mobile number is required',
            pattern: {
              value: /^\d{10,15}$/,
              message: 'Mobile number must be between 10 and 15 digits'
            }
          })}
        />

        {/* Password */}
        <Input
          label="Password *"
          type="password"
          placeholder="Min 8 chars, 1 Upper, 1 Lower, 1 Num, 1 Spec"
          icon={FiLock}
          error={errors.password}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{}|;:',.<>/?]).{8,}$/,
              message: 'Password must contain uppercase, lowercase, number, and special character'
            }
          })}
        />

        {/* Confirm Password */}
        <Input
          label="Confirm Password *"
          type="password"
          placeholder="Re-enter password"
          icon={FiLock}
          error={errors.confirmPassword}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: val => val === passwordVal || 'Passwords do not match'
          })}
        />

        {/* Role Name Selection */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="roleName" className="text-xs font-semibold text-slate-655 dark:text-slate-400 flex items-center gap-1.5">
            <FiSliders className="w-3.5 h-3.5 text-slate-400" /> Account Role *
          </label>
          <select
            id="roleName"
            className={`w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
              errors.roleName
                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-250 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
            }`}
            {...register('roleName', {
              required: 'Role selection is required'
            })}
          >
            <option value="">Select operational role...</option>
            {roles.map(r => (
              <option key={r.code} value={r.code}>{r.label}</option>
            ))}
          </select>
          {errors.roleName && (
            <span className="text-xs font-medium text-rose-500 mt-0.5">{errors.roleName.message}</span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-4"
          isLoading={isSaving}
        >
          Send Verification OTP
        </Button>

        <div className="text-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-750 font-bold underline focus:outline-none"
            >
              Sign In instead
            </button>
          </p>
        </div>

      </FormWrapper>
    </div>
  );
};

export default Register;
