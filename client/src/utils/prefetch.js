/**
 * Intelligent Route Chunk Preloader
 * Dynamically preloads lazy-loaded page modules on mouse hover, focus, or touch start.
 * Ensures zero perceived delay on button clicks and instantaneous page transitions.
 */

const routeLoaders = {
  '/login': () => import('../pages/Login.jsx'),
  '/register': () => import('../pages/auth/Register.jsx'),
  '/verify-otp': () => import('../pages/auth/VerifyOTP.jsx'),
  '/forgot-password': () => import('../pages/auth/ForgotPassword.jsx'),
  '/dashboard': () => import('../pages/Dashboard.jsx'),
  '/vehicles': () => import('../pages/vehicles/VehicleList.jsx'),
  '/drivers': () => import('../pages/drivers/DriverList.jsx'),
  '/trips': () => import('../pages/trips/TripList.jsx'),
  '/maintenance': () => import('../pages/maintenance/MaintenanceList.jsx'),
  '/fuel': () => import('../pages/fuel/FuelLogList.jsx'),
  '/expenses': () => import('../pages/expenses/ExpenseList.jsx'),
  '/reports': () => import('../pages/Reports.jsx'),
  '/blocked': () => import('../pages/Blocked.jsx'),
  '/terms': () => import('../pages/legal/Terms.jsx'),
  '/privacy': () => import('../pages/legal/Privacy.jsx')
};

const preloadedSet = new Set();

/**
 * Prefetches the code chunk for a target route ahead of time.
 * Safe to call multiple times (idempotent).
 * @param {string} routePath
 */
export const prefetchRoute = (routePath) => {
  if (!routePath || typeof routePath !== 'string') return;
  const cleanPath = routePath.split('?')[0].split('#')[0];
  if (preloadedSet.has(cleanPath)) return;

  const loader = routeLoaders[cleanPath];
  if (typeof loader === 'function') {
    preloadedSet.add(cleanPath);
    loader().catch(() => {
      // Allow retry if transient network error occurred
      preloadedSet.delete(cleanPath);
    });
  }
};

/**
 * Helper props to attach to interactive elements (Buttons, Links, NavItems)
 * for instant preloading on hover, touch, or keyboard focus.
 */
export const prefetchOnHover = (routePath) => ({
  onMouseEnter: () => prefetchRoute(routePath),
  onTouchStart: () => prefetchRoute(routePath),
  onFocus: () => prefetchRoute(routePath)
});

export default prefetchRoute;
