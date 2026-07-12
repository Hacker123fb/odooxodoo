import React, { useState } from 'react';
import { 
  FiNavigation, 
  FiDroplet, 
  FiTool, 
  FiDollarSign, 
  FiClock, 
  FiMapPin 
} from 'react-icons/fi';

export const ActivityTimeline = ({ data = {} }) => {
  const [activeTab, setActiveTab] = useState('ALL');

  const rawTrips = data.trips || [];
  const rawFuel = data.fuelLogs || [];
  const rawMaintenance = data.maintenanceRecords || [];
  const rawExpenses = data.expenses || [];

  // Standardize entries to a single format
  const formattedTrips = rawTrips.map((item) => ({
    id: `trip-${item.id}`,
    type: 'TRIP',
    title: `Trip ${item.tripNumber}`,
    description: `Dispatched from ${item.sourceLocation} to ${item.destinationLocation}`,
    meta: `Vehicle: ${item.vehiclePlate} | Driver: ${item.driverName}`,
    badge: item.status,
    badgeType: item.statusCode === 'COMPLETED' ? 'success' : item.statusCode === 'CANCELLED' ? 'danger' : 'info',
    date: item.createdAt ? new Date(item.createdAt) : new Date(item.scheduledDeparture),
    displayDate: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Scheduled'
  }));

  const formattedFuel = rawFuel.map((item) => ({
    id: `fuel-${item.id}`,
    type: 'FUEL',
    title: `Fuel Refill Logged`,
    description: `${item.quantity}L of ${item.fuelType || 'Fuel'} refilled for vehicle ${item.vehiclePlate}`,
    meta: `Cost: ₹${item.totalCost.toLocaleString()}`,
    badge: 'Fuel Log',
    badgeType: 'warning',
    date: item.createdAt ? new Date(item.createdAt) : new Date(item.fuelingDate),
    displayDate: item.createdAt ? new Date(item.createdAt).toLocaleString() : new Date(item.fuelingDate).toLocaleString()
  }));

  const formattedMaintenance = rawMaintenance.map((item) => ({
    id: `maint-${item.id}`,
    type: 'MAINTENANCE',
    title: `Maintenance Request`,
    description: `${item.maintenanceType || 'Inspection/Routine'} logged for vehicle ${item.vehiclePlate}`,
    meta: `Cost: ₹${item.cost.toLocaleString()}`,
    badge: item.status,
    badgeType: item.statusCode === 'COMPLETED' ? 'success' : item.statusCode === 'CANCELLED' ? 'danger' : 'warning',
    date: item.createdAt ? new Date(item.createdAt) : new Date(item.startDate),
    displayDate: item.createdAt ? new Date(item.createdAt).toLocaleString() : new Date(item.startDate).toLocaleDateString()
  }));

  const formattedExpenses = rawExpenses.map((item) => ({
    id: `expense-${item.id}`,
    type: 'EXPENSE',
    title: `Expense Logged`,
    description: `${item.category}: ${item.description}`,
    meta: `Amount: ₹${item.amount.toLocaleString()} | Voucher: ${item.expenseNumber}`,
    badge: 'Expense',
    badgeType: 'expense',
    date: item.createdAt ? new Date(item.createdAt) : new Date(item.expenseDate),
    displayDate: item.createdAt ? new Date(item.createdAt).toLocaleString() : new Date(item.expenseDate).toLocaleDateString()
  }));

  // Combine and sort by date descending
  const allActivities = [
    ...formattedTrips,
    ...formattedFuel,
    ...formattedMaintenance,
    ...formattedExpenses
  ].sort((a, b) => b.date - a.date);

  // Filter based on active tab
  const filteredActivities = allActivities.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.type === activeTab;
  }).slice(0, 10); // Limit to top 10 as requested

  // Tab configurations
  const tabs = [
    { code: 'ALL', label: 'All Operations' },
    { code: 'TRIP', label: 'Trips' },
    { code: 'FUEL', label: 'Fuel Logs' },
    { code: 'MAINTENANCE', label: 'Maintenance' },
    { code: 'EXPENSE', label: 'Expenses' }
  ];

  // Helper to render icon based on type
  const getIcon = (type) => {
    switch (type) {
      case 'TRIP':
        return <FiNavigation className="w-4 h-4 text-blue-500" />;
      case 'FUEL':
        return <FiDroplet className="w-4 h-4 text-emerald-500" />;
      case 'MAINTENANCE':
        return <FiTool className="w-4 h-4 text-amber-500" />;
      case 'EXPENSE':
        return <FiDollarSign className="w-4 h-4 text-rose-500" />;
      default:
        return <FiClock className="w-4 h-4 text-slate-400" />;
    }
  };

  // Helper for badge color styling classes
  const getBadgeStyle = (badgeType) => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'danger':
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30';
      case 'expense':
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-105';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-850 gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
            Operations Timeline
          </h4>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
            Real-time feed of the latest updates across components (Limit 10)
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.code}
              onClick={() => setActiveTab(tab.code)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans transition-all duration-150 ${
                activeTab === tab.code
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <FiClock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-sans">
            No recent activity logged in this category
          </p>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6 ml-2 py-1">
          {filteredActivities.map((activity, idx) => (
            <div key={activity.id} className="relative group">
              {/* Timeline dot & icon */}
              <div className="absolute -left-[35px] top-0.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 group-hover:border-primary-500 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm">
                {getIcon(activity.type)}
              </div>

              {/* Activity details card */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/60 rounded-2xl hover:border-slate-200 dark:hover:border-slate-800 hover:bg-white dark:hover:bg-slate-900/80 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-250">
                        {activity.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getBadgeStyle(activity.badgeType)}`}>
                        {activity.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {activity.description}
                    </p>
                    {activity.meta && (
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-1 select-none">
                        {activity.meta}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-550 shrink-0 font-medium mt-0.5 flex items-center gap-1 select-none">
                    <FiClock className="w-3 h-3" />
                    {activity.displayDate}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
