'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/api';
import LoyaltyProgressBar from '@/components/LoyaltyProgressBar';

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function LoyaltyTab() {
  const [loyalty, setLoyalty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/loyalty/status'),
      api.get('/loyalty/history'),
    ])
      .then(([statusRes, historyRes]) => {
        setLoyalty(statusRes.data);
        setHistory(historyRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" />
      </div>
    );
  }

  const orderCount = loyalty?.order_count ?? 0;
  const pendingReward = loyalty?.pending_reward ?? false;

  if (orderCount === 0 && !pendingReward) {
    return (
      <div className="text-center py-12 px-6">
        <div className="text-5xl mb-4">🎁</div>
        <h3 className="text-2xl text-[#800020] mb-3 font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
          Earn a free dish every 5 orders
        </h3>
        <p className="text-[#5C4B47] text-sm leading-relaxed max-w-sm mx-auto mb-6">
          Every time you complete 5 orders with us, you earn a free item from our entire menu.
          Any dish. No minimum order value. Only the delivery fee applies.
        </p>
        <div className="flex items-center justify-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="flex items-center">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-300">
                {n}
              </div>
              {n < 5 && <div className="w-4 h-0.5 bg-gray-200" />}
            </div>
          ))}
          <div className="w-4 h-0.5 bg-gray-200" />
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#F4C430] flex items-center justify-center text-lg">🎁</div>
        </div>
        <Link
          href="/menu"
          className="inline-block text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          style={{ backgroundColor: '#800020' }}
        >
          Place your first order →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {pendingReward && (
        <div className="text-white rounded-xl p-5" style={{ backgroundColor: '#800020' }}>
          <div className="flex items-center gap-3 mb-2">
            <Gift size={24} className="flex-shrink-0" />
            <h3 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your free dish is ready!
            </h3>
          </div>
          <p className="text-sm text-white/85 mb-4 leading-relaxed">
            Choose any item from our entire menu on your next order — completely free.
            No minimum order. Only the delivery fee applies.
          </p>
          <Link
            href="/menu"
            className="inline-block px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            style={{ backgroundColor: '#F4C430', color: '#800020' }}
          >
            Order now and claim →
          </Link>
        </div>
      )}

      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(244,196,48,0.3)' }}>
        <h4 className="font-semibold mb-1" style={{ color: '#2D2422' }}>Your loyalty progress</h4>
        <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>
          {loyalty?.rewards_earned ?? 0} reward{(loyalty?.rewards_earned ?? 0) !== 1 ? 's' : ''} earned ·{' '}
          {loyalty?.rewards_redeemed ?? 0} redeemed ·{' '}
          {orderCount} qualifying order{orderCount !== 1 ? 's' : ''} total
        </p>
        <LoyaltyProgressBar orderCount={orderCount} pendingReward={pendingReward} compact={false} />
      </div>

      <div className="rounded-xl border p-5" style={{ backgroundColor: '#FDFBF7', borderColor: 'rgba(244,196,48,0.2)' }}>
        <h4 className="font-semibold mb-3 text-sm" style={{ color: '#2D2422' }}>How it works</h4>
        <div className="space-y-2.5 text-sm" style={{ color: '#5C4B47' }}>
          {[
            ['🍱', 'Every 5 completed orders earns you a free dish from our entire menu.'],
            ['🎁', 'Any item — no restrictions, no minimum order value.'],
            ['🔄', 'Repeats every 5 orders, forever. Your count never resets.'],
            ['🚫', "Cancelled and refunded orders do not count. The free-item order itself doesn't count toward the next cycle."],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-start gap-2">
              <span className="text-base flex-shrink-0">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl border" style={{ borderColor: 'rgba(244,196,48,0.2)' }}>
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between p-4 text-sm font-semibold"
            style={{ color: '#2D2422' }}
          >
            <span>Qualifying order history ({history.length})</span>
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showHistory && (
            <div className="border-t divide-y" style={{ borderColor: 'rgba(244,196,48,0.2)' }}>
              {history.map((order, i) => (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#800020' }}>
                      {order.loyalty_order_number ?? i + 1}
                    </span>
                    <span style={{ color: '#5C4B47' }}>{fmt(order.created_at)}</span>
                  </div>
                  <span className="font-semibold" style={{ color: '#2D2422' }}>£{(order.total ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
