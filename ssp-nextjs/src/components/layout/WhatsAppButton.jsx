'use client';
import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/447307119962?text=Hi%2C%20I%27d%20like%20to%20order%20from%20Sree%20Svadista%20Prasada"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Order via WhatsApp"
      data-testid="whatsapp-button"
    >
      <MessageCircle size={26} className="text-white" fill="white" />
    </a>
  );
};

export default WhatsAppButton;
