import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import ProtectedLayout from '../components/ProtectedLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// ============================================================================
// LAZY-LOADED PAGE MODULES (DYNAMIC ON-DEMAND CODE SPLITTING CHUNKS)
// ============================================================================
const Login = lazy(() => import('../pages/Login.jsx'));
const Register = lazy(() => import('../pages/auth/Register.jsx'));
const VerifyOTP = lazy(() => import('../pages/auth/VerifyOTP.jsx'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'));
const Blocked = lazy(() => import('../pages/Blocked.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));

// Custom Error Pages
const Unauthorized401 = lazy(() => import('../pages/errors/Unauthorized401.jsx'));
const Forbidden403 = lazy(() => import('../pages/errors/Forbidden403.jsx'));
const NotFound404 = lazy(() => import('../pages/errors/NotFound404.jsx'));

// Vehicles
const VehicleList = lazy(() => import('../pages/vehicles/VehicleList.jsx'));
const VehicleForm = lazy(() => import('../pages/vehicles/VehicleForm.jsx'));
const VehicleDetails = lazy(() => import('../pages/vehicles/VehicleDetails.jsx'));

// Drivers
const DriverList = lazy(() => import('../pages/drivers/DriverList.jsx'));
const DriverForm = lazy(() => import('../pages/drivers/DriverForm.jsx'));
const DriverDetails = lazy(() => import('../pages/drivers/DriverDetails.jsx'));

// Trips
const TripList = lazy(() => import('../pages/trips/TripList.jsx'));
const TripForm = lazy(() => import('../pages/trips/TripForm.jsx'));
const TripDetails = lazy(() => import('../pages/trips/TripDetails.jsx'));

// Maintenance
const MaintenanceList = lazy(() => import('../pages/maintenance/MaintenanceList.jsx'));
const MaintenanceForm = lazy(() => import('../pages/maintenance/MaintenanceForm.jsx'));
const MaintenanceDetails = lazy(() => import('../pages/maintenance/MaintenanceDetails.jsx'));

// Fuel
const FuelLogList = lazy(() => import('../pages/fuel/FuelLogList.jsx'));
const FuelLogForm = lazy(() => import('../pages/fuel/FuelLogForm.jsx'));
const FuelLogDetails = lazy(() => import('../pages/fuel/FuelLogDetails.jsx'));

// Expenses
const ExpenseList = lazy(() => import('../pages/expenses/ExpenseList.jsx'));
const ExpenseForm = lazy(() => import('../pages/expenses/ExpenseForm.jsx'));
const ExpenseDetails = lazy(() => import('../pages/expenses/ExpenseDetails.jsx'));

// Reports & Fallback
const Reports = lazy(() => import('../pages/Reports.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));

/**
 * Modern Loading Spinner Fallback for Chunk Loading
 */
const PageLoader = () => (
  <div className="min-h-[50vh] w-full flex flex-col items-center justify-center p-8">
    <div className="relative flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-slate-200 dark:border-slate-800 rounded-full" />
      <div className="w-10 h-10 border-2 border-transparent border-t-slate-900 dark:border-t-white rounded-full animate-spin absolute inset-0" />
    </div>
    <span className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
      Loading module...
    </span>
  </div>
);

/**
 * Higher-order Route wrapper component to restrict pages by roles
 */
const RoleRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/401" state={{ from: location.pathname }} replace />;
  }

  // Redirect to custom 403 Forbidden page if role is unauthorized
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <Navigate 
        to="/403" 
        state={{ 
          attemptedPath: location.pathname,
          requiredRoles: allowedRoles,
          reason: `Access Denied: The requested portal path requires one of the following roles: [${allowedRoles.join(', ')}]. Your current role is '${user.role}'.`
        }} 
        replace 
      />
    );
  }

  return children;
};

/**
 * Global Routing Table for TransitOps with Lazy-Loaded Chunks
 */
export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Security Cooldown / Blocked page */}
        <Route path="/blocked" element={<Blocked />} />

        {/* Auth/Public routes wrapper */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Authenticated Dashboard routes wrapper */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Vehicles */}
          <Route path="/vehicles" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><VehicleList /></RoleRoute>} />
          <Route path="/vehicles/new" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><VehicleForm /></RoleRoute>} />
          <Route path="/vehicles/edit/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><VehicleForm /></RoleRoute>} />
          <Route path="/vehicles/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><VehicleDetails /></RoleRoute>} />
          
          {/* Drivers */}
          <Route path="/drivers" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER']}><DriverList /></RoleRoute>} />
          <Route path="/drivers/new" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><DriverForm /></RoleRoute>} />
          <Route path="/drivers/edit/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><DriverForm /></RoleRoute>} />
          <Route path="/drivers/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER']}><DriverDetails /></RoleRoute>} />
          
          {/* Trips */}
          <Route path="/trips" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><TripList /></RoleRoute>} />
          <Route path="/trips/new" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><TripForm /></RoleRoute>} />
          <Route path="/trips/edit/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><TripForm /></RoleRoute>} />
          <Route path="/trips/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><TripDetails /></RoleRoute>} />
          
          {/* Maintenance */}
          <Route path="/maintenance" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><MaintenanceList /></RoleRoute>} />
          <Route path="/maintenance/new" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><MaintenanceForm /></RoleRoute>} />
          <Route path="/maintenance/edit/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><MaintenanceForm /></RoleRoute>} />
          <Route path="/maintenance/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER']}><MaintenanceDetails /></RoleRoute>} />
          
          {/* Fuel */}
          <Route path="/fuel" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']}><FuelLogList /></RoleRoute>} />
          <Route path="/fuel/new" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']}><FuelLogForm /></RoleRoute>} />
          <Route path="/fuel/edit/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']}><FuelLogForm /></RoleRoute>} />
          <Route path="/fuel/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']}><FuelLogDetails /></RoleRoute>} />
          
          {/* Expenses */}
          <Route path="/expenses" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FINANCIAL_ANALYST']}><ExpenseList /></RoleRoute>} />
          <Route path="/expenses/new" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FINANCIAL_ANALYST', 'FLEET_MANAGER']}><ExpenseForm /></RoleRoute>} />
          <Route path="/expenses/edit/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FINANCIAL_ANALYST', 'FLEET_MANAGER']}><ExpenseForm /></RoleRoute>} />
          <Route path="/expenses/:id" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FINANCIAL_ANALYST', 'FLEET_MANAGER']}><ExpenseDetails /></RoleRoute>} />
          
          {/* Reports */}
          <Route path="/reports" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'FINANCIAL_ANALYST']}><Reports /></RoleRoute>} />
        </Route>

        {/* Standalone Error Routes */}
        <Route path="/401" element={<Unauthorized401 />} />
        <Route path="/403" element={<Forbidden403 />} />
        <Route path="/404" element={<NotFound404 />} />

        {/* Root path redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Unmatched fallback */}
        <Route path="*" element={<NotFound404 />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
