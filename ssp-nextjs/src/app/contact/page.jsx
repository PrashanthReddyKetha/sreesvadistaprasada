import ContactClient from './ContactClient';

export const metadata = {
  title: { absolute: 'Contact Us | Indian Takeaway Milton Keynes | Sree Svadista Prasada' },
  description: 'Contact our Indian takeaway Milton Keynes — order enquiries, catering, Dabba Wala subscriptions. WhatsApp +44 73 0711 9962. Delivering across MK, Edinburgh & Glasgow.',
  openGraph: {
    title: 'Contact Us | Indian Takeaway Milton Keynes | Sree Svadista Prasada',
    description: 'Contact our Indian takeaway Milton Keynes — order enquiries, catering, Dabba Wala subscriptions. WhatsApp +44 73 0711 9962.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/contact',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80', width: 1200, height: 630, alt: 'Sree Svadista Prasada — Indian Takeaway Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Indian Takeaway Milton Keynes | Sree Svadista Prasada',
    description: 'Contact our Indian takeaway Milton Keynes — order enquiries, catering, Dabba Wala subscriptions. WhatsApp +44 73 0711 9962.',
    images: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/contact' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  mainEntity: { '@id': 'https://www.sreesvadistaprasada.com/#restaurant' },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactClient />
    </>
  );
}
