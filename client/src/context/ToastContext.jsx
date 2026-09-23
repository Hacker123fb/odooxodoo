import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => {
      // Keep at most 3 simultaneous toasts to prevent screen clutter
      const trimmed = prev.slice(-2);
      return [...trimmed, { id, message, type }];
    });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none">
        {toasts.map(toast => {
          let styleClass = 'bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 shadow-md';
          let Icon = FiInfo;
          let iconColor = 'text-slate-600 dark:text-slate-400';

          if (toast.type === 'success') {
            styleClass = 'bg-white dark:bg-[#0E1B15] border-emerald-200 dark:border-emerald-900/70 text-slate-900 dark:text-emerald-100 shadow-md';
            Icon = FiCheckCircle;
            iconColor = 'text-emerald-600 dark:text-emerald-400';
          } else if (toast.type === 'error') {
            styleClass = 'bg-white dark:bg-[#1B1114] border-rose-200 dark:border-rose-900/70 text-slate-900 dark:text-rose-100 shadow-md';
            Icon = FiAlertCircle;
            iconColor = 'text-rose-600 dark:text-rose-400';
          } else if (toast.type === 'warning') {
            styleClass = 'bg-white dark:bg-[#1C160B] border-amber-200 dark:border-amber-900/70 text-slate-900 dark:text-amber-100 shadow-md';
            Icon = FiAlertCircle;
            iconColor = 'text-amber-600 dark:text-amber-400';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${styleClass}`}
              style={{
                animation: 'slideIn 0.2s ease-out forwards'
              }}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
