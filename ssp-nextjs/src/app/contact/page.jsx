import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch — order enquiries, catering, delivery areas. WhatsApp +44 73 0711 9962. Delivering across Milton Keynes (Wolverton, Stony Stratford, Greenleys), Edinburgh (Leith, Newington) and Glasgow (Pollokshields, Shawlands).',
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
