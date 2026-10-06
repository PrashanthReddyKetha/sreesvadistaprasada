'use client';
import React from 'react';

/* One confirmation for every consequential admin action: what is true now, what will be true after,
   who it affects, what happens next, and whether it can be undone — then a clear yes or no. */
const P = '#800020';

export default function ConfirmAction({ title, rows = [], confirmLabel = 'Yes, do it', cancelLabel = 'Not now', danger = false, busy = false, onCancel, onConfirm, children }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label={title} data-notrack>
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: P }}>{title}</h3>
        <dl className="text-sm space-y-1.5">
          {rows.filter(r => r && r[1] !== undefined && r[1] !== null && r[1] !== '').map(([label, value]) => (
            <div key={label} className="flex gap-2"><dt className="text-gray-500 w-28 shrink-0">{label}</dt><dd className="flex-1" style={{ color: '#3D2B1F' }}>{value}</dd></div>
          ))}
        </dl>
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} disabled={busy} className="px-4 py-2 text-sm font-semibold rounded-lg border disabled:opacity-50" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>{cancelLabel}</button>
          <button onClick={onConfirm} disabled={busy} className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50" style={{ backgroundColor: danger ? '#B91C1C' : P, color: '#fff' }}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
