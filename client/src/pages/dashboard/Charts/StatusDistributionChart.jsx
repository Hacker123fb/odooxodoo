import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Status color mapping helper
const getStatusColors = (label) => {
  const normalized = String(label).toLowerCase();
  if (normalized.includes('avail') || normalized.includes('complete')) return '#10b981'; // Emerald
  if (normalized.includes('trip') || normalized.includes('progress')) return '#3b82f6';   // Blue
  if (normalized.includes('maintenance') || normalized.includes('shop') || normalized.includes('delay')) return '#f59e0b'; // Amber
  if (normalized.includes('cancel') || normalized.includes('retir') || normalized.includes('suspend')) return '#ef4444'; // Red
  if (normalized.includes('sched')) return '#6366f1'; // Indigo
  return '#64748b'; // Slate
};

const SingleDoughnut = ({ title, data = [], emptyText = 'No data' }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#475569';

  const validData = data.filter(item => item.count > 0);

  if (validData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/30 p-4">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-sans">{title}</span>
        <span className="text-xs text-slate-400 font-medium font-sans">{emptyText}</span>
      </div>
    );
  }

  const chartData = {
    labels: validData.map(item => item.status),
    datasets: [
      {
        data: validData.map(item => item.count),
        backgroundColor: validData.map(item => getStatusColors(item.status)),
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#0f172a' : '#ffffff',
        hoverOffset: 3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          font: { family: 'Inter', size: 9, weight: 'medium' },
          padding: 8,
          boxWidth: 8
        }
      },
      tooltip: {
        padding: 8,
        cornerRadius: 6,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 11, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 11 }
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/50 rounded-2xl">
      <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4 font-sans text-center">
        {title}
      </span>
      <div className="h-40 w-full relative">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export const StatusDistributionChart = ({ charts = {} }) => {
  const vehicleData = charts.vehicleStatusDistribution || [];
  const tripData = charts.tripStatusDistribution || [];
  const maintenanceData = charts.maintenanceStatusDistribution || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      <SingleDoughnut 
        title="Vehicles Status" 
        data={vehicleData} 
        emptyText="No vehicles status distribution" 
      />
      <SingleDoughnut 
        title="Trips Status" 
        data={tripData} 
        emptyText="No trips status distribution" 
      />
      <SingleDoughnut 
        title="Maintenance Status" 
        data={maintenanceData} 
        emptyText="No maintenance status distribution" 
      />
    </div>
  );
};

export default StatusDistributionChart;
