import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { dashboardService } from '../api/apiService.js';

// Import child components
import { DashboardCards } from './dashboard/DashboardCards.jsx';
import { TripsPerMonthChart } from './dashboard/Charts/TripsPerMonthChart.jsx';
import { FuelCostTrendChart } from './dashboard/Charts/FuelCostTrendChart.jsx';
import { ExpenseCategoryChart } from './dashboard/Charts/ExpenseCategoryChart.jsx';
import { StatusDistributionChart } from './dashboard/Charts/StatusDistributionChart.jsx';
import { ActivityTimeline } from './dashboard/ActivityTimeline.jsx';

/**
 * Main Operations Dashboard View
 */
export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch API callback
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    setError(null);

    try {
      const response = await dashboardService.getDashboard();
      if (response && response.success) {
        setData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response?.message || 'Failed to retrieve dashboard information.');
      }
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial Fetch & Auto Refresh setup
  useEffect(() => {
    fetchDashboardData();

    // Refresh every 60 seconds as required
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    fetchDashboardData(true);
  };

  // Skeleton Loader for Chart Cards
  const renderChartSkeleton = () => (
    <div className="h-64 w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Executive Fleet Operations Command Bar */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              Fleet Operations Command
            </h3>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telematics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Real-time fleet monitoring console. Track vehicle allocations, dispatch schedules, operational expenditure, and driver safety compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          {lastUpdated && (
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 select-none">
              Sync: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={handleManualRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-450 uppercase tracking-wide">
              Failed to connect to Operations API
            </h4>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
            <button
              onClick={() => fetchDashboardData()}
              className="text-[10px] font-bold text-rose-700 dark:text-rose-450 underline mt-2 hover:text-rose-900 dark:hover:text-rose-350"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <DashboardCards data={data} loading={loading} />

      {/* Main Charts & Timeline Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Core Charts Section */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Monthly Trips & Fuel Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h4 className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4 font-sans">
                Trips per Month
              </h4>
              {loading ? renderChartSkeleton() : <TripsPerMonthChart data={data?.charts?.tripsPerMonth} />}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h4 className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4 font-sans">
                Fuel Cost Trend
              </h4>
              {loading ? renderChartSkeleton() : <FuelCostTrendChart data={data?.charts?.fuelCostTrend} />}
            </div>
          </div>

          {/* Categorical Status Distributions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h4 className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4 font-sans">
              Status Distributions
            </h4>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderChartSkeleton()}
                {renderChartSkeleton()}
                {renderChartSkeleton()}
              </div>
            ) : (
              <StatusDistributionChart 
                charts={{
                  vehicleStatusDistribution: data?.charts?.vehicleStatusDistribution,
                  tripStatusDistribution: data?.charts?.tripStatusDistribution,
                  maintenanceStatusDistribution: data?.charts?.maintenanceStatusDistribution
                }} 
              />
            )}
          </div>

        </div>

        {/* Expenses & Activity Feed Column */}
        <div className="space-y-6">
          
          {/* Expense Category Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h4 className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4 font-sans">
              Expense Distribution by Category
            </h4>
            {loading ? renderChartSkeleton() : <ExpenseCategoryChart data={data?.charts?.expenseCategoryDistribution} />}
          </div>

          {/* Activity Timeline */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-3">
                    <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-2.5 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ActivityTimeline data={data?.recentActivities} />
          )}

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
