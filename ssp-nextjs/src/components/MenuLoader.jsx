import React, { useState, useEffect } from 'react';

/**
 * Shows a spinner for the first 5 s, then adds a "waking up server" message
 * (Render free tier takes ~30 s after inactivity).
 */
const MenuLoader = ({ color = '#800020' }) => {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: `${color}30`, borderTopColor: color }} />
      {slow ? (
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color }}>Just a moment…</p>
          <p className="text-xs text-gray-400 mt-1">The kitchen is waking up — ready in ~30 seconds</p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Loading menu…</p>
      )}
    </div>
  );
};

export default MenuLoader;
