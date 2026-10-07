import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import ContactClient from './ContactClient';
import { getOpeningHoursText, getDeliveryEnabled } from '@/lib/siteStatus';
import { jsonLd as safeJsonLd } from '@/lib/seo/jsonLd';

// Re-read the opening hours set in admin every 10 minutes
export const revalidate = 600;

export const metadata = pageMeta('/contact', { image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80' });

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  mainEntity: { '@id': 'https://sreesvadistaprasada.com/#restaurant' },
};

export default async function Page() {
  const [hours, deliveryEnabled] = await Promise.all([getOpeningHoursText(), getDeliveryEnabled()]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <ContactClient seoLine={PAGE_SEO['/contact'].h1} hours={hours} deliveryEnabled={deliveryEnabled} />
    </>
  );
}
