import StoryClient from './StoryClient';

export const metadata = {
  title: { absolute: 'Our Story | South Indian Restaurant Milton Keynes | Sree Svadista Prasada' },
  description: 'Authentic South Indian restaurant Milton Keynes — the story behind Sree Svadista Prasada. Home-style Andhra cooking from our family to yours.',
  openGraph: {
    title: 'Our Story | South Indian Restaurant Milton Keynes | Sree Svadista Prasada',
    description: 'Authentic South Indian restaurant Milton Keynes — the story behind Sree Svadista Prasada. Home-style Andhra cooking from our family to yours.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/story',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?w=1200&q=80', width: 1200, height: 630, alt: 'Sree Svadista Prasada — Our Story' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Story | South Indian Restaurant Milton Keynes | Sree Svadista Prasada',
    description: 'Authentic South Indian restaurant Milton Keynes — the story behind Sree Svadista Prasada. Home-style Andhra cooking from our family to yours.',
    images: ['https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/story' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  about: { '@id': 'https://www.sreesvadistaprasada.com/#restaurant' },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Our Story — Authentic South Indian Restaurant Milton Keynes</h1>
      <StoryClient />
    </>
  );
}
