import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiKey, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { authService } from '../../api/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import FormWrapper from '../../components/common/FormWrapper.jsx';

/**
 * Centered, Glassmorphic Forgot Password Portal for TransitOps
 * Step 1: Request Password Reset Code
 * Step 2: Verify Code and Set New Password
 */
export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1 = Request Code, 2 = Verify Code & Reset
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Form hook for Step 1 (Request Code)
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 }
  } = useForm({
    defaultValues: { email: '' }
  });

  // Form hook for Step 2 (Reset Password)
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    watch: watchStep2,
    formState: { errors: errorsStep2 }
  } = useForm({
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' }
  });

  const newPasswordValue = watchStep2('newPassword');

  // Submit Step 1: Request Code
  const onSubmitStep1 = async (data) => {
    setFormError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: data.email });
      setEmail(data.email);
      setStep(2);
      setCooldown(60);
      showToast('A 6-digit verification code has been sent to your email.', 'success');
    } catch (err) {
      const msg = err.message || 'Failed to send reset code. Please check the email and try again.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Step 2: Reset Password
  const onSubmitStep2 = async (data) => {
    setFormError(null);
    setIsLoading(true);
    try {
      await authService.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword
      });
      showToast('Password reset successfully! Redirecting to login...', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg = err.message || 'Failed to reset password. Please check your OTP code.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Code in Step 2
  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setFormError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email });
      setCooldown(60);
      showToast('A new verification code has been sent to your email.', 'success');
    } catch (err) {
      const msg = err.message || 'Failed to resend code. Please try again.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-[460px]">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-9 w-9 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-md">
            TO
          </div>
          <span className="font-extrabold text-2xl text-slate-850 dark:text-slate-100 tracking-wide font-sans">
            Transit<span className="text-primary-600">Ops</span>
          </span>
        </div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {step === 1
            ? 'Enter your registered email address to receive a 6-digit verification code.'
            : `Enter the verification code sent to ${email}`}
        </p>
      </div>

      {/* Step 1: Request Code */}
      {step === 1 && (
        <FormWrapper onSubmit={handleSubmitStep1(onSubmitStep1)} error={formError}>
          <Input
            id="email"
            label="Registered Email Address *"
            type="email"
            placeholder="name@transitops.com"
            icon={FiMail}
            error={errorsStep1.email}
            {...registerStep1('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />

          <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Send Verification Code
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/login')}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </div>
        </FormWrapper>
      )}

      {/* Step 2: Verify Code and Reset Password */}
      {step === 2 && (
        <FormWrapper onSubmit={handleSubmitStep2(onSubmitStep2)} error={formError}>
          {/* Email badge with change option */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs mb-4">
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
              {email}
            </span>
            <button
              type="button"
              onClick={() => { setStep(1); setFormError(null); }}
              className="text-primary-600 hover:text-primary-700 font-semibold ml-2 text-xs"
            >
              Change
            </button>
          </div>

          {/* OTP Input */}
          <Input
            id="otp"
            label="6-Digit Verification Code *"
            type="text"
            placeholder="123456"
            maxLength={6}
            icon={FiKey}
            error={errorsStep2.otp}
            {...registerStep2('otp', {
              required: 'Verification code is required',
              pattern: {
                value: /^\d{6}$/,
                message: 'Must be exactly 6 numeric digits'
              }
            })}
          />

          {/* New Password */}
          <Input
            id="newPassword"
            label="New Password *"
            type="password"
            placeholder="••••••••"
            icon={FiLock}
            error={errorsStep2.newPassword}
            {...registerStep2('newPassword', {
              required: 'New password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters long'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{}|;:',.<>/?]).{8,}$/,
                message: 'Must contain uppercase, lowercase, number & special character'
              }
            })}
          />

          {/* Confirm New Password */}
          <Input
            id="confirmPassword"
            label="Confirm New Password *"
            type="password"
            placeholder="••••••••"
            icon={FiLock}
            error={errorsStep2.confirmPassword}
            {...registerStep2('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (value) =>
                value === newPasswordValue || 'Passwords do not match'
            })}
          />

          {/* Resend Code Link */}
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-500 dark:text-slate-400">Didn't get the code?</span>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={cooldown > 0 || isLoading}
              className={`font-semibold ${
                cooldown > 0
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'text-primary-600 hover:text-primary-700 hover:underline'
              }`}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Reset Password
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/login')}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </div>
        </FormWrapper>
      )}
    </div>
  );
};

export default ForgotPassword;
