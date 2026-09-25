import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import FormWrapper from '../components/common/FormWrapper.jsx';

/**
 * Executive Corporate Login Portal for TransitOps
 * Professional, clean enterprise aesthetics (No blue/purple AI gradients)
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
      sessionStorage.removeItem('login_failed_strikes');
      showToast('Authentication verified. Welcome to TransitOps.', 'success');
      navigate('/dashboard');
    } else {
      // Track consecutive failed logins
      const currentStrikes = parseInt(sessionStorage.getItem('login_failed_strikes') || '0', 10) + 1;
      sessionStorage.setItem('login_failed_strikes', currentStrikes.toString());

      // On 5 consecutive wrong passwords or 403/429 lockout, redirect to custom blocked page
      if (currentStrikes >= 5 || result.status === 429 || result.status === 403 || result.error?.includes('tried too many times') || result.code === 'IP_BLOCKED') {
        sessionStorage.setItem('lockout_info', JSON.stringify({
          message: 'You have tried too many times. Please try again after some time.',
          remainingMinutes: 60,
          reason: 'TOO_MANY_FAILED_ATTEMPTS',
          timestamp: Date.now()
        }));
        navigate('/blocked');
        return;
      }

      if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach(err => {
          setError(err.field, { type: 'server', message: err.message });
        });
        setFormError('Validation failed. Please review the highlighted fields.');
      } else {
        let errorMsg = result.error || 'Wrong password. Please check your password and try again.';
        if (errorMsg.toLowerCase().includes('invalid password')) {
          errorMsg = 'Wrong password. Please check your password and try again.';
        }
        setFormError(errorMsg);
        showToast(errorMsg, 'error');
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
    <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-xl shadow-sm w-full transition-all">
      
      {/* Executive Portal Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Operations Console
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            v2.4 Production
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
          Sign In
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your authorized staff credentials to continue
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit, onInvalid)} error={formError}>
        {/* Email Address */}
        <Input
          id="email"
          label="Email Address *"
          type="email"
          placeholder="officer@transitops.com"
          icon={FiMail}
          error={errors.email}
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address format'
            }
          })}
        />

        {/* Password */}
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
              message: 'Password must contain at least 6 characters'
            }
          })}
        />

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-slate-900"
            />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Keep me signed in</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white font-semibold underline underline-offset-2 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-5">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In to Dashboard
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate('/register')}
            disabled={isLoading}
          >
            Register Staff Account
          </Button>
        </div>
      </FormWrapper>
    </div>
  );
};

export default Login;
