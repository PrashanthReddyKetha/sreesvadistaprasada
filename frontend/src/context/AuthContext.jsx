import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ssp_token');
    if (!token) { setInitialized(true); return; }
    // Hydrate from cache immediately so UI doesn't flash
    try {
      const stored = localStorage.getItem('ssp_user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    // Then re-validate with server to pick up any role/profile changes
    api.get('/auth/me')
      .then(res => {
        localStorage.setItem('ssp_user', JSON.stringify(res.data));
        setUser(res.data);
      })
      .catch(() => {
        // Token invalid or expired — clear session
        localStorage.removeItem('ssp_token');
        localStorage.removeItem('ssp_user');
        setUser(null);
      })
      .finally(() => setInitialized(true));
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('ssp_token', token);
    localStorage.setItem('ssp_user', JSON.stringify(userData));
    setUser(userData);
    setAuthOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('ssp_token');
    localStorage.removeItem('ssp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authOpen, setAuthOpen, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};
