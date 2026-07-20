import CateringClient from './CateringClient';

export const metadata = {
  title: { absolute: 'South Indian Catering Milton Keynes | Sree Svadista Prasada' },
  description: 'Indian catering Milton Keynes — South Indian weddings, corporate events & family celebrations. Veg & non-veg menus tailored to your occasion. Get a quote.',
  keywords: ['Indian catering Milton Keynes', 'South Indian wedding catering UK', 'Indian corporate catering MK', 'South Indian event catering Milton Keynes', 'Andhra catering UK', 'temple prasada catering', 'Indian buffet catering MK'],
  openGraph: {
    title: 'South Indian Catering Milton Keynes | Sree Svadista Prasada',
    description: 'Indian catering Milton Keynes — South Indian weddings, corporate events & family celebrations. Veg & non-veg menus tailored to your occasion. Get a quote.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/catering',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80', width: 1200, height: 630, alt: 'South Indian Catering Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'South Indian Catering Milton Keynes | Sree Svadista Prasada',
    description: 'Indian catering Milton Keynes — South Indian weddings, corporate events & family celebrations. Veg & non-veg menus tailored to your occasion. Get a quote.',
    images: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/catering' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodService',
  name: 'Sree Svadista Prasada — South Indian Catering',
  description: 'Authentic South Indian catering in Milton Keynes for weddings, temple events, corporate functions and community gatherings. Also serving Edinburgh and Glasgow.',
  provider: {
    '@type': 'Restaurant',
    name: 'Sree Svadista Prasada',
    url: 'https://sreesvadistaprasada.com',
    telephone: '+447307119962',
  },
  areaServed: [
    { '@type': 'City', name: 'Milton Keynes' },
    { '@type': 'City', name: 'Edinburgh' },
    { '@type': 'City', name: 'Glasgow' },
  ],
  serviceType: 'Catering',
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">South Indian Catering Milton Keynes — Weddings, Events & Corporate</h1>
      <CateringClient />
    </>
  );
}
