'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ssp_user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setInitialized(true);
  }, []);

  const login = (userData: User, token: string) => {
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
