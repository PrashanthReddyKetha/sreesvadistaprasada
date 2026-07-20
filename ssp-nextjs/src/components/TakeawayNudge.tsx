'use client';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

const MENU_PATHS = ['/svadista', '/prasada', '/menu', '/breakfast', '/street-food', '/ragi-specials', '/drinks'];

export default function TakeawayNudge() {
  const pathname = usePathname();
  const { cartCount, setCartOpen } = useCart();

  if (!MENU_PATHS.includes(pathname) || cartCount === 0) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 shadow-2xl"
      style={{ backgroundColor: '#F4C430', borderTop: '2px solid rgba(184,134,11,0.4)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-tight" style={{ color: '#800020' }}>
          🛵 Collect &amp; save 10% on your order
        </p>
        <p className="text-[11px] leading-tight" style={{ color: '#92400E' }}>
          Choose collection at checkout
        </p>
      </div>
      <button
        onClick={() => setCartOpen(true)}
        className="ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
        style={{ backgroundColor: '#800020', color: '#F4C430' }}
      >
        View Cart →
      </button>
    </div>
  );
}
