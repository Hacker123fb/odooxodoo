import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertOctagon, FiClock, FiShield, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import Button from '../components/common/Button.jsx';
import axiosInstance from '../api/axiosInstance.js';

/**
 * Custom Lockout Page for Rate Limiting & Brute Force IP Defense
 * Displayed when maximum failed passwords or OTP attempts are exceeded.
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

  const [checking, setChecking] = useState(false);
  const [unblockedMessage, setUnblockedMessage] = useState(null);

  // Check if IP is already unblocked
  const handleCheckStatus = async () => {
    setChecking(true);
    setUnblockedMessage(null);
    try {
      const res = await axiosInstance.get('/health/ping');
      if (res?.status === 'alive') {
        sessionStorage.removeItem('lockout_info');
        setUnblockedMessage('Your cooldown has expired! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      if (err.status === 403 || err.status === 429) {
        setUnblockedMessage(err.message || 'Cooldown is still active. Please wait a few more minutes.');
      } else {
        setUnblockedMessage('System is active. Please try again shortly.');
      }
    } finally {
      setChecking(false);
    }
  };

  const remainingMinutes = lockoutData?.remainingMinutes || 15;
  const customMessage = lockoutData?.message || 'You have tried too many times. Please try again after some time.';

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
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Access Restricted
        </div>
      </header>

      {/* Main Lockout Notice */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-xl shadow-sm w-full max-w-[500px] text-center">
          
          {/* Lockout Icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 shadow-xs">
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

          {/* Details Card */}
          <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-[#0E1422] border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <FiClock className="w-3.5 h-3.5 text-slate-400" />
                Cooldown Window:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                ~{remainingMinutes} minutes
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span className="font-semibold flex items-center gap-1.5">
                <FiShield className="w-3.5 h-3.5 text-slate-400" />
                Reason:
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Successive Failed Verification Attempts
              </span>
            </div>
          </div>

          {unblockedMessage && (
            <div className="mt-4 p-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {unblockedMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleCheckStatus}
              isLoading={checking}
            >
              <FiRefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              Check If Cooldown Has Expired
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => navigate('/login')}
            >
              <FiArrowLeft className="w-4 h-4" />
              Return to Login Portal
            </Button>
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
