import React from 'react';
import { FiTruck, FiUsers, FiNavigation, FiTool, FiActivity } from 'react-icons/fi';

/**
 * Logistics Operations Dashboard Page
 */
export const Dashboard = () => {
  const stats = [
    { name: 'Active Vehicles', value: '42 / 50', icon: FiTruck, change: '+2 added today' },
    { name: 'Active Drivers', value: '38 / 45', icon: FiUsers, change: '3 on duty break' },
    { name: 'Trips Dispatched', value: '18', icon: FiNavigation, change: '+5 completed today' },
    { name: 'Active Maintenance', value: '4', icon: FiTool, change: '-1 resolved' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-850 to-primary-600 rounded-2xl p-6 text-white shadow-md">
        <h3 className="text-lg font-bold font-sans">Welcome back, Dispatcher!</h3>
        <p className="text-xs text-primary-200 mt-1 max-w-md">
          The fleet operations status is currently normal. System load remains low. All scheduled morning trips have been successfully dispatched.
        </p>
      </div>

      {/* Stats row grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                  {stat.name}
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                  {stat.value}
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                  {stat.change}
                </span>
              </div>
              <div className="p-3 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed mock status row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System activity logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
              Operations Log Feed
            </h4>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450">
              <FiActivity className="w-3 h-3 animate-pulse" /> Running
            </span>
          </div>

          <div className="space-y-3">
            {[
              { time: '11:15 AM', log: 'Trip #TX-489 marked completed. Vehicle #VEH-102 availability restored.', type: 'success' },
              { time: '10:42 AM', log: 'Driver Jack Sparrow submitted fuel receipt of $345.50.', type: 'info' },
              { time: '09:20 AM', log: 'Scheduled maintenance service logged for Vehicle #VEH-054.', type: 'warn' },
              { time: '08:05 AM', log: 'Morning logs audit completed. 0 critical integrity exceptions found.', type: 'info' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
              >
                <span className="text-slate-400 font-semibold select-none shrink-0">{item.time}</span>
                <span className="text-slate-650 dark:text-slate-350">{item.log}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions widgets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              Fleet Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Register Rigs', desc: 'Add new vehicle' },
                { label: 'Add Driver', desc: 'License upload' },
                { label: 'Dispatch Trip', desc: 'Create active schedule' },
                { label: 'Log Expense', desc: 'Upload receipt stub' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  className="p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
