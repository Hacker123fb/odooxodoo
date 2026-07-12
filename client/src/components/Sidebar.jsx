import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiTruck,
  FiUsers,
  FiNavigation,
  FiTool,
  FiDroplet,
  FiDollarSign,
  FiBarChart2,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Responsive Sidebar Navigation
 */
export const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
    { name: 'Vehicles', path: '/vehicles', icon: FiTruck },
    { name: 'Drivers', path: '/drivers', icon: FiUsers },
    { name: 'Trips', path: '/trips', icon: FiNavigation },
    { name: 'Maintenance', path: '/maintenance', icon: FiTool },
    { name: 'Fuel Logs', path: '/fuel', icon: FiDroplet },
    { name: 'Expenses', path: '/expenses', icon: FiDollarSign },
    { name: 'Reports', path: '/reports', icon: FiBarChart2 }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-primary-650 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-primary-500/10">
            TO
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-wide font-sans">
              Transit<span className="text-primary-600">Ops</span>
            </span>
          )}
        </div>

        {/* Collapsing toggle button for desktop */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                // Auto close on mobile click
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-155 nav-transition
                ${isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/15'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile Footer and Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center font-bold text-primary-600 text-sm border border-primary-200 dark:border-primary-900/50">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-none mb-1">
                {user.name}
              </p>
              <p className="text-xs text-slate-400 truncate leading-none">
                {user.role}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
        >
          <FiLogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
