import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiLogIn, FiHome, FiShield } from 'react-icons/fi';
import Button from '../../components/common/Button.jsx';

/**
 * Enterprise Custom 401 Unauthorized Page
 * Displayed when user needs to sign in to access a section
 */
export const Unauthorized401 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-100/90 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar */}
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

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold">
          <FiShield className="w-3.5 h-3.5" />
          <span>Status 401</span>
        </div>
      </header>

      {/* Main Notice */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-2xl shadow-lg w-full max-w-[480px] text-center">
          {/* Security Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 shadow-xs">
            <FiLock className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full border border-amber-200/80 dark:border-amber-900/40">
            Sign In Required
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans mt-3">
            Authentication Required
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Please sign in to your TransitOps account to access this section and view your operational dashboard.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
              onClick={() => navigate('/')}
            >
              <FiHome className="w-4 h-4" /> Back to Home
            </Button>

            <Button
              type="button"
              variant="primary"
              className="w-full flex items-center justify-center gap-2 text-xs py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold shadow-sm"
              onClick={() => navigate('/login')}
            >
              <FiLogIn className="w-4 h-4" /> Sign In to Portal
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E131F]/70 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>© 2026 TransitOps Platform • Authentication Service</span>
      </footer>
    </div>
  );
};

export default Unauthorized401;
