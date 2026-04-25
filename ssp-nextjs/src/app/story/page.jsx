import StoryClient from './StoryClient';

export const metadata = {
  title: "Our Story — Grandmother's Recipes, Slow Tadkas",
  description: "The story of Sree Svadista Prasada: grandmother's recipes, authentic South Indian cooking traditions, and the patient love that fills a house with aroma.",
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
