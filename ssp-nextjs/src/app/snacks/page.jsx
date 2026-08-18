import SnacksClient from './SnacksClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Hot, Sweet & Pickles — Coming Soon | Sree Svadista Prasada' },
  description: 'Handmade Andhra pickles, podis and traditional sweets are coming soon to Milton Keynes, Edinburgh & Glasgow. Notify me for launch, or WhatsApp us for bulk orders.',
  keywords: ['Andhra pickles UK', 'South Indian sweets UK', 'Indian snacks coming soon UK', 'Gongura pickle', 'Kandi Podi', 'buy Indian pickles online UK'],
  openGraph: {
    title: 'Hot, Sweet & Pickles — Coming Soon | Sree Svadista Prasada',
    description: 'Handmade Andhra pickles, podis and traditional sweets are coming soon to Milton Keynes, Edinburgh & Glasgow. Notify me for launch, or WhatsApp us for bulk orders.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/snacks',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?w=1200&q=80', width: 1200, height: 630, alt: 'Hot, Sweet & Pickles — Coming Soon' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hot, Sweet & Pickles — Coming Soon | Sree Svadista Prasada',
    description: 'Handmade Andhra pickles, podis and traditional sweets are coming soon to Milton Keynes, Edinburgh & Glasgow. Notify me for launch, or WhatsApp us for bulk orders.',
    images: ['https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/snacks' },
};

export default function SnacksPage() {
  return (
    <>
      <h1 className="sr-only">Hot, Sweet & Pickles — Coming Soon</h1>
      <SnacksClient />
    </>
  );
}
