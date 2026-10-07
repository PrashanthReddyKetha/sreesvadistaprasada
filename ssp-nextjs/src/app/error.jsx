'use client';
import { useEffect } from 'react';

/* Shown instead of a blank "Application error" when something on a page breaks (audit A-0003, FE-011).
   The basket and sign-in are untouched; the customer can try again or go to the order page. */
export default function Error({ error, reset }) {
  useEffect(() => {
    try { import('@/lib/track').then(m => m.record && m.record('site_error', { message: String(error?.message || 'page error').slice(0, 120) })); } catch {}
  }, [error]);
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16" style={{ backgroundColor: '#FFF8F0' }}>
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Something went wrong on this page</h1>
        <p className="text-sm mb-6" style={{ color: '#5C4B47' }}>Your basket is safe. Try again, or go to the order page — if it keeps happening, message us on WhatsApp and we'll take your order by hand.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => reset()} className="px-5 py-2.5 text-sm font-semibold text-white rounded-sm" style={{ backgroundColor: '#800020' }}>Try again</button>
          <a href="/order" className="px-5 py-2.5 text-sm font-semibold rounded-sm border" style={{ borderColor: '#800020', color: '#800020' }}>Go to the order page</a>
          <a href="https://wa.me/447307119962" className="px-5 py-2.5 text-sm font-semibold rounded-sm border" style={{ borderColor: '#2E7D32', color: '#2E7D32' }}>WhatsApp us</a>
        </div>
      </div>
    </main>
  );
}
