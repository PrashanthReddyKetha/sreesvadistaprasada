'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/api';

interface KitchenStatus { open: boolean; message: string; refresh: () => Promise<void> }

const KitchenContext = createContext<KitchenStatus>({ open: true, message: '', refresh: async () => {} });

// Polls /kitchen-status so the admin "Kitchen closed" toggle shows site-wide within a minute.
export const KitchenProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState({ open: true, message: '' });

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/kitchen-status');
      setStatus({ open: r.data.open !== false, message: r.data.message || '' });
    } catch { /* keep last known state — never block the site on a failed poll */ }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000);
    const onFocus = () => { refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [refresh]);

  return <KitchenContext.Provider value={{ ...status, refresh }}>{children}</KitchenContext.Provider>;
};

export const useKitchen = () => useContext(KitchenContext);
