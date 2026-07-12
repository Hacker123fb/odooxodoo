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
  progressColor = 'bg-primary-600',
  cardColor = 'border-slate-200 dark:border-slate-800',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm animate-pulse flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`p-5 bg-white dark:bg-slate-900 border ${cardColor} rounded-2xl shadow-sm hover:shadow-md transition-all duration-205 flex flex-col justify-between relative overflow-hidden group`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 z-10">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
            {title}
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none mt-1">
            {value}
          </span>
        </div>
        {Icon && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 text-slate-650 dark:text-slate-350 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-950/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors shrink-0">
            <Icon className="w-5 h-5" />
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
