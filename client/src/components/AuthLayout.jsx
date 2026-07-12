import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FiTrendingUp } from 'react-icons/fi';

/**
 * Authentication split screen layout
 */
export const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect directly to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      
      {/* Brand visuals: Left Panel */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        
        {/* Background styling layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-slate-900 to-slate-950 z-0" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600 rounded-full filter blur-[120px] opacity-20" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600 rounded-full filter blur-[120px] opacity-20" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            TO
          </div>
          <span className="font-extrabold text-lg tracking-wide font-sans">
            Transit<span className="text-primary-500">Ops</span>
          </span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-primary-300">
            <FiTrendingUp className="w-3.5 h-3.5" /> Fleet & Transport Efficiency
          </div>
          
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight font-sans">
            Smart Operations, Real-time Control.
          </h1>
          
          <p className="text-slate-400 text-sm leading-relaxed">
            Monitor trips, assign drivers, schedule maintenance, and log fuel expenses under a centralized logistics platform.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © 2026 TransitOps. All rights reserved.
        </div>
      </div>

      {/* Screen Form Zone: Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-6 left-6 flex md:hidden items-center gap-2">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            TO
          </div>
          <span className="font-extrabold text-base tracking-wide text-slate-800 dark:text-slate-100">
            Transit<span className="text-primary-600">Ops</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
