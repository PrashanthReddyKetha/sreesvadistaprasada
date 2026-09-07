import OrderClient from './OrderClient';

export const metadata = {
  title: 'Order Now | Sree Svadista Prasada',
  description:
    'Order authentic Andhra food for collection or delivery in Milton Keynes. Pick your collection time, pay securely, and collect fresh from our kitchen.',
  alternates: { canonical: 'https://sreesvadistaprasada.com/order' },
};

export default function OrderPage() {
  return <OrderClient />;
}
