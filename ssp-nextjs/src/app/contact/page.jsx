import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import ContactClient from './ContactClient';

export const metadata = pageMeta('/contact', { image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80' });

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  mainEntity: { '@id': 'https://sreesvadistaprasada.com/#restaurant' },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactClient seoLine={PAGE_SEO['/contact'].h1} />
    </>
  );
}
