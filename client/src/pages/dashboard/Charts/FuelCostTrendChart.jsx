import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const FuelCostTrendChart = ({ data = [] }) => {
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

  const formatCurrencyValue = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: 'Fuel Cost (INR)',
        data: data.map((item) => item.cost),
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.15)', // Emerald transparent fill
        borderColor: '#10b981', // Emerald Line
        borderWidth: 2,
        tension: 0.35, // Curved line
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#059669'
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
        bodyFont: { family: 'Inter', size: 12 },
        callbacks: {
          label: (context) => {
            return `Cost: ${formatCurrencyValue(context.raw)}`;
          }
        }
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
          callback: (value) => {
            if (value >= 1000) {
              return `₹${(value / 1000).toFixed(0)}k`;
            }
            return `₹${value}`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64 relative w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default FuelCostTrendChart;
