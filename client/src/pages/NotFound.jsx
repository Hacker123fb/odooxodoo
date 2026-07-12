import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiAlertCircle } from 'react-icons/fi';
import Button from '../components/common/Button.jsx';

/**
 * 404 Not Found Page
 */
export const NotFound = () => {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-md">
        
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl mb-4">
          <FiAlertCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-sans tracking-wide leading-none">
          404
        </h1>
        
        <h2 className="text-base font-bold text-slate-850 dark:text-slate-250 mt-2">
          Page Not Found
        </h2>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xs">
          The requested URL path is missing or has been relocated.
        </p>
        
        <Link to="/dashboard" className="mt-6">
          <Button variant="primary" className="flex items-center gap-2">
            <FiHome className="w-4 h-4" /> Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
