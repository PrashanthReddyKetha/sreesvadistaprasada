'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/api';

interface PrepRules { quick: number; long: number; big: number; big_from: number }
interface KitchenStatus { open: boolean; message: string; deliveryEnabled: boolean; minimumOrderEnabled: boolean; dabbaOpen: boolean; prep: PrepRules; loaded: boolean; refresh: () => Promise<void> }
const DEFAULT_PREP: PrepRules = { quick: 30, long: 60, big: 40, big_from: 6 };

const KitchenContext = createContext<KitchenStatus>({ open: true, message: '', deliveryEnabled: false, minimumOrderEnabled: true, dabbaOpen: false, prep: DEFAULT_PREP, loaded: false, refresh: async () => {} });

// Polls /kitchen-status so the admin "Kitchen closed", "Delivery on/off" and "Min £15" toggles show
// site-wide within a minute. Delivery and Dabba Wala sign-ups stay off until the server says otherwise.
export const KitchenProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState({ open: true, message: '', deliveryEnabled: false, minimumOrderEnabled: true, dabbaOpen: false, prep: DEFAULT_PREP, loaded: false });

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/kitchen-status');
      setStatus({ open: r.data.open !== false, message: r.data.message || '', deliveryEnabled: r.data.delivery_enabled === true, minimumOrderEnabled: r.data.minimum_order_enabled !== false, dabbaOpen: r.data.dabba_open === true, prep: { ...DEFAULT_PREP, ...(r.data.prep || {}) }, loaded: true });
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
