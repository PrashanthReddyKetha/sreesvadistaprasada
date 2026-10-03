import TermsClient from './TermsClient';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for ordering food from Sree Svadista Prasada online.',
  alternates: { canonical: 'https://sreesvadistaprasada.com/terms' },
};

export default function Page() {
  return <TermsClient />;
}
