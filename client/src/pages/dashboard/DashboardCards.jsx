import React from 'react';
import { 
  FiTruck, 
  FiUsers, 
  FiNavigation, 
  FiTrendingUp, 
  FiDollarSign, 
  FiDroplet, 
  FiActivity, 
  FiTool, 
  FiAlertTriangle 
} from 'react-icons/fi';
import { StatCard } from './StatCard.jsx';

/**
 * Renders all dashboard KPI stat cards grouped by Category (Fleet, Drivers, Trips, Finances)
 */
export const DashboardCards = ({ data, loading }) => {
  // Graceful fallback for values
  const fleet = data?.fleetSummary || {};
  const trips = data?.tripSummary || {};
  const fuel = data?.fuelSummary || {};
  const expenses = data?.expenseSummary || {};

  // Formatter for currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(val) || 0);
  };

  return (
    <div className="space-y-6">
      {/* Category 1: Fleet & Utilization */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 font-sans">
          Fleet &amp; Utilization
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Vehicles"
            value={fleet.totalVehicles ?? 0}
            icon={FiTruck}
            loading={loading}
          />
          <StatCard
            title="Available Vehicles"
            value={fleet.availableVehicles ?? 0}
            icon={FiTruck}
            changeText="Ready for Dispatch"
            isPositive={true}
            cardColor="border-emerald-250 dark:border-emerald-950/30"
            loading={loading}
          />
          <StatCard
            title="Vehicles On Trip"
            value={fleet.vehiclesOnTrip ?? 0}
            icon={FiNavigation}
            changeText="In Transit"
            isPositive={true}
            cardColor="border-blue-250 dark:border-blue-950/30"
            loading={loading}
          />
          <StatCard
            title="In Maintenance"
            value={fleet.vehiclesInMaintenance ?? 0}
            icon={FiTool}
            changeText="Under Repairs"
            isPositive={false}
            cardColor="border-amber-250 dark:border-amber-950/30"
            loading={loading}
          />
          <StatCard
            title="Fleet Utilization"
            value={`${fleet.fleetUtilizationPercent ?? 0}%`}
            icon={FiActivity}
            progress={fleet.fleetUtilizationPercent ?? 0}
            progressColor="bg-primary-500"
            loading={loading}
          />
        </div>
      </div>

      {/* Category 2: Drivers & Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 font-sans">
            Driver Directory Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Drivers"
              value={fleet.totalDrivers ?? 0}
              icon={FiUsers}
              loading={loading}
            />
            <StatCard
              title="Drivers Available"
              value={fleet.driversAvailable ?? 0}
              icon={FiUsers}
              changeText="On Standby"
              isPositive={true}
              loading={loading}
            />
            <StatCard
              title="Drivers On Trip"
              value={fleet.driversOnTrip ?? 0}
              icon={FiNavigation}
              changeText="Currently Dispatching"
              isPositive={true}
              loading={loading}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 font-sans">
            Trip Progression
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Active Trips"
              value={trips.activeTrips ?? 0}
              icon={FiNavigation}
              changeText="En Route"
              isPositive={true}
              loading={loading}
            />
            <StatCard
              title="Completed Trips"
              value={trips.completedTrips ?? 0}
              icon={FiTrendingUp}
              changeText="Arrived Safely"
              isPositive={true}
              loading={loading}
            />
            <StatCard
              title="Cancelled Trips"
              value={trips.cancelledTrips ?? 0}
              icon={FiAlertTriangle}
              changeText="Disrupted"
              isPositive={false}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Category 3: Financial Summary */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 font-sans">
          Operational Finances
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Fuel Cost"
            value={formatCurrency(fuel.todayFuelCost)}
            icon={FiDroplet}
            loading={loading}
          />
          <StatCard
            title="This Month Fuel Cost"
            value={formatCurrency(fuel.thisMonthFuelCost)}
            icon={FiDroplet}
            loading={loading}
          />
          <StatCard
            title="Today's Expenses"
            value={formatCurrency(expenses.todayExpenses)}
            icon={FiDollarSign}
            loading={loading}
          />
          <StatCard
            title="This Month Expenses"
            value={formatCurrency(expenses.thisMonthExpenses)}
            icon={FiDollarSign}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
