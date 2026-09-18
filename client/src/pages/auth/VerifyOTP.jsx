import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiHash, FiClock } from 'react-icons/fi';
import { authService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

/**
 * OTP Verification Portal Page for TransitOps Registration Verification
 */
export const VerifyOTP = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email from navigation router state context
  const email = location.state?.email || '';

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [debugOtp, setDebugOtp] = useState(location.state?.debugOtp || '');

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      otp: location.state?.debugOtp || ''
    }
  });

  // Countdown timer effect
  useEffect(() => {
    if (!email) {
      showToast('Session context missing. Please register first.', 'error');
      navigate('/register');
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, email, navigate, showToast]);

  const onSubmit = async (data) => {
    setIsVerifying(true);
    setFormError(null);
    try {
      const res = await authService.verifyOtp({
        email,
        otp: data.otp
      });

      if (res?.success) {
        showToast('Registration completed successfully.', 'success');
        navigate('/login');
      } else {
        setFormError(res?.message || 'Verification failed.');
        showToast(res?.message || 'Verification failed.', 'error');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(e => {
          setError(e.field, { type: 'server', message: e.message });
        });
        setFormError('Validation failed. Please correct the highlighted fields below.');
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        setFormError(err.message || 'Verification failed.');
        showToast(err.message || 'Verification failed.', 'error');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    setFormError(null);
    try {
      const res = await authService.resendOtp({ email });
      if (res?.success) {
        if (res?.data?.debugOtp) {
          setDebugOtp(res.data.debugOtp);
          setValue('otp', res.data.debugOtp);
        }
        showToast('OTP sent successfully. Please check your email.', 'success');
        setCountdown(60); // Reset timer
      } else {
        showToast(res?.message || 'Resending OTP failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Resending OTP failed.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl w-full">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-wide">
          Verify Email
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Provide the verification code sent to your email
        </p>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit)} error={formError}>
        
        {/* Email - ReadOnly */}
        <Input
          label="Registered Email"
          type="text"
          value={email}
          disabled={true}
          icon={FiMail}
          className="bg-slate-50 dark:bg-slate-800 opacity-70 cursor-not-allowed"
        />

        {/* Verification Code Quick-Apply Banner */}
        {debugOtp && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs flex items-center justify-between text-blue-800 dark:text-blue-200">
            <div>
              <span className="font-semibold">Security Code: </span>
              <span className="font-mono text-sm font-bold tracking-widest text-primary-600 dark:text-primary-400 ml-1">
                {debugOtp}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setValue('otp', debugOtp)}
              className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-primary-600 hover:bg-blue-50 cursor-pointer transition-colors shadow-sm"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* OTP Input - Exactly 6 digits */}
        <Input
          label="Verification Code (OTP) *"
          type="text"
          placeholder="e.g. 123456"
          icon={FiHash}
          error={errors.otp}
          maxLength={6}
          {...register('otp', {
            required: 'Verification code is required.',
            pattern: {
              value: /^\d{6}$/,
              message: 'OTP must be exactly 6 numeric digits.'
            }
          })}
        />

        {/* Verification and Timer row */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-450 mt-1 mb-2">
          <div className="flex items-center gap-1.5 font-medium">
            <FiClock className="w-3.5 h-3.5 text-slate-400" />
            {countdown > 0 ? (
              <span>Resend available in <strong className="text-primary-600 font-bold">{countdown}s</strong></span>
            ) : (
              <span className="text-emerald-600 font-semibold">Resend available now</span>
            )}
          </div>

          <button
            type="button"
            disabled={countdown > 0 || isResending}
            onClick={handleResend}
            className={`font-extrabold underline focus:outline-none transition-colors ${
              countdown > 0
                ? 'text-slate-350 cursor-not-allowed dark:text-slate-600'
                : 'text-primary-600 hover:text-primary-750 hover:underline cursor-pointer'
            }`}
          >
            {isResending ? 'Resending...' : 'Resend OTP'}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isVerifying}
        >
          Verify &amp; Create Account
        </Button>

        <div className="text-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-xs text-slate-500 hover:text-slate-700 underline focus:outline-none"
          >
            Back to registration
          </button>
        </div>

      </FormWrapper>
    </div>
  );
};

export default VerifyOTP;
