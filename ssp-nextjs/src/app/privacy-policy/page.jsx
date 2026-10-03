import PrivacyClient from './PrivacyClient';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Sree Svadista Prasada privacy policy — how we collect, use and protect your personal data.',
  alternates: { canonical: 'https://sreesvadistaprasada.com/privacy-policy' },
};

export default function Page() {
  return <PrivacyClient />;
}
