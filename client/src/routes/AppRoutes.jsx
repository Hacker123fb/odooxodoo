import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import ProtectedLayout from '../components/ProtectedLayout.jsx';

// Import Page component stubs
import Login from '../pages/Login.jsx';
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
        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/vehicles/new" element={<VehicleForm />} />
        <Route path="/vehicles/edit/:id" element={<VehicleForm />} />
        <Route path="/vehicles/:id" element={<VehicleDetails />} />
        <Route path="/drivers" element={<DriverList />} />
        <Route path="/drivers/new" element={<DriverForm />} />
        <Route path="/drivers/edit/:id" element={<DriverForm />} />
        <Route path="/drivers/:id" element={<DriverDetails />} />
        <Route path="/trips" element={<TripList />} />
        <Route path="/trips/new" element={<TripForm />} />
        <Route path="/trips/edit/:id" element={<TripForm />} />
        <Route path="/trips/:id" element={<TripDetails />} />
        <Route path="/maintenance" element={<MaintenanceList />} />
        <Route path="/maintenance/new" element={<MaintenanceForm />} />
        <Route path="/maintenance/edit/:id" element={<MaintenanceForm />} />
        <Route path="/maintenance/:id" element={<MaintenanceDetails />} />
        <Route path="/fuel" element={<FuelLogList />} />
        <Route path="/fuel/new" element={<FuelLogForm />} />
        <Route path="/fuel/edit/:id" element={<FuelLogForm />} />
        <Route path="/fuel/:id" element={<FuelLogDetails />} />
        <Route path="/expenses" element={<ExpenseList />} />
        <Route path="/expenses/new" element={<ExpenseForm />} />
        <Route path="/expenses/edit/:id" element={<ExpenseForm />} />
        <Route path="/expenses/:id" element={<ExpenseDetails />} />
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
