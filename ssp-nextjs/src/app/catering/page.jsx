import SeoSection from '@/components/SeoSection';
import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import CateringClient from './CateringClient';
import { jsonLd as safeJsonLd } from '@/lib/seo/jsonLd';

export const metadata = pageMeta('/catering', { image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80' });

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodService',
  name: 'Sree Svadista Prasada — South Indian Catering',
  description: 'Authentic South Indian catering in Milton Keynes for weddings, temple events, corporate functions and community gatherings. Edinburgh and Glasgow coming soon.',
  provider: {
    '@type': 'Restaurant',
    name: 'Sree Svadista Prasada',
    url: 'https://sreesvadistaprasada.com',
    telephone: '+447307119962',
  },
  areaServed: [
    { '@type': 'City', name: 'Milton Keynes' },
  ],
  serviceType: 'Catering',
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <CateringClient />
      <SeoSection heading={PAGE_SEO['/catering'].content.heading} paragraphs={PAGE_SEO['/catering'].content.paragraphs} links={PAGE_SEO['/catering'].content.links} />
    </>
  );
}
