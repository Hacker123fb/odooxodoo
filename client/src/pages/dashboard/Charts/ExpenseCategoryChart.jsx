import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORY_COLORS = {
  FUEL: '#f59e0b',        // Amber
  MAINTENANCE: '#d97706', // Brownish Amber
  TOLL: '#64748b',        // Slate
  INSURANCE: '#06b6d4',    // Cyan
  REGISTRATION: '#8b5cf6', // Violet
  SALARY: '#10b981',      // Emerald
  PENALTY: '#ef4444',     // Red
  OTHER: '#6366f1'        // Indigo
};

export const ExpenseCategoryChart = ({ data = [] }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#475569';

  // Filter out zero amount categories
  const activeData = data.filter((item) => item.amount > 0);

  if (!activeData || activeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
        <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 font-sans">
          No data available
        </span>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const chartData = {
    labels: activeData.map((item) => item.category),
    datasets: [
      {
        data: activeData.map((item) => item.amount),
        backgroundColor: activeData.map((item) => CATEGORY_COLORS[item.categoryCode] || '#94a3b8'),
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#0f172a' : '#ffffff',
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: textColor,
          font: { family: 'Inter', size: 10, weight: 'medium' },
          padding: 12,
          boxWidth: 12
        }
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
            const val = context.raw;
            const sum = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((val / sum) * 100).toFixed(1);
            return ` ${context.label}: ${formatCurrency(val)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64 relative w-full flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default ExpenseCategoryChart;
