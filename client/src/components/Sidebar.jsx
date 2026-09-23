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
 * Responsive Sidebar Navigation with RBAC filtering
 */
export const Sidebar = ({
  isOpen,
  toggleSidebar,
  isCollapsed,
  toggleCollapse
}) => {
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

  // Hide unauthorized menu items based on roles
  const getFilteredMenuItems = () => {
    const role = user?.role;
    if (role === 'SUPER_ADMIN') {
      return menuItems;
    }
    if (role === 'FLEET_MANAGER') {
      return menuItems.filter(item => ['Dashboard', 'Vehicles', 'Drivers', 'Maintenance'].includes(item.name));
    }
    if (role === 'DISPATCHER') {
      return menuItems.filter(item => ['Dashboard', 'Trips'].includes(item.name));
    }
    if (role === 'SAFETY_OFFICER') {
      return menuItems.filter(item => ['Dashboard', 'Drivers'].includes(item.name));
    }
    if (role === 'FINANCIAL_ANALYST') {
      return menuItems.filter(item => ['Dashboard', 'Fuel Logs', 'Expenses', 'Reports'].includes(item.name));
    }
    // Default fallback
    return [{ name: 'Dashboard', path: '/dashboard', icon: FiGrid }];
  };

  const filteredMenuItems = getFilteredMenuItems();
  
  // Format User name - replace "Default Super Admin" with "Admin"
  const rawName = user?.name || user?.full_name || user?.username || 'User';
  const displayName = rawName === 'Default Super Admin' ? 'Admin' : rawName;
  const displayRole = user?.role || user?.role_name || 'No Role';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center font-black text-white dark:text-slate-950 text-xs tracking-wider shadow-xs">
            TO
          </div>

          {!isCollapsed && (
            <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight font-sans">
              Transit<span className="text-slate-500 dark:text-slate-400">Ops</span>
            </span>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? (
            <FiChevronRight className="w-5 h-5" />
          ) : (
            <FiChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />

              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center font-bold text-white text-xs border border-slate-700">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-none mb-1">
                {displayName}
              </p>

              <p className="text-[10px] text-slate-400 truncate leading-none">
                {displayRole}
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