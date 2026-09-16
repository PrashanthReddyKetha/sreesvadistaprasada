import AppClient from './AppClient';

const SITE = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'Get the SSP App | Sree Svadista Prasada' },
  description: 'Install the SSP app — order authentic Andhra food in a few taps, pick a collection slot, save 10% on collection, and get restock alerts and offers first.',
  alternates: { canonical: `${SITE}/app` },
  openGraph: {
    title: 'Get the SSP App — Amma’s kitchen, one tap away',
    description: 'Order in a few taps, pick your collection slot, save 10% on collection, and never miss a dish.',
    type: 'website',
    url: `${SITE}/app`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: `${SITE}/icons/icon-512.png`, width: 512, height: 512, alt: 'SSP app icon' }],
  },
  twitter: { card: 'summary', title: 'Get the SSP App', images: [`${SITE}/icons/icon-512.png`] },
};

export default function AppPage() {
  return <AppClient />;
}
