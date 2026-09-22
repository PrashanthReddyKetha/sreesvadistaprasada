import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

const KitchenContext = createContext({ open: true, message: '', refresh: () => {} });

// Polls /kitchen-status so a "kitchen closed" toggle in admin shows site-wide within a minute.
export const KitchenProvider = ({ children }) => {
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
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [refresh]);

  return (
    <KitchenContext.Provider value={{ ...status, refresh }}>
      {children}
    </KitchenContext.Provider>
  );
};

export const useKitchen = () => useContext(KitchenContext);
