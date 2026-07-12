import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Centered layout for auth pages (Login, Register, and Verify OTP)
 */
export const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect directly to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <div className="w-full max-w-[450px]">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
