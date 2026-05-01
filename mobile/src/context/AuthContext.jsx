import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  // Warm the Render backend early so it's ready when the user submits
  useEffect(() => {
    api.get('/menu?available=true&limit=1').catch(() => {});
  }, []);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('ssp_token');
      if (token) {
        // Attach token manually for this call in case interceptor races
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setIsGuest(false);
        return;
      }
      const guest = await AsyncStorage.getItem('ssp_guest');
      if (guest === 'true') {
        setIsGuest(true);
      } else {
        setUser(null);
        setIsGuest(false);
      }
    } catch {
      // Token invalid/expired — clear it, drop to auth screen
      await SecureStore.deleteItemAsync('ssp_token');
      setUser(null);
      setIsGuest(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    // Save token BEFORE updating state so interceptor picks it up immediately
    await SecureStore.setItemAsync('ssp_token', access_token);
    await AsyncStorage.removeItem('ssp_guest');
    setIsGuest(false);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register/simple', { name, email, password });
    const { access_token, user: userData } = res.data;
    await SecureStore.setItemAsync('ssp_token', access_token);
    await AsyncStorage.removeItem('ssp_guest');
    setIsGuest(false);
    setUser(userData);
    return userData;
  };

  const continueAsGuest = async () => {
    await AsyncStorage.setItem('ssp_guest', 'true');
    setIsGuest(true);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('ssp_token');
    await AsyncStorage.removeItem('ssp_guest');
    // Clear user AFTER storage ops to prevent race
    setUser(null);
    setIsGuest(false);
  };

  const updateUser = (data) => setUser((prev) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{
      user, isGuest, loading,
      login, register, logout, continueAsGuest, updateUser, loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
