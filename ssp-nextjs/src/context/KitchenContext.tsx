'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/api';

interface KitchenStatus { open: boolean; message: string; deliveryEnabled: boolean; minimumOrderEnabled: boolean; loaded: boolean; refresh: () => Promise<void> }

const KitchenContext = createContext<KitchenStatus>({ open: true, message: '', deliveryEnabled: false, minimumOrderEnabled: true, loaded: false, refresh: async () => {} });

// Polls /kitchen-status so the admin "Kitchen closed", "Delivery on/off" and "Min £15" toggles show
// site-wide within a minute. Delivery stays off until the server says otherwise.
export const KitchenProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState({ open: true, message: '', deliveryEnabled: false, minimumOrderEnabled: true, loaded: false });

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/kitchen-status');
      setStatus({ open: r.data.open !== false, message: r.data.message || '', deliveryEnabled: r.data.delivery_enabled === true, minimumOrderEnabled: r.data.minimum_order_enabled !== false, loaded: true });
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
