'use client';
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/whatsappMessages';

/**
 * Opens WhatsApp with `message` pre-written to `phone` — staff review and hit send.
 * Renders nothing when there is no usable phone number or no message for this state.
 */
export default function WhatsAppSend({ phone, message, label = 'Send on WhatsApp', compact = false }) {
  const href = message ? waLink(phone, message) : null;
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={message}
      onClick={e => e.stopPropagation()}
      className={`inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-white whitespace-nowrap ${compact ? 'px-2 py-1.5' : 'px-3 py-1.5'}`}
      style={{ backgroundColor: '#25D366' }}>
      <MessageCircle size={12} /> {label}
    </a>
  );
}
