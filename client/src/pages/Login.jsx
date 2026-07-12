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
 * Modern login dashboard portal
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
          // Map to email or password
          setError(err.field, { type: 'server', message: err.message });
        });
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        setFormError(result.error);
        showToast(result.error, 'error');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl w-full">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-wide">
          Welcome back
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Access the fleet intelligence dashboard
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit)} error={formError}>
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

        <Input
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

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-primary-600 focus:ring-primary-500/20"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">Remember session</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <div className="text-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-primary-600 hover:text-primary-750 font-bold underline focus:outline-none"
            >
              Register here
            </button>
          </p>
        </div>
      </FormWrapper>
    </div>
  );
};

export default Login;
