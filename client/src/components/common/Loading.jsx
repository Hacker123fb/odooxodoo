import React from 'react';

/**
 * Standard spinner loader indicator.
 */
export const Loading = ({ fullScreen = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-[4px]'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-50/40 dark:bg-slate-950/40 backdrop-blur-sm'
    : 'flex items-center justify-center py-8 w-full';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        <div
          className={`animate-spin rounded-full border-slate-200 dark:border-slate-800 border-t-primary-600 ${sizeClasses[size]}`}
        />
        {fullScreen && (
          <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase animate-pulse">
            Loading TransitOps...
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;
