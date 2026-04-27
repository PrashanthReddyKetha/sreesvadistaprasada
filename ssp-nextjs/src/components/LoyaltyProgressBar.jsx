'use client';
import React from 'react';

function getMessage(position, pendingReward) {
  if (pendingReward || position === 0)
    return { text: 'Your free dish is ready to claim!', color: 'text-[#800020]', weight: 'font-semibold' };
  if (position === 1)
    return { text: 'Order 1 of 5 done. Your loyalty journey has started! 🍱', color: 'text-[#5C4B47]', weight: '' };
  if (position === 2)
    return { text: '2 orders done. 3 more to your free dish. Making progress! 🌿', color: 'text-[#5C4B47]', weight: '' };
  if (position === 3)
    return { text: 'Halfway there — 3 down, 2 to go! 🌿', color: 'text-[#5C4B47]', weight: '' };
  if (position === 4)
    return { text: 'One more order and your free dish is yours! ⭐', color: 'text-[#B8860B]', weight: 'font-semibold' };
  return { text: 'Every 5 orders earns you a free dish.', color: 'text-[#5C4B47]', weight: '' };
}

export default function LoyaltyProgressBar({ orderCount = 0, pendingReward = false, compact = false }) {
  const position = pendingReward ? 0 : (orderCount % 5);
  const filled = pendingReward ? 5 : position;
  const msg = getMessage(position, pendingReward);

  return (
    <div className={compact ? '' : 'space-y-3'}>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(n => {
          const done = n <= filled;
          const isFree = n === 5;
          return (
            <React.Fragment key={n}>
              <div
                className={`flex items-center justify-center rounded-full font-bold transition-all
                  ${compact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
                  ${done ? 'text-white' : 'border-2 border-dashed border-gray-200 text-gray-300'}`}
                style={done ? { backgroundColor: isFree ? '#F4C430' : '#800020' } : {}}
              >
                {isFree ? '🎁' : done ? '✓' : n}
              </div>
              {n < 5 && (
                <div
                  className="flex-1 h-0.5 rounded-full transition-all"
                  style={{ backgroundColor: n < filled ? '#800020' : '#E5E7EB' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {!compact && (
        <p className={`text-xs ${msg.color} ${msg.weight}`}>{msg.text}</p>
      )}
    </div>
  );
}
