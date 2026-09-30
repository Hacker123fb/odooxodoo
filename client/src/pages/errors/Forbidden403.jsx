import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiSlash, FiShieldOff, FiHome, FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Enterprise Custom 403 Forbidden Page
 * Displayed when an authenticated user tries to access a restricted resource or endpoint
 */
export const Forbidden403 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const attemptedPath = location.state?.attemptedPath || location.pathname;
  const customReason = location.state?.reason || 'Your account does not have sufficient role permissions to view this resource.';

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

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
          <FiShieldOff className="w-3.5 h-3.5" />
          <span>Security Protocol 403</span>
        </div>
      </header>

      {/* Main Notice */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-2xl shadow-lg w-full max-w-[520px] text-center">
          {/* Security Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-5 shadow-xs">
            <FiSlash className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full border border-rose-200/80 dark:border-rose-900/40">
            HTTP Error 403 • Access Denied
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans mt-3">
            Insufficient Permissions
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {customReason}
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-[#0E1422] border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Current User:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{user?.email || 'Authenticated Session'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span className="font-semibold">Current Role:</span>
              <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-300 font-bold">
                {user?.role || 'STANDARD_USER'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span className="font-semibold">Restricted Path:</span>
              <span className="font-mono text-xs text-rose-600 dark:text-rose-400 truncate max-w-[220px]">
                {attemptedPath}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
              onClick={() => navigate(-1)}
            >
              <FiArrowLeft className="w-4 h-4" /> Go Back
            </Button>

            <Button
              type="button"
              variant="primary"
              className="w-full flex items-center justify-center gap-2 text-xs py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold shadow-sm"
              onClick={() => navigate('/dashboard')}
            >
              <FiHome className="w-4 h-4" /> Return to Dashboard
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E131F]/70 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>© 2026 TransitOps Platform • Role-Based Access Control (RBAC)</span>
      </footer>
    </div>
  );
};

export default Forbidden403;
