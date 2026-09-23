import React, { forwardRef } from 'react';

/**
 * Reusable Form Input component, integrated with forwardRef for React Hook Form
 */
export const Input = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder = '',
  error = null,
  className = '',
  icon: Icon = null,
  ...props
}, ref) => {
  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
          {label.endsWith('*') ? (
            <>
              {label.slice(0, -1).trim()} <span className="text-rose-500 font-bold">*</span>
            </>
          ) : (
            label
          )}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          ref={ref}
          placeholder={placeholder}
          className={`w-full py-2 px-3 text-sm bg-white dark:bg-[#0E1422] border rounded-lg outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-300 dark:border-slate-700 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:focus:border-slate-300 dark:focus:ring-slate-300'
          }`}
          {...props}
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-500 mt-0.5">
          {error.message || error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
