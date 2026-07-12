import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/apiService.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate active JWT session on reload
  useEffect(() => {
    const initializeAuth = async () => {
      const activeToken = localStorage.getItem('token');
      if (activeToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session restoration failed:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Log into the system with credentials
   */
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      
      if (res.success && res.data) {
        const { token: userToken, user: userProfile } = res.data;
        
        setUser(userProfile);
        setToken(userToken);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userProfile));
        
        return { success: true };
      } else {
        return { success: false, error: res.message || 'Login failed.' };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Network exception. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log out of the system and purge session tokens
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
