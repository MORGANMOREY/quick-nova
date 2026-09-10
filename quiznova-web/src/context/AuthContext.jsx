import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('quiznova_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem('quiznova_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync token & user to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('quiznova_token', token);
    } else {
      localStorage.removeItem('quiznova_token');
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('quiznova_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('quiznova_user');
    }
  }, [currentUser]);

  // Fetch current user from backend on load
  const loadMe = useCallback(async () => {
    const savedToken = localStorage.getItem('quiznova_token');
    if (!savedToken) {
      setIsLoadingAuth(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      if (data && data.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.warn('Could not sync user profile from server:', err.message);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback((jwtToken, userData) => {
    setToken(jwtToken);
    setCurrentUser(userData);
    setIsLoginModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('quiznova_token');
    localStorage.removeItem('quiznova_user');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedUser,
    }));
  }, []);

  const userRole = currentUser?.role || 'guest';
  const isAdmin = userRole === 'admin' || userRole === 'sub_admin';

  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        userRole,
        isAdmin,
        isLoadingAuth,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        logout,
        updateUser,
        refreshProfile: loadMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
