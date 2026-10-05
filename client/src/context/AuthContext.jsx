import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { authService, clearApiCache } from "../api/apiService.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Session storage ensures authentication is strictly tied to the active browser session.
  // When the browser is closed, sessionStorage is destroyed by the browser, preventing direct entry to dashboard.
  // LocalStorage is never used for sensitive tokens or credentials to eliminate XSS data harvesting.
  const [user, setUser] = useState(() => {
    try {
      // Purge any legacy sensitive data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      const storedUser = sessionStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem("token") || null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    const hasToken = !!sessionStorage.getItem("token");
    const hasCachedUser = !!sessionStorage.getItem("user");
    // If no token or if user profile is already cached in session, render immediately without blocking spinner
    if (!hasToken || hasCachedUser) return false;
    return true;
  });

  useEffect(() => {
    const initializeAuth = async () => {
      // Ensure localStorage has no leaked sensitive tokens
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {}

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authService.getMe();

        if (res?.success && res?.data?.user) {
          setUser(res.data.user);
          sessionStorage.setItem("user", JSON.stringify(res.data.user));
        }
      } catch (error) {
        console.warn("Session validation failed:", error.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);

    // Wipe session and local storage
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear client-side API response cache on logout
    clearApiCache();

    // Redirect cleanly to login, replacing browser history entry so back button doesn't loop
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);

    try {
      const res = await authService.login({ email, password });

      if (res?.success && res?.data) {
        const userToken = res.data.token;
        const userProfile = res.data.user ?? {};

        setToken(userToken);
        setUser(userProfile);

        // Save exclusively in sessionStorage (destroyed on browser close)
        sessionStorage.setItem("token", userToken);
        sessionStorage.setItem("user", JSON.stringify(userProfile));

        // Purge localStorage to prevent sensitive credential leakage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return {
          success: true,
        };
      }

      return {
        success: false,
        error: res?.message || "Login failed.",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Network error.",
        errors: error.errors,
        status: error.status,
        code: error.code,
        blocked: error.blocked,
        remainingMinutes: error.data?.remainingMinutes,
        remainingSeconds: error.data?.remainingSeconds,
        blockedUntil: error.data?.blockedUntil
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue = React.useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  }), [user, token, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};