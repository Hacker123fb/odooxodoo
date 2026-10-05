import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
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
  const { login, logout, user, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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

      // Only redirect to /blocked if the server explicitly returned an IP_BLOCKED or ACCOUNT_LOCKED code
      const isExplicitBlock = result.code === 'IP_BLOCKED' || 
                             result.code === 'ACCOUNT_LOCKED' || 
                             result.blocked === true ||
                             (typeof result.error === 'string' && result.error.toLowerCase().includes('ip is blocked'));

      if (isExplicitBlock) {
        const lockData = {
          message: result.error || 'You have tried too many times. Your IP is blocked.',
          remainingMinutes: result.remainingMinutes || 15,
          remainingSeconds: result.remainingSeconds || 900,
          blockedUntil: result.blockedUntil || (Date.now() + 15 * 60 * 1000),
          reason: result.reason || 'BRUTE_FORCE_PREVENTION',
          timestamp: Date.now()
        };
        sessionStorage.setItem('lockout_info', JSON.stringify(lockData));
        localStorage.setItem('lockout_info', JSON.stringify(lockData));
        window.dispatchEvent(new Event('lockout_changed'));
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

  if (isAuthenticated && user) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-xl shadow-sm w-full text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <FiCheckCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Session Detected</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You are signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user.full_name || user.email}</span> ({user.role?.replace('_', ' ')}).
          </p>
        </div>
        <div className="flex flex-col gap-2.5 pt-2">
          <Button variant="primary" onClick={() => navigate('/dashboard')} className="w-full">
            Continue to Operations Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Back to Home Page
          </Button>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-slate-400 hover:text-rose-500 mt-2 transition-colors underline underline-offset-4"
          >
            Sign out of this session
          </button>
        </div>
      </div>
    );
  }

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
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          icon={FiLock}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 focus:outline-none"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex="-1"
            >
              {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
          }
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
