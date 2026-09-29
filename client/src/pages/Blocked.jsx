import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertOctagon, FiClock, FiShield, FiLock, FiCheckCircle, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import Button from '../components/common/Button.jsx';
import { authService } from '../api/apiService.js';

/**
 * Enterprise Lockout Portal for Rate Limiting & Brute Force IP Defense
 * Displays real-time live countdown timer and strictly guards against login access
 * until the cooldown timer expires.
 */
export const Blocked = () => {
  const navigate = useNavigate();

  const [lockoutData, setLockoutData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('lockout_info');
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
  const [checking, setChecking] = useState(false);
  const [unblockedMessage, setUnblockedMessage] = useState(null);
  const [isCooldownComplete, setIsCooldownComplete] = useState(() => getInitialSeconds() <= 0);

  // Active countdown timer effect
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
          handleCheckStatus(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  // Query live IP status from the backend
  const handleCheckStatus = async (autoRedirect = false) => {
    setChecking(true);
    setUnblockedMessage(null);

    try {
      const res = await authService.getIpStatus();

      if (!res?.blocked) {
        sessionStorage.removeItem('lockout_info');
        setUnblockedMessage('Your security cooldown has expired! Redirecting to login portal...');
        setIsCooldownComplete(true);

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        const remainingSecs = res.remainingSeconds || ((res.remainingMinutes || 15) * 60);
        setSecondsRemaining(remainingSecs);
        setIsCooldownComplete(false);

        // Update stored timestamp
        sessionStorage.setItem('lockout_info', JSON.stringify({
          ...lockoutData,
          remainingMinutes: res.remainingMinutes,
          remainingSeconds: remainingSecs,
          blockedUntil: res.blockedUntil || (Date.now() + remainingSecs * 1000)
        }));

        setUnblockedMessage(`Security cooldown is still active. Please wait ${Math.ceil(remainingSecs / 60)} more minute(s).`);
      }
    } catch (err) {
      if (autoRedirect) {
        sessionStorage.removeItem('lockout_info');
        navigate('/login', { replace: true });
      } else {
        setUnblockedMessage('Cooldown status active. Please allow the timer to complete.');
      }
    } finally {
      setChecking(false);
    }
  };

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

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-100/90 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0E131F]/90">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
            TO
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
              Transit<span className="text-slate-500 dark:text-slate-400">Ops</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          Access Restricted
        </div>
      </header>

      {/* Main Lockout Notice */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-xl shadow-lg w-full max-w-[500px] text-center">
          
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
                : 'Cooldown complete. Verifying access...'}
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

          {unblockedMessage && (
            <div className={`mt-4 p-3 rounded-lg text-xs font-semibold border ${
              isCooldownComplete 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}>
              {unblockedMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            {isCooldownComplete ? (
              <Button
                type="button"
                variant="primary"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  sessionStorage.removeItem('lockout_info');
                  navigate('/login', { replace: true });
                }}
              >
                <FiCheckCircle className="w-4 h-4" />
                Proceed to Login Portal
                <FiArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleCheckStatus(false)}
                  isLoading={checking}
                >
                  <FiRefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                  Refresh Cooldown Status
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 py-1">
                  <FiLock className="w-3.5 h-3.5" />
                  <span>Login portal disabled until cooldown reaches 00:00</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E131F]/70 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>© 2026 TransitOps Platform • Automated Security Lockout Policy</span>
      </footer>
    </div>
  );
};

export default Blocked;
