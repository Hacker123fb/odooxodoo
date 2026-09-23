import React from 'react';

/**
 * Reusable KPI StatCard Component
 * 
 * @param {Object} props
 * @param {string} props.title - Metric title
 * @param {string|number} props.value - Primary metric value
 * @param {React.ComponentType} props.icon - Icon component from react-icons
 * @param {string} [props.changeText] - Description or change indicator (e.g. "+10% vs last month")
 * @param {boolean} [props.isPositive] - Style change indicator green/red
 * @param {number} [props.progress] - Percentage for progress bar (0 - 100)
 * @param {string} [props.progressColor] - Tailwind color class for progress bar (e.g. "bg-primary-600")
 * @param {string} [props.cardColor] - Optional border highlight or gradient class
 * @param {boolean} [props.loading] - Whether to show a loading skeleton
 */
export const StatCard = ({
  title,
  value,
  icon: Icon,
  changeText,
  isPositive = true,
  progress,
  progressColor = 'bg-slate-900 dark:bg-white',
  cardColor = 'border-slate-200/90 dark:border-slate-800',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs animate-pulse flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
        <div className="h-5 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-5 bg-white dark:bg-[#111827] border ${cardColor} rounded-xl shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition-all flex flex-col justify-between relative overflow-hidden group`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5 z-10">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans">
            {title}
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none mt-1">
            {value}
          </span>
        </div>
        {Icon && (
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-4 z-10">
          <div className="flex justify-between text-[10px] font-semibold text-slate-450 dark:text-slate-400 mb-1">
            <span>Utilization</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {changeText && (
        <div className="mt-3 text-[10px] font-medium z-10">
          <span className={isPositive ? 'text-emerald-600 dark:text-emerald-500 font-semibold' : 'text-rose-600 dark:text-rose-500 font-semibold'}>
            {changeText}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
