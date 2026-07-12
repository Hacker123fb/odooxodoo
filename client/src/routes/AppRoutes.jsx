import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import ProtectedLayout from '../components/ProtectedLayout.jsx';

// Import Page component stubs
import Login from '../pages/Login.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Vehicles from '../pages/Vehicles.jsx';
import Drivers from '../pages/Drivers.jsx';
import Trips from '../pages/Trips.jsx';
import Maintenance from '../pages/Maintenance.jsx';
import Fuel from '../pages/Fuel.jsx';
import Expenses from '../pages/Expenses.jsx';
import Reports from '../pages/Reports.jsx';
import NotFound from '../pages/NotFound.jsx';

/**
 * Global Routing Table for TransitOps
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth/Public routes wrapper */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Authenticated Dashboard routes wrapper */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/fuel" element={<Fuel />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      {/* Root path automatic redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Unmatched routes catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
