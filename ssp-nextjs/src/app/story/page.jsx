import StoryClient from './StoryClient';

export const metadata = {
  title: 'Authentic South Indian Restaurant Milton Keynes | Our Story | Sree Svadista Prasada',
  description: 'Authentic South Indian restaurant Milton Keynes — the story behind Sree Svadista Prasada. Home-style Andhra cooking from our family to yours.',
  openGraph: {
    title: 'Authentic South Indian Restaurant Milton Keynes | Our Story',
    description: 'Authentic South Indian restaurant Milton Keynes — the story behind Sree Svadista Prasada. Home-style Andhra cooking from our family to yours.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Authentic South Indian Restaurant Milton Keynes | Our Story',
    description: 'Authentic South Indian restaurant Milton Keynes — the story behind Sree Svadista Prasada. Home-style Andhra cooking from our family to yours.',
  },
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
      <StoryClient />
    </>
  );
}
