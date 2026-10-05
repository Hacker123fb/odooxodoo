import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertOctagon, FiClock, FiShield, FiLock, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import Button from './Button.jsx';
import { authService } from '../../api/apiService.js';

/**
 * Enterprise Lockout Card for Rate Limiting & Brute Force IP Defense
 * Displays real-time live countdown timer. Can be rendered inline or within a standalone view.
 */
export const BlockedCard = ({ onCooldownComplete = null }) => {
  const navigate = useNavigate();

  const [lockoutData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('lockout_info') || localStorage.getItem('lockout_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Calculate initial seconds remaining
  const getInitialSeconds = () => {
    if (lockoutData?.blockedUntil) {
      const diffSecs = Math.ceil((lockoutData.blockedUntil - Date.now()) / 1000);
      return Math.max(0, diffSecs);
    }
    const mins = lockoutData?.remainingMinutes || 15;
    return mins * 60;
  };

  const [secondsRemaining, setSecondsRemaining] = useState(getInitialSeconds);
  const [isCooldownComplete, setIsCooldownComplete] = useState(() => getInitialSeconds() <= 0);
  const [isUnblocking, setIsUnblocking] = useState(false);

  // Active countdown timer effect (ticks down cleanly without erratic network redirects)
  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsCooldownComplete(true);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCooldownComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  // Formatter for MM:SS or HH:MM:SS
  const formatCountdown = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const customMessage = lockoutData?.message || 'You have tried too many times. Your IP address is temporarily blocked.';

  const handleProceed = async () => {
    setIsUnblocking(true);
    try {
      sessionStorage.removeItem('lockout_info');
      localStorage.removeItem('lockout_info');
      sessionStorage.removeItem('login_failed_strikes');
      await authService.unblock();
    } catch {
      // ignore
    } finally {
      setIsUnblocking(false);
      if (onCooldownComplete) {
        onCooldownComplete();
      } else {
        navigate('/login', { replace: true });
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-xl shadow-lg w-full max-w-[500px] text-center mx-auto">
      
      {/* Lockout Icon */}
      <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-5 shadow-xs">
        <FiAlertOctagon className="w-7 h-7" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full border border-rose-200/80 dark:border-rose-900/40">
        Security Cooldown Active
      </span>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans mt-3">
        You Have Tried Too Many Times
      </h1>

      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
        {customMessage}
      </p>

      {/* Active Live Countdown Timer Display */}
      <div className="mt-6 p-6 rounded-xl bg-slate-900 dark:bg-[#070A11] border border-slate-800 text-center relative overflow-hidden shadow-inner">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-center gap-1.5">
          <FiClock className="w-3.5 h-3.5 text-rose-500" />
          Cooldown Time Remaining
        </div>

        <div className="text-4xl sm:text-5xl font-mono font-extrabold text-rose-400 dark:text-rose-300 tracking-wider py-1 select-none">
          {formatCountdown(secondsRemaining)}
        </div>

        <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
          <FiLock className="w-3 h-3 text-slate-500" />
          {secondsRemaining > 0 
            ? 'Portal access is locked until the timer expires' 
            : 'Cooldown complete. You may now proceed.'}
        </div>
      </div>

      {/* Details Card */}
      <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span className="font-semibold flex items-center gap-1.5">
            <FiClock className="w-3.5 h-3.5 text-slate-400" />
            Cooldown Window:
          </span>
          <span className="font-bold text-slate-900 dark:text-white">
            ~{lockoutData?.remainingMinutes || 15} minutes
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <span className="font-semibold flex items-center gap-1.5">
            <FiShield className="w-3.5 h-3.5 text-slate-400" />
            Reason:
          </span>
          <span className="text-slate-800 dark:text-slate-200 font-medium">
            {lockoutData?.reason?.replace(/_/g, ' ') || 'Successive Failed Attempts'}
          </span>
        </div>
      </div>

      {/* Action Buttons / Status */}
      <div className="flex flex-col gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        {isCooldownComplete ? (
          <Button
            type="button"
            variant="primary"
            disabled={isUnblocking}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg shadow-sm"
            onClick={handleProceed}
          >
            <FiCheckCircle className="w-4 h-4" />
            {isUnblocking ? 'Unlocking...' : 'Proceed to Login Portal'}
            <FiArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <FiLock className="w-4 h-4 shrink-0" />
              <span>Access Temporarily Suspended</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-normal">
              The login portal will become accessible automatically when the cooldown timer finishes. Please wait for the timer to reach 00:00.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedCard;
