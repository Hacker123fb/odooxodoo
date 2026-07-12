import React from 'react';
import { FiDownload, FiBarChart2, FiTrendingUp, FiLayers, FiDollarSign } from 'react-icons/fi';
import Button from '../components/common/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Analytics and Auditing Reports Page
 */
export const Reports = () => {
  const { showToast } = useToast();

  const handleExport = (reportName) => {
    showToast(`Assembling CSV data for: ${reportName}...`, 'info');
    setTimeout(() => {
      showToast(`${reportName} CSV downloaded successfully.`, 'success');
    }, 1500);
  };

  const reports = [
    { name: 'Fuel Efficiency Report', desc: 'Monitors aggregate fuel consumption, average price spikes, and kilometers per liter.', icon: FiTrendingUp },
    { name: 'Vehicle ROI Report', desc: 'Evaluates truck acquisition costs, ongoing service repair expenses, and trip margins.', icon: FiDollarSign },
    { name: 'Fleet Utilization Report', desc: 'Tracks active dispatch hours, trip load weights, and idle vehicle distributions.', icon: FiLayers },
    { name: 'Operational Cost Report', desc: 'Summarizes driver salaries, highway toll logs, and maintenance bills.', icon: FiBarChart2 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-0.5">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-sans">
          System Analytics
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Analyze fleet-wide operations, audit expenses, and export CSV tables
        </p>
      </div>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.name}
              className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl shrink-0 h-11 w-11 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {report.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {report.desc}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(report.name)}
                  className="flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" /> Export CSV
                </Button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Reports;
