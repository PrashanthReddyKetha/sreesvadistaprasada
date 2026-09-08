'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

/**
 * Mobile-only sticky bottom CTA promoting /order across marketing pages.
 * Hidden where it would be redundant or collide with other bottom UI:
 * - /order, /checkout (own cart bars), /admin, /dashboard, /reset-password
 * - menu pages while the cart has items (TakeawayNudge owns the bottom there)
 */
const HIDDEN_PREFIXES = ['/order', '/checkout', '/admin', '/dashboard', '/reset-password'];
const MENU_PATHS = ['/svadista', '/prasada', '/menu', '/breakfast', '/street-food', '/ragi-specials', '/drinks', '/snacks'];

export default function OrderNowBar() {
  const path = usePathname() || '';
  const { cartCount } = useCart();

  if (HIDDEN_PREFIXES.some(p => path.startsWith(p))) return null;
  const nudgeVisible = cartCount > 0 && MENU_PATHS.some(p => path.startsWith(p));
  if (nudgeVisible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden px-3 pb-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
      <Link href="/order"
        className="flex items-center justify-between rounded-2xl px-5 py-3.5 text-white"
        style={{ backgroundColor: '#800020', boxShadow: '0 -4px 20px rgba(92,0,23,0.35)' }}
        data-testid="order-now-bar">
        <span className="text-sm font-black tracking-wide">Order Now</span>
        <span className="text-[11px] font-bold" style={{ color: '#F4C430' }}>
          Collect in ~40 min · save 10% →
        </span>
      </Link>
    </div>
  );
}
