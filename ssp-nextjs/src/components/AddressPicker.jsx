'use client';
import { useState, useEffect, useCallback } from 'react';
import { Check, Plus, Star } from 'lucide-react';
import api from '@/api';

/**
 * Saved-address selector for signed-in users.
 * Renders address cards (default preselected) + an "add new" option; the
 * host page keeps its own form fields for new addresses and calls
 * saveAddress() after a successful order/subscription.
 *
 * Props:
 *   onFill(addr)         — called with the chosen address (also on mount for the default)
 *   onModeChange(mode)   — 'saved' | 'new'; host shows its blank form when 'new'
 *   compact              — tighter cards for the checkout column
 *
 * If the user has no saved addresses, this renders nothing and reports
 * mode 'new' — the host page behaves exactly as before.
 */

export async function fetchAddresses() {
  try {
    const r = await api.get('/auth/addresses');
    return r.data || [];
  } catch { return []; }
}

export async function saveAddress(fields, makeDefault = false) {
  // fields: { name, phone, line1, line2, city, postcode, label? }
  try {
    await api.post('/auth/addresses', {
      label: fields.label || 'Home',
      name: fields.name || undefined,
      phone: fields.phone || undefined,
      line1: fields.line1,
      line2: fields.line2 || undefined,
      city: fields.city,
      postcode: fields.postcode,
      make_default: makeDefault,
    });
    return true;
  } catch { return false; } // never block an order on address-book bookkeeping
}

export default function AddressPicker({ onFill, onModeChange, compact = false }) {
  const [addresses, setAddresses] = useState(null); // null = loading
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('saved');

  useEffect(() => {
    let alive = true;
    fetchAddresses().then(list => {
      if (!alive) return;
      setAddresses(list);
      if (list.length === 0) {
        setMode('new');
        onModeChange?.('new');
        return;
      }
      const def = list.find(a => a.is_default) || list[0];
      setSelectedId(def.id);
      onFill?.(def);
      onModeChange?.('saved');
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = useCallback((addr) => {
    setSelectedId(addr.id);
    setMode('saved');
    onModeChange?.('saved');
    onFill?.(addr);
  }, [onFill, onModeChange]);

  const startNew = () => {
    setSelectedId(null);
    setMode('new');
    onModeChange?.('new');
  };

  if (addresses === null || addresses.length === 0) return null;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
      {addresses.map(a => {
        const sel = mode === 'saved' && selectedId === a.id;
        return (
          <button key={a.id} type="button" onClick={() => pick(a)}
            className="w-full flex items-start gap-3 text-left rounded-xl transition-all"
            style={{
              padding: compact ? '10px 12px' : '14px 16px',
              backgroundColor: sel ? '#FBF3DC' : '#fff',
              border: sel ? '2px solid #800020' : '1px solid #E8DFCE',
            }}>
            <span className="w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
              style={{ backgroundColor: sel ? '#800020' : 'transparent', border: sel ? 'none' : '1.5px solid #d1d5db' }}>
              {sel && <Check size={10} color="white" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: '#2D2422' }}>{a.label}</span>
                {a.is_default && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: '#FBF3DC', color: '#8B6914', border: '1px solid #EBD9A8' }}>
                    <Star size={8} fill="currentColor" /> Default
                  </span>
                )}
              </span>
              <span className="block text-xs truncate" style={{ color: '#5C4B47' }}>
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.postcode}
              </span>
              {a.phone && <span className="block text-[11px]" style={{ color: '#9CA3AF' }}>{a.phone}</span>}
            </span>
          </button>
        );
      })}
      <button type="button" onClick={startNew}
        className="w-full flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
        style={{
          padding: compact ? '10px 12px' : '13px 16px',
          border: mode === 'new' ? '2px solid #800020' : '1px dashed #C9BFAE',
          color: '#800020',
          backgroundColor: mode === 'new' ? '#FBF3DC' : 'transparent',
        }}>
        <Plus size={15} /> Deliver somewhere else
      </button>
    </div>
  );
}
