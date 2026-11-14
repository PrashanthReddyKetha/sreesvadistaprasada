'use client';
import SlotPicker from '@/components/SlotPicker';
import { useCart } from '@/context/CartContext';

/** The collection time(s) for the basket. Today's dishes take one time (ASAP or a slot); pre-order dishes are made
    overnight and take a time of their own tomorrow. A basket with both is collected twice, so it shows two pickers
    and says so (owner, 14 Nov 2026). The choices live in CartContext as pickupSlot and preorderSlot. */
export default function CollectionTimes({ compact = false }) {
  const { cartItems, pickupSlot, setPickupSlot, preorderSlot, setPreorderSlot } = useCart();
  const preNames = cartItems.filter(i => i.preorder).map(i => i.name);
  const hasPre = preNames.length > 0;
  const hasToday = cartItems.some(i => !i.preorder);
  const both = hasPre && hasToday;
  return (
    <div className={both ? 'space-y-3' : ''} data-testid="collection-times">
      {both && (
        <p className="text-[11px] font-semibold rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(128,0,32,0.06)', color: '#800020' }}>
          Two collections: today&apos;s dishes at the first time, and your pre-order ({preNames.join(', ')}) tomorrow at the second.
        </p>
      )}
      {hasToday && (
        <SlotPicker pickupSlot={pickupSlot} setPickupSlot={setPickupSlot} compact={compact}
          title={both ? "Today's dishes · collection time" : 'Collection time'} />
      )}
      {hasPre && (
        <div data-testid="preorder-slot">
          <SlotPicker pickupSlot={preorderSlot} setPickupSlot={setPreorderSlot} compact={compact} requireTomorrow
            title={both ? 'Pre-order · collect tomorrow' : 'Collection time'}
            note={both ? `🌙 ${preNames.join(', ')} ${preNames.length > 1 ? 'are' : 'is'} made overnight — pick when to collect tomorrow.` : undefined} />
        </div>
      )}
    </div>
  );
}
