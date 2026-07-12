import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiMenu, FiSun, FiMoon, FiBell } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Global Top Navbar
 */
export const Navbar = ({ toggleSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Resolve current active page title based on path
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    
    // Format (e.g. "fuel-logs" -> "Fuel Logs")
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
      
      {/* Left items: Mobile Menu trigger & Active route heading */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <FiMenu className="w-5.5 h-5.5" />
        </button>
        
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide font-sans uppercase">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right items: Actions & User Avatar card */}
      <div className="flex items-center gap-3">
        {/* Toggle Theme (Sun / Moon) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>

        {/* Notifications Icon with Badge */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          title="Notifications"
        >
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-600 rounded-full" />
        </button>

        {/* User Card */}
        {user && (
          <div className="hidden md:flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4 h-8">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-250 leading-none mb-0.5">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
