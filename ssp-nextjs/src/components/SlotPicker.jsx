'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/api';

/**
 * Collection time picker — ASAP + slot chips from GET /pickup-slots.
 * Shared by /order and checkout. Selected value flows through CartContext.pickupSlot.
 *
 * Props:
 *   pickupSlot / setPickupSlot — from useCart()
 *   compact — tighter layout for the checkout card
 */
export default function SlotPicker({ pickupSlot, setPickupSlot, compact = false }) {
  const [data, setData] = useState(null);       // API response for the active day
  const [day, setDay] = useState('today');      // 'today' | 'tomorrow'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tomorrowStr = () => {
    // London calendar date, not UTC — matters around midnight during BST
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(d);
  };

  const fetchSlots = useCallback(async (which) => {
    setLoading(true);
    setError(null);
    try {
      const params = which === 'tomorrow' ? { date: tomorrowStr() } : {};
      const res = await api.get('/pickup-slots', { params });
      setData(res.data);
    } catch (e) {
      setError('Could not load collection times — please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(day); }, [day, fetchSlots]);

  // Refresh on focus so stale slots disappear when the user comes back
  useEffect(() => {
    const onFocus = () => fetchSlots(day);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [day, fetchSlots]);

  // If the selected slot no longer exists in the fresh grid, drop it
  useEffect(() => {
    if (!data || !pickupSlot) return;
    if (pickupSlot.date !== data.date) return; // selection belongs to the other day
    const still = (data.slots || []).find(s => s.iso === pickupSlot.iso && s.available);
    if (!still) setPickupSlot(null);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const chipStyle = (selected, disabled) => ({
    flex: 'none',
    padding: compact ? '7px 12px' : '9px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    border: selected ? '1.5px solid #F4C430' : '1.5px solid #E8DFCE',
    backgroundColor: selected ? '#FBF3DC' : '#FFFFFF',
    color: disabled ? '#B8AFa5' : '#2D2422',
    opacity: disabled ? 0.5 : 1,
    boxShadow: selected ? '0 0 0 1px #F4C430' : 'none',
    textDecoration: disabled ? 'line-through' : 'none',
  });

  if (loading && !data) {
    // Same height as the loaded picker (label row + chip row) — no layout shift
    return (
      <div className="min-h-[86px] flex items-center text-sm" style={{ color: '#5C4B47' }}>
        Loading collection times…
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-sm py-3" style={{ color: '#8B3A3A' }}>
        {error}{' '}
        <button onClick={() => fetchSlots(day)} className="underline font-bold" style={{ color: '#800020' }}>Retry</button>
      </div>
    );
  }
  if (data?.paused) {
    return (
      <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FBF3DC', border: '1px solid #EBD9A8', color: '#5C4B47' }}>
        {data.message}
      </div>
    );
  }

  const slots = data?.slots || [];
  const showAsap = day === 'today' && data?.asap_available;
  const closedToday = day === 'today' && !slots.length && !showAsap;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#B8860B' }}>
          Collection time
        </span>
        <div className="flex gap-1">
          {['today', 'tomorrow'].map(d => (
            <button key={d} onClick={() => setDay(d)}
              className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
              style={{
                backgroundColor: day === d ? '#800020' : 'transparent',
                color: day === d ? '#fff' : '#5C4B47',
              }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {closedToday ? (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FBF3DC', border: '1px solid #EBD9A8', color: '#5C4B47' }}>
          We're closed for today's orders — switch to <b>Tomorrow</b> to pre-order from opening time.
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {showAsap && (
            <button
              onClick={() => setPickupSlot(null)}
              style={chipStyle(!pickupSlot, false)}>
              ASAP<span className="block text-[9px] font-normal" style={{ color: '#5C4B47' }}>~40 min</span>
            </button>
          )}
          {slots.map(s => {
            const selected = pickupSlot?.iso === s.iso;
            const disabled = !s.available;
            return (
              <button key={s.iso} disabled={disabled}
                onClick={() => setPickupSlot({ iso: s.iso, label: s.label, date: data.date })}
                style={chipStyle(selected, disabled)}>
                {s.label}
                {disabled && <span className="block text-[9px] font-normal">Full</span>}
              </button>
            );
          })}
          {!slots.length && !showAsap && (
            <span className="text-sm py-1" style={{ color: '#5C4B47' }}>No collection times available for this day.</span>
          )}
        </div>
      )}
    </div>
  );
}
