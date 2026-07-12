import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiSliders } from 'react-icons/fi';
import { authService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

/**
 * Professional registration portal page for TransitOps
 */
export const Register = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      roleName: ''
    }
  });

  const onSubmit = async (data) => {
    setIsSaving(true);
    setFormError(null);
    try {
      const res = await authService.register(data);
      if (res?.success) {
        showToast('Registration successful! Please log in.', 'success');
        navigate('/login');
      } else {
        setFormError(res?.message || 'Registration failed.');
        showToast(res?.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(e => {
          setError(e.field, { type: 'server', message: e.message });
        });
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        setFormError(err.message || 'An unexpected error occurred.');
        showToast(err.message || 'Network error.', 'error');
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
    <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-8 rounded-2xl shadow-xl w-full">
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

        {/* Password */}
        <Input
          label="Password *"
          type="password"
          placeholder="Min 6 characters"
          icon={FiLock}
          error={errors.password}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          })}
        />

        {/* Phone */}
        <Input
          label="Phone Number"
          placeholder="e.g. +919876543210"
          icon={FiPhone}
          error={errors.phone}
          {...register('phone')}
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
          Register Roster User
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
