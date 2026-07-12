import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import ProtectedLayout from '../components/ProtectedLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Import Page component stubs
import Login from '../pages/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import VehicleList from '../pages/vehicles/VehicleList.jsx';
import VehicleForm from '../pages/vehicles/VehicleForm.jsx';
import VehicleDetails from '../pages/vehicles/VehicleDetails.jsx';
import DriverList from '../pages/drivers/DriverList.jsx';
import DriverForm from '../pages/drivers/DriverForm.jsx';
import DriverDetails from '../pages/drivers/DriverDetails.jsx';
import TripList from '../pages/trips/TripList.jsx';
import TripForm from '../pages/trips/TripForm.jsx';
import TripDetails from '../pages/trips/TripDetails.jsx';
import MaintenanceList from '../pages/maintenance/MaintenanceList.jsx';
import MaintenanceForm from '../pages/maintenance/MaintenanceForm.jsx';
import MaintenanceDetails from '../pages/maintenance/MaintenanceDetails.jsx';
import FuelLogList from '../pages/fuel/FuelLogList.jsx';
import FuelLogForm from '../pages/fuel/FuelLogForm.jsx';
import FuelLogDetails from '../pages/fuel/FuelLogDetails.jsx';
import ExpenseList from '../pages/expenses/ExpenseList.jsx';
import ExpenseForm from '../pages/expenses/ExpenseForm.jsx';
import ExpenseDetails from '../pages/expenses/ExpenseDetails.jsx';
import Reports from '../pages/Reports.jsx';
import NotFound from '../pages/NotFound.jsx';

/**
 * Higher-order Route wrapper component to restrict pages by roles
 */
const RoleRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if role is unauthorized
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Global Routing Table for TransitOps
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth/Public routes wrapper */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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

      {/* Root path redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Unmatched fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
