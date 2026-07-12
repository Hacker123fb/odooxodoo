import React from 'react';

/**
 * Reusable Form Layout Wrapper that includes headers and error banners
 */
export const FormWrapper = ({
  title = '',
  subtitle = '',
  onSubmit,
  error = null,
  children,
  className = ''
}) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 w-full ${className}`}>
      {(title || subtitle) && (
        <div className="flex flex-col gap-0.5 mb-2">
          {title && (
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>
    </form>
  );
};

export default FormWrapper;
