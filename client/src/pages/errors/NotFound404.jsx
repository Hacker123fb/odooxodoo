import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiAlertCircle, FiHome, FiArrowLeft, FiCompass } from 'react-icons/fi';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Enterprise Custom 404 Not Found Page
 * Displayed for any unknown route, invalid record ID, or relocated path
 */
export const NotFound404 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const attemptedPath = location.pathname;

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

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400 text-xs font-semibold">
          <FiCompass className="w-3.5 h-3.5" />
          <span>Routing Protocol 404</span>
        </div>
      </header>

      {/* Main Notice */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 rounded-2xl shadow-lg w-full max-w-[500px] text-center">
          {/* 404 Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-5 shadow-xs">
            <FiAlertCircle className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/60">
            HTTP Error 404 • Missing Resource
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans mt-3">
            Page Not Found
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            The requested path <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">{attemptedPath}</code> does not exist, has been decommissioned, or was moved to another location.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
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
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            >
              <FiHome className="w-4 h-4" /> {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E131F]/70 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>© 2026 TransitOps Platform • Navigation Routing Service</span>
      </footer>
    </div>
  );
};

export default NotFound404;
