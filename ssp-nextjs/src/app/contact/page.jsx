import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact Sree Svadista Prasada | Indian Takeaway Milton Keynes',
  description: 'Contact our Indian takeaway Milton Keynes — order enquiries, catering, Dabba Wala subscriptions. WhatsApp +44 73 0711 9962. Delivering across MK, Edinburgh & Glasgow.',
  openGraph: {
    title: 'Contact Sree Svadista Prasada | Indian Takeaway Milton Keynes',
    description: 'Contact our Indian takeaway Milton Keynes — order enquiries, catering, Dabba Wala subscriptions. WhatsApp +44 73 0711 9962.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Sree Svadista Prasada | Indian Takeaway Milton Keynes',
    description: 'Contact our Indian takeaway Milton Keynes — order enquiries, catering, Dabba Wala subscriptions. WhatsApp +44 73 0711 9962.',
  },
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
