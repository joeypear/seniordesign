import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getCurrentUser, logout as localLogout } from '@/lib/localAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Read the persisted session from localStorage on mount
  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  }, []);

  // Called by Login.jsx after a successful login/register so the context updates immediately
  const refreshUser = useCallback(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
      setIsAuthenticated(true);
    }
  }, []);

  const logout = useCallback(() => {
    localLogout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      logout,
      refreshUser,
    }}>
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
