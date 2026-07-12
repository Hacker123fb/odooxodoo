import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { Button } from './Button.jsx';

/**
 * Reusable Error display panel to handle unexpected client issues
 */
export const ErrorFallback = ({ error = null, resetErrorBoundary = null }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center max-w-md mx-auto my-12">
      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full mb-4">
        <FiAlertTriangle className="w-10 h-10" />
      </div>
      
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
        Something went wrong
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {error?.message || 'An unexpected rendering error occurred. Please refresh or retry.'}
      </p>
      
      {resetErrorBoundary && (
        <Button variant="primary" onClick={resetErrorBoundary}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorFallback;
