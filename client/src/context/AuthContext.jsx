import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../api/apiService.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authService.getMe();

        if (res?.success && res?.data?.user) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
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

  const login = async (email, password) => {
    setIsLoading(true);

    try {
      const res = await authService.login({ email, password });

      if (res?.success && res?.data) {
        const userToken = res.data.token;
        const userProfile = res.data.user ?? {};

        setToken(userToken);
        setUser(userProfile);

        localStorage.setItem("token", userToken);
        localStorage.setItem("user", JSON.stringify(userProfile));

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
        errors: error.errors
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};