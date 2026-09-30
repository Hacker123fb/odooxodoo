import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiHash, FiClock, FiShield, FiCheckCircle } from 'react-icons/fi';
import { authService, verifyBackendSecurityProof } from '../../api/apiService.js';
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
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [formError, setFormError] = useState(null);
  const [countdown, setCountdown] = useState(60);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      otp: ''
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
        // Authoritative cryptographic verification with backend before granting success
        await verifyBackendSecurityProof(res, 'REGISTRATION_OTP_VERIFIED', email);

        sessionStorage.removeItem('otp_failed_strikes');
        setIsPendingApproval(true);
        showToast('Registration submitted! Account pending administrative approval.', 'info');
      } else {
        setFormError(res?.message || 'Verification failed.');
        showToast(res?.message || 'Verification failed.', 'error');
      }
    } catch (err) {
      const currentStrikes = parseInt(sessionStorage.getItem('otp_failed_strikes') || '0', 10) + 1;
      sessionStorage.setItem('otp_failed_strikes', currentStrikes.toString());

      const isExplicitBlock = err.code === 'IP_BLOCKED' || err.code === 'ACCOUNT_LOCKED' || err.blocked === true;
      if (isExplicitBlock) {
        sessionStorage.setItem('lockout_info', JSON.stringify({
          message: err.message || 'You have tried too many times. Your IP address is temporarily blocked.',
          remainingMinutes: err.data?.remainingMinutes || 15,
          remainingSeconds: err.data?.remainingSeconds || 900,
          blockedUntil: err.data?.blockedUntil || (Date.now() + 15 * 60 * 1000),
          reason: err.data?.reason || 'TOO_MANY_FAILED_OTP_ATTEMPTS',
          timestamp: Date.now()
        }));
        navigate('/blocked');
        return;
      }

      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(e => {
          setError(e.field, { type: 'server', message: e.message });
        });
        setFormError('Validation failed. Please correct the highlighted fields below.');
        showToast('Please correct the highlighted fields.', 'error');
      } else {
        let msg = err.message || 'Wrong OTP. Please check your code and try again.';
        if (msg.toLowerCase().includes('invalid otp')) {
          msg = 'Wrong OTP. Please check your code and try again.';
        }
        setFormError(msg);
        showToast(msg, 'error');
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

  if (isPendingApproval) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-xl shadow-sm w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-xs">
          <FiShield className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full border border-amber-200/80 dark:border-amber-900/40">
            Pending Administrative Approval
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans mt-3">
            Email Verified Successfully
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-sm mx-auto">
            Your email has been authenticated. For enterprise data integrity and role segregation, your staff account must be reviewed and approved by a <strong>Super Admin</strong> or <strong>Fleet Manager</strong> before access is enabled.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Registered Account:</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono text-xs">{email}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <span className="font-semibold">Status:</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Awaiting Approval
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={() => navigate('/login', { replace: true })}
        >
          Return to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-xl shadow-sm w-full">
      <div className="mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Account Activation
        </span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">
          Verify Security Code
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter the 6-digit verification code sent to your registered email
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
          className="opacity-80"
        />

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
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
          <div className="flex items-center gap-1.5 font-medium">
            <FiClock className="w-3.5 h-3.5 text-slate-400" />
            {countdown > 0 ? (
              <span>Resend available in <strong className="text-slate-900 dark:text-white font-bold">{countdown}s</strong></span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Resend available now</span>
            )}
          </div>

          <button
            type="button"
            disabled={countdown > 0 || isResending}
            onClick={handleResend}
            className={`font-semibold underline underline-offset-2 focus:outline-none transition-colors ${
              countdown > 0
                ? 'text-slate-400 cursor-not-allowed dark:text-slate-600'
                : 'text-slate-900 hover:text-black dark:text-white dark:hover:text-slate-200 cursor-pointer'
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
          Verify &amp; Activate Account
        </Button>

        <div className="text-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline underline-offset-2 focus:outline-none"
          >
            Return to registration
          </button>
        </div>

      </FormWrapper>
    </div>
  );
};

export default VerifyOTP;
