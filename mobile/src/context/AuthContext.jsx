import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wake the Render backend early so it's ready by the time the user submits
    api.get('/menu?available=true&limit=1').catch(() => {});
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('ssp_token');
      if (token) {
        const res = await api.get('/auth/me');
        setUser(res.data);
        setIsGuest(false);
        return;
      }
      const guest = await AsyncStorage.getItem('ssp_guest');
      if (guest === 'true') setIsGuest(true);
    } catch {
      await SecureStore.deleteItemAsync('ssp_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('ssp_token', res.data.access_token);
    await AsyncStorage.removeItem('ssp_guest');
    setUser(res.data.user);
    setIsGuest(false);
    return res.data.user;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register/simple', { name, email, password });
    await SecureStore.setItemAsync('ssp_token', res.data.access_token);
    await AsyncStorage.removeItem('ssp_guest');
    setUser(res.data.user);
    setIsGuest(false);
    return res.data.user;
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    AsyncStorage.setItem('ssp_guest', 'true').catch(() => {});
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('ssp_token');
    await AsyncStorage.removeItem('ssp_guest');
    setUser(null);
    setIsGuest(false);
  };

  const updateUser = (data) => setUser((prev) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{
      user, isGuest, loading,
      login, register, continueAsGuest, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
