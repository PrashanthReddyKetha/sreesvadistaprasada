import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import StoryClient from './StoryClient';
import { jsonLd as safeJsonLd } from '@/lib/seo/jsonLd';

export const metadata = pageMeta('/story', { image: 'https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?w=1200&q=80' });

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  about: { '@id': 'https://sreesvadistaprasada.com/#restaurant' },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <StoryClient seoLine={PAGE_SEO['/story'].h1} />
    </>
  );
}
