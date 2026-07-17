import CateringClient from './CateringClient';

export const metadata = {
  title: 'Indian Catering Milton Keynes | South Indian Events & Weddings',
  description: 'Indian catering Milton Keynes — South Indian weddings, corporate events & family celebrations. Veg & non-veg menus tailored to your occasion. Get a quote.',
  keywords: ['Indian catering Milton Keynes', 'South Indian wedding catering UK', 'Indian corporate catering MK', 'South Indian event catering Milton Keynes', 'Andhra catering UK', 'temple prasada catering', 'Indian buffet catering MK'],
  openGraph: {
    title: 'Indian Catering Milton Keynes | South Indian Events & Weddings',
    description: 'Indian catering Milton Keynes — South Indian weddings, corporate events & family celebrations. Veg & non-veg menus tailored to your occasion. Get a quote.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indian Catering Milton Keynes | South Indian Events & Weddings',
    description: 'Indian catering Milton Keynes — South Indian weddings, corporate events & family celebrations. Veg & non-veg menus tailored to your occasion. Get a quote.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodService',
  name: 'Sree Svadista Prasada — South Indian Catering',
  description: 'Authentic South Indian catering in Milton Keynes for weddings, temple events, corporate functions and community gatherings. Also serving Edinburgh and Glasgow.',
  provider: {
    '@type': 'Restaurant',
    name: 'Sree Svadista Prasada',
    url: 'https://www.sreesvadistaprasada.com',
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
      <CateringClient />
    </>
  );
}
