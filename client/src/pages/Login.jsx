import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import FormWrapper from '../components/common/FormWrapper.jsx';

/**
 * Centered, Glassmorphic Login portal for TransitOps
 */
export const Login = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setFormError(null);
    const result = await login(data.email, data.password);
    
    if (result.success) {
      showToast('Welcome back to TransitOps!', 'success');
      navigate('/dashboard');
    } else {
      if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach(err => {
          setError(err.field, { type: 'server', message: err.message });
        });
        setFormError('Validation failed. Please review input parameters.');
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        setFormError(result.error);
        showToast(result.error, 'error');
      }
    }
  };

  const onInvalid = (errs) => {
    const firstField = Object.keys(errs)[0];
    if (firstField) {
      const element = document.getElementsByName(firstField)[0] || document.getElementById(firstField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-[450px]">
      
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-9 w-9 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-md">
            TO
          </div>
          <span className="font-extrabold text-2xl text-slate-850 dark:text-slate-100 tracking-wide font-sans">
            Transit<span className="text-primary-600">Ops</span>
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Smart Transport Operations Platform
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit, onInvalid)} error={formError}>
        {/* Email Field */}
        <Input
          id="email"
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

        {/* Password Field */}
        <Input
          id="password"
          label="Password *"
          type="password"
          placeholder="••••••••"
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

        {/* Remember me & Forgot password row */}
        <div className="flex items-center justify-between text-xs mt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-primary-600 focus:ring-primary-500/20"
            />
            <span className="text-slate-500 dark:text-slate-400">Remember Me</span>
          </label>
          <a
            href="#forgot"
            onClick={(e) => {
              e.preventDefault();
              showToast('Password recovery is managed by your system administrator.', 'info');
            }}
            className="text-primary-600 hover:text-primary-750 font-semibold hover:underline"
          >
            Forgot Password?
          </a>
        </div>

        {/* Stacked equal-width buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-6">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Login
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/register')}
            disabled={isLoading}
          >
            Register
          </Button>
        </div>
      </FormWrapper>
    </div>
  );
};

export default Login;
