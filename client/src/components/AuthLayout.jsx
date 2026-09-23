import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { FiSun, FiMoon, FiShield, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * Executive Enterprise Layout for Auth Portals
 * Clean, authoritative corporate aesthetic without blurry AI/neon gradients
 */
export const AuthLayout = () => {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Operational
          </div>

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

      {/* Main Centered Authentication Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[460px]">
          <Outlet />
        </div>
      </main>

      {/* Corporate Compliance & Security Footer */}
      <footer className="w-full py-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E131F]/70 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
          <span className="flex items-center gap-1.5 font-medium">
            <FiShield className="w-3.5 h-3.5 text-slate-400" />
            AES-256 Encrypted Session
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span>© 2026 TransitOps Platform. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
