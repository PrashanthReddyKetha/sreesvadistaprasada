import { pageMeta, PAGE_SEO, SITE } from '@/lib/seo/pages';
import StoryClient from './StoryClient';
import { jsonLd as safeJsonLd } from '@/lib/seo/jsonLd';
import { getDishPhotos } from '@/lib/siteStatus';

export const revalidate = 600;

export const metadata = pageMeta('/story', { image: `${SITE}/hero/story-table.jpg` });

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  about: { '@id': 'https://sreesvadistaprasada.com/#restaurant' },
};

export default async function Page() {
  // the Veg Thali on a banana leaf, the same photo the Dabba Wala page shows (owner, 13 Nov 2026)
  const photos = await getDishPhotos();
  const thali = photos['veg-thali']?.image;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <StoryClient seoLine={PAGE_SEO['/story'].h1} thali={thali} />
    </>
  );
}
