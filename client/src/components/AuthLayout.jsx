import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { authService } from '../api/apiService.js';
import BlockedCard from './common/BlockedCard.jsx';

/**
 * Executive Enterprise Layout for Auth Portals
 * Clean, authoritative corporate aesthetic with active IP lockout gatekeeper.
 * If IP is blocked, immediately redirects to /blocked so login page is never accessible.
 */
export const AuthLayout = () => {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Evaluate isBlocked SYNCHRONOUSLY from session/local storage
  const [isBlocked, setIsBlocked] = useState(() => {
    try {
      const raw = sessionStorage.getItem('lockout_info') || localStorage.getItem('lockout_info');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed?.blockedUntil && Date.now() < parsed.blockedUntil) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const verifyIpLockout = async () => {
      try {
        const res = await authService.getIpStatus();
        if (isMounted) {
          if (res?.blocked) {
            const remainingSeconds = res.remainingSeconds || ((res.remainingMinutes || 15) * 60);
            const blockedUntil = res.blockedUntil || (Date.now() + remainingSeconds * 1000);
            const lockData = {
              message: res.message || 'You have tried too many times. Your IP is blocked.',
              remainingMinutes: res.remainingMinutes || 15,
              remainingSeconds,
              blockedUntil,
              reason: res.reason || 'BRUTE_FORCE_PREVENTION',
              timestamp: Date.now()
            };
            sessionStorage.setItem('lockout_info', JSON.stringify(lockData));
            localStorage.setItem('lockout_info', JSON.stringify(lockData));
            setIsBlocked(true);
          } else {
            // Server confirms not blocked
            sessionStorage.removeItem('lockout_info');
            localStorage.removeItem('lockout_info');
            setIsBlocked(false);
          }
        }
      } catch (e) {
        if (e.status === 403 && (e.code === 'IP_BLOCKED' || e.code === 'ACCOUNT_LOCKED')) {
          if (isMounted) setIsBlocked(true);
        } else {
          sessionStorage.removeItem('lockout_info');
          localStorage.removeItem('lockout_info');
          if (isMounted) setIsBlocked(false);
        }
      } finally {
        // Verification complete
      }
    };

    verifyIpLockout();

    // Listen for lockout status changes dispatched within the app or other tabs
    const handleLockoutChange = () => {
      const raw = sessionStorage.getItem('lockout_info') || localStorage.getItem('lockout_info');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.blockedUntil && Date.now() < parsed.blockedUntil) {
            setIsBlocked(true);
            return;
          }
        } catch {}
      }
      setIsBlocked(false);
    };

    window.addEventListener('lockout_changed', handleLockoutChange);
    window.addEventListener('storage', handleLockoutChange);

    return () => {
      isMounted = false;
      window.removeEventListener('lockout_changed', handleLockoutChange);
      window.removeEventListener('storage', handleLockoutChange);
    };
  }, []);

  if (isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-100/90 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Executive Top Navigation Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0E131F]/90">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
            TO
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
              Transit<span className="text-slate-500 dark:text-slate-400">Ops</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Enterprise Fleet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isBlocked ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Access Restricted
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational
            </div>
          )}

          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle visual theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Centered Content Area: Directly displays BlockedCard on /login when IP is blocked */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[500px]">
          {isBlocked ? (
            <BlockedCard 
              onCooldownComplete={() => {
                sessionStorage.removeItem('lockout_info');
                localStorage.removeItem('lockout_info');
                setIsBlocked(false);
              }}
            />
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      {/* Executive Footer */}
      <footer className="w-full py-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E131F]/70 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>© 2026 TransitOps Platform • Enterprise Fleet Management System</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
