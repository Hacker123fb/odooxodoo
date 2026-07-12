import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const TripsPerMonthChart = ({ data = [] }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
        <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 font-sans">
          No data available
        </span>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: 'Trips Completed',
        data: data.map((item) => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.75)', // Elegant Blue
        borderColor: '#3b82f6',
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: '#2563eb'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        padding: 12,
        cornerRadius: 8,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: textColor,
          font: { family: 'Inter', size: 10 }
        }
      },
      y: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColor,
          font: { family: 'Inter', size: 10 },
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="h-64 relative w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default TripsPerMonthChart;
