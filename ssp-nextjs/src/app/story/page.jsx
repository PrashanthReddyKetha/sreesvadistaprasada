import { pageMeta, PAGE_SEO, SITE } from '@/lib/seo/pages';
import StoryClient from './StoryClient';
import { jsonLd as safeJsonLd } from '@/lib/seo/jsonLd';

export const metadata = pageMeta('/story', { image: `${SITE}/hero/story-table.jpg` });

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
