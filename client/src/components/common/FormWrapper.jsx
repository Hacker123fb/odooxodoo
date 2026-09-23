import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

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
        <div className="flex items-start gap-2.5 p-3.5 text-xs font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 rounded-lg">
          <FiAlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>
    </form>
  );
};

export default FormWrapper;
