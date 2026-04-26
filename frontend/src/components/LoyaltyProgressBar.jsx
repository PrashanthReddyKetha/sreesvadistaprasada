import React from 'react';

/**
 * Reusable loyalty progress bar.
 * compact=true  → cart drawer (one-line, small circles)
 * compact=false → full dashboard version
 */
export default function LoyaltyProgressBar({ orderCount = 0, pendingReward = false, compact = false }) {
  const position = pendingReward ? 5 : (orderCount % 5);

  const getMessage = () => {
    if (pendingReward)
      return { text: '🎁 Your free dish is ready! Claim it now.', color: 'text-[#800020]', weight: 'font-semibold' };
    if (orderCount === 0)
      return { text: 'Order 5 times to earn a free dish — any item from our menu.', color: 'text-[#5C4B47]', weight: '' };
    if (position === 1)
      return { text: `Order ${orderCount} done. ${5 - position} more to your free dish.`, color: 'text-[#5C4B47]', weight: '' };
    if (position === 2)
      return { text: `2 orders done. 3 more to your free dish. Making progress! 🌿`, color: 'text-[#5C4B47]', weight: '' };
    if (position === 3)
      return { text: 'Halfway there! Just 2 more orders for a free dish.', color: 'text-amber-700', weight: 'font-medium' };
    if (position === 4)
      return { text: 'So close! 1 more order and your free dish is yours!', color: 'text-[#800020]', weight: 'font-semibold' };
    return { text: '', color: '', weight: '' };
  };

  const msg = getMessage();
  const nextMilestone = Math.ceil((orderCount + 1) / 5) * 5;
  const cycle = Math.floor(orderCount / 5) + (pendingReward ? 0 : 1);

  if (compact) {
    return (
      <div className="py-3 px-1">
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                ${n <= position || pendingReward
                  ? 'bg-[#800020] text-white'
                  : 'bg-[#F5F5F4] border border-[#E5E7EB] text-[#9CA3AF]'}`}>
                {(n <= position || pendingReward) ? '✓' : n}
              </div>
              {n < 5 && (
                <div className={`w-2 h-0.5 rounded ${n < position || pendingReward ? 'bg-[#800020]' : 'bg-[#E5E7EB]'}`} />
              )}
            </div>
          ))}
          <div className="w-2 h-0.5 bg-[#E5E7EB] rounded" />
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border-2
            ${pendingReward
              ? 'border-[#800020] bg-[#800020]/10 animate-bounce'
              : 'border-dashed border-[#F4C430] bg-white'}`}>
            🎁
          </div>
        </div>
        <p className={`text-[11px] leading-tight ${msg.color} ${msg.weight}`}>{msg.text}</p>
      </div>
    );
  }

  return (
    <div>
      {orderCount > 0 && (
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-[#9CA3AF] uppercase tracking-wide">Cycle {cycle}</span>
          {!pendingReward && (
            <span className="text-xs text-[#9CA3AF]">Next reward at order {nextMilestone}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-0 mb-4">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className="flex items-center">
            {n > 1 && (
              <div className={`h-0.5 w-6 ${n <= position || pendingReward ? 'bg-[#800020]' : 'bg-[#E5E7EB]'}`} />
            )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all
              ${pendingReward
                ? 'bg-[#800020] border-[#800020] text-white'
                : n < position
                ? 'bg-[#800020] border-[#800020] text-white'
                : n === position
                ? 'bg-[#F4C430] border-[#F4C430] text-[#800020]'
                : n === position + 1 && !pendingReward
                ? 'bg-white border-[#800020] border-dashed text-[#800020]'
                : 'bg-white border-[#E5E7EB] text-[#9CA3AF]'}`}>
              {pendingReward || n < position ? '✓' : n}
            </div>
          </div>
        ))}

        <div className={`h-0.5 w-6 ${pendingReward ? 'bg-[#F4C430]' : 'bg-[#E5E7EB]'}`} />

        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all
          ${pendingReward
            ? 'bg-[#F4C430] border-[#F4C430] shadow-lg animate-pulse'
            : 'bg-white border-dashed border-[#F4C430]'}`}>
          🎁
        </div>
      </div>

      <div className="bg-[#F5F5F4] rounded-full h-1.5 mb-3">
        <div
          className="h-1.5 rounded-full bg-[#800020] transition-all duration-500"
          style={{ width: pendingReward ? '100%' : `${(position / 5) * 100}%` }}
        />
      </div>

      <p className={`text-sm text-center leading-relaxed ${msg.color} ${msg.weight}`}>{msg.text}</p>
    </div>
  );
}
