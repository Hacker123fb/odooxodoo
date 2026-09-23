import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FiMenu, 
  FiSun, 
  FiMoon, 
  FiBell, 
  FiTool, 
  FiAlertTriangle, 
  FiFileText, 
  FiNavigation, 
  FiDroplet, 
  FiDollarSign, 
  FiCheck 
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationService } from '../api/apiService.js';

/**
 * Global Top Navbar with Live Notifications Dropdown
 */
export const Navbar = ({ toggleSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation(); // Avoid closing dropdown
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
        );
      }
    } catch (err) {
      console.error('Mark read failed:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      }
    } catch (err) {
      console.error('Mark all read failed:', err.message);
    }
  };

  // Helper to render type icons
  const getAlertIcon = (type) => {
    switch (type) {
      case 'MAINTENANCE_DUE':
        return <FiTool className="w-4 h-4 text-amber-500" />;
      case 'LICENSE_EXPIRY':
        return <FiAlertTriangle className="w-4 h-4 text-red-500" />;
      case 'DOC_EXPIRY':
        return <FiFileText className="w-4 h-4 text-rose-500" />;
      case 'UPCOMING_TRIP':
        return <FiNavigation className="w-4 h-4 text-blue-500" />;
      case 'LOW_FUEL_EFFICIENCY':
        return <FiDroplet className="w-4 h-4 text-orange-500" />;
      case 'HIGH_MAINTENANCE_COST':
        return <FiDollarSign className="w-4 h-4 text-purple-500" />;
      default:
        return <FiBell className="w-4 h-4 text-slate-450" />;
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
      
      {/* Left items: Mobile Menu trigger & Active route title */}
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

      {/* Right items: Actions & User Details */}
      <div className="flex items-center gap-3 relative">
        {/* Toggle Theme (Sun / Moon) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown Wrapper */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <FiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] font-extrabold bg-rose-600 text-white rounded-full leading-none min-w-[16px] text-center border-2 border-white dark:border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Click Away overlay when dropdown is open */}
          {isOpen && (
            <div 
              className="fixed inset-0 z-40 cursor-default" 
              onClick={() => setIsOpen(false)} 
            />
          )}

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden py-1 max-h-[420px] flex flex-col">
              
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 tracking-wider uppercase">
                  Alerts &amp; Reminders
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:underline font-sans cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Scrollable Alerts feed */}
              <div className="overflow-y-auto flex-1 divide-y divide-slate-50 dark:divide-slate-850">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
                    <FiBell className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-700" />
                    <p className="font-bold">All clear!</p>
                    <p className="text-[10px] text-slate-400">No operational alerts found.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 text-left transition-colors flex gap-3 items-start ${
                        notif.is_read === 0 
                          ? 'bg-slate-50/50 dark:bg-slate-850/30' 
                          : 'hover:bg-slate-50/30 dark:hover:bg-slate-850/10'
                      }`}
                    >
                      <div className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm shrink-0">
                        {getAlertIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <p className={`text-[11px] font-bold truncate ${notif.is_read === 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-450'}`}>
                            {notif.title}
                          </p>
                          {notif.is_read === 0 && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="text-slate-400 hover:text-primary-600 p-0.5 rounded transition-colors shrink-0"
                              title="Mark read"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5 break-words">
                          {notif.message}
                        </p>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 block select-none">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar info card */}
        {user && (
          <div className="hidden md:flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4 h-8 select-none">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-250 leading-none mb-0.5">
                {user.name === 'Default Super Admin' ? 'Admin' : user.name}
              </p>
              <p className="text-[10px] text-slate-450 font-medium leading-none">
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
