import { redirect } from 'next/navigation';

// The preview of the Today's Menu / Pre-order page went live as /order on 25 Nov 2026; old links land there.
export const metadata = { robots: { index: false, follow: false } };

export default function OrderPreviewPage() {
  redirect('/order');
}
