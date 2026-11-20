/**
 * Secure Cookie Management Utilities
 * 
 * Enforces security best practices:
 * - SameSite=Strict by default (eliminating CSRF vulnerabilities)
 * - Secure flag (guaranteeing HTTPS transmission in production/secure contexts)
 * - Explicit path scoping
 */

export const cookieHelper = {
  /**
   * Sets a cookie with Secure and SameSite=Strict attributes
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Expiration in days (default: 1 day)
   * @param {object} options - Optional overrides
   */
  set(name, value, days = 1, options = {}) {
    if (typeof document === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    const isSecure = window.location.protocol === 'https:' || process.env.NODE_ENV === 'production';
    const sameSite = options.sameSite || 'Strict';
    const path = options.path || '/';

    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}; SameSite=${sameSite}`;
    if (isSecure || options.secure) {
      cookieStr += '; Secure';
    }

    document.cookie = cookieStr;
  },

  /**
   * Retrieves a cookie value by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null if not found
   */
  get(name) {
    if (typeof document === 'undefined') return null;

    const prefix = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');

    for (let c of cookies) {
      c = c.trim();
      if (c.indexOf(prefix) === 0) {
        return decodeURIComponent(c.substring(prefix.length));
      }
    }
    return null;
  },

  /**
   * Removes a cookie by expiring it
   * @param {string} name - Cookie name
   * @param {object} options - Optional path/domain overrides
   */
  remove(name, options = {}) {
    if (typeof document === 'undefined') return;

    const path = options.path || '/';
    const isSecure = window.location.protocol === 'https:' || process.env.NODE_ENV === 'production';
    let cookieStr = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Strict`;
    if (isSecure) {
      cookieStr += '; Secure';
    }
    document.cookie = cookieStr;
  }
};

export default cookieHelper;
