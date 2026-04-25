import CateringClient from './CateringClient';

export const metadata = {
  title: 'South Indian Catering — Weddings, Temple & Corporate',
  description: 'Authentic South Indian catering in Milton Keynes, Edinburgh & Glasgow. Weddings, temple prasada, corporate lunches and community events. Serving Wolverton, Stony Stratford, Greenleys, Leith, Pollokshields and surrounding areas.',
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
