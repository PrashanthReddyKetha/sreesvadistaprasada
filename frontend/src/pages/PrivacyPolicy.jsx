import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
      {title}
    </h2>
    <div className="space-y-3 text-sm leading-relaxed" style={{ color: '#5C4B47' }}>
      {children}
    </div>
  </div>
);

const PrivacyPolicy = () => (
  <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
    {/* Hero */}
    <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" style={{ backgroundColor: '#800020' }}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-14">
        <p className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: '#F4C430' }}>Legal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-300 mt-2">Last updated: 11 April 2026</p>
      </div>
    </section>

    <div className="max-w-4xl mx-auto px-4 md:px-8 py-14">

      <Section title="1. Who We Are">
        <p>
          Sree Svadista Prasada ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") is a South Indian food ordering
          and meal-subscription service operating in Milton Keynes, Edinburgh, and Glasgow, United Kingdom.
        </p>
        <p>
          For the purposes of UK data-protection law, we are the <strong>Data Controller</strong>.
          Our contact details are:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Email: <a href="mailto:info@sreesvadistaprasada.com" className="underline" style={{ color: '#800020' }}>info@sreesvadistaprasada.com</a></li>
          <li>Phone: +44 73 0711 9962</li>
          <li>Website: <a href="https://sreesvadistaprasada.vercel.app" className="underline" style={{ color: '#800020' }}>sreesvadistaprasada.vercel.app</a></li>
        </ul>
      </Section>

      <Section title="2. What Data We Collect">
        <p>We collect the following categories of personal data:</p>
        <table className="w-full text-xs border-collapse mt-2">
          <thead>
            <tr style={{ backgroundColor: 'rgba(128,0,32,0.06)' }}>
              <th className="text-left p-3 font-semibold border" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>Category</th>
              <th className="text-left p-3 font-semibold border" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>Examples</th>
              <th className="text-left p-3 font-semibold border" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>Why We Collect It</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Identity', 'Name, email address', 'Account creation, order fulfilment'],
              ['Contact', 'Phone number, delivery address', 'Delivery, customer support'],
              ['Transaction', 'Order history, subscription status', 'Fulfilment, billing, dispute resolution'],
              ['Technical', 'IP address, browser type, session data', 'Security, fraud prevention, analytics'],
              ['Communications', 'Enquiry content, support messages', 'Responding to enquiries'],
              ['Marketing', 'Email address (opt-in only)', 'Newsletter and promotional updates'],
            ].map(([cat, ex, why]) => (
              <tr key={cat}>
                <td className="p-3 border font-medium" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>{cat}</td>
                <td className="p-3 border" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>{ex}</td>
                <td className="p-3 border" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>We do not collect special-category (sensitive) data such as health information, biometrics, or financial card details. Payment processing is handled entirely by our third-party payment provider.</p>
      </Section>

      <Section title="3. How We Use Your Data">
        <p>We process your personal data on the following lawful bases under UK GDPR:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Contract performance</strong> — processing orders, managing subscriptions, arranging delivery.</li>
          <li><strong>Legitimate interests</strong> — improving our service, fraud prevention, communicating with customers about their orders.</li>
          <li><strong>Legal obligation</strong> — retaining transaction records for tax and regulatory compliance.</li>
          <li><strong>Consent</strong> — sending marketing emails and newsletters (you can withdraw consent at any time).</li>
        </ul>
      </Section>

      <Section title="4. Artificial Intelligence (AI) Processing">
        <p>
          We use an AI language model provided by <strong>Anthropic (Claude)</strong> solely to assist our kitchen team with
          generating menu item descriptions and suggestions. This AI tool:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Is used only for internal content generation, <strong>not for automated decisions about customers</strong>.</li>
          <li>Does not receive, store, or process any personal data about customers or website visitors.</li>
          <li>Is operated in compliance with the EU AI Act's requirements for general-purpose AI systems (GPAI) used in low-risk administrative contexts.</li>
          <li>Does not perform any profiling, automated decision-making, or high-risk AI processing as defined under the EU AI Act or UK GDPR Article 22.</li>
        </ul>
        <p>
          You have the right to be informed about any automated decision-making that significantly affects you. No such processing occurs on this platform.
        </p>
      </Section>

      <Section title="5. Cookies">
        <p>We use the following types of cookies:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Strictly necessary cookies</strong> — Authentication tokens stored in <code>localStorage</code> (<code>ssp_token</code>) and your basket state (<code>ssp_cart</code>). These are essential for the service to function and do not require consent.</li>
          <li><strong>Analytics cookies</strong> — If we use analytics services in future, we will seek your consent beforehand.</li>
        </ul>
        <p>You can clear stored data at any time via your browser's developer tools or settings.</p>
      </Section>

      <Section title="6. Data Sharing and Third Parties">
        <p>We share your data only where necessary:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>MongoDB Atlas (MongoDB, Inc.)</strong> — our cloud database provider, storing orders, accounts, and enquiries. Data is processed under a Data Processing Agreement.</li>
          <li><strong>Vercel</strong> — hosting our frontend application. No personal data is stored by Vercel beyond standard server logs.</li>
          <li><strong>Render</strong> — hosting our backend API. Standard server logs apply.</li>
          <li><strong>Google OAuth</strong> — optional login via Google. We receive only your name and email address; Google's privacy policy governs their processing.</li>
          <li><strong>Delivery and postcode services</strong> — we use <em>postcodes.io</em> (a public UK postcode API) and <em>getAddress.io</em> for address lookup. Your postcode is sent to these services only during checkout address lookup; they do not receive any other personal data.</li>
          <li><strong>Anthropic</strong> — as described in Section 4, for AI-assisted menu content only. No customer data is shared.</li>
        </ul>
        <p>We do not sell, rent, or trade your personal data to third parties for marketing purposes.</p>
      </Section>

      <Section title="7. International Transfers">
        <p>
          Some of our service providers (MongoDB Atlas, Vercel, Anthropic) may process data outside the UK and EEA.
          Where this occurs, we rely on adequacy decisions or standard contractual clauses (SCCs) approved by the UK ICO
          to ensure your data receives an equivalent level of protection.
        </p>
      </Section>

      <Section title="8. Data Retention">
        <p>We retain your personal data for the following periods:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Account data</strong> — for as long as your account is active, plus 12 months after account deletion.</li>
          <li><strong>Order and transaction data</strong> — 7 years, as required by UK tax law (HMRC).</li>
          <li><strong>Enquiries and support messages</strong> — 2 years from last correspondence.</li>
          <li><strong>Newsletter subscriptions</strong> — until you unsubscribe, or 3 years without engagement, whichever is earlier.</li>
        </ul>
      </Section>

      <Section title="9. Your Rights Under UK GDPR">
        <p>You have the following rights regarding your personal data:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Right of access</strong> — request a copy of all personal data we hold about you.</li>
          <li><strong>Right to rectification</strong> — correct inaccurate or incomplete data.</li>
          <li><strong>Right to erasure</strong> — request deletion of your data ("right to be forgotten"), subject to legal retention obligations.</li>
          <li><strong>Right to restriction</strong> — limit how we use your data in certain circumstances.</li>
          <li><strong>Right to data portability</strong> — receive your data in a structured, machine-readable format.</li>
          <li><strong>Right to object</strong> — object to processing based on legitimate interests or for direct marketing.</li>
          <li><strong>Rights related to automated decision-making</strong> — not to be subject to solely automated decisions with significant effects (not applicable here, as we do not use such processing).</li>
          <li><strong>Right to withdraw consent</strong> — at any time where processing is based on consent (e.g. marketing emails).</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at{' '}
          <a href="mailto:info@sreesvadistaprasada.com" className="underline" style={{ color: '#800020' }}>
            info@sreesvadistaprasada.com
          </a>. We will respond within 30 days.
        </p>
        <p>
          If you are unsatisfied with our response, you have the right to lodge a complaint with the{' '}
          <strong>Information Commissioner's Office (ICO)</strong> at{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#800020' }}>
            ico.org.uk
          </a>{' '}
          or by calling 0303 123 1113.
        </p>
      </Section>

      <Section title="10. Security">
        <p>
          We implement appropriate technical and organisational measures to protect your personal data, including:
          encrypted data transmission (HTTPS), JWT-based authentication with secure key signing, bcrypt password hashing,
          and role-based access controls. We do not store payment card details on our systems.
        </p>
      </Section>

      <Section title="11. Children's Privacy">
        <p>
          Our service is not directed at children under the age of 13. We do not knowingly collect personal data from
          children. If you believe we have inadvertently collected data from a child, please contact us immediately.
        </p>
      </Section>

      <Section title="12. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant changes by updating
          the "Last updated" date at the top of this page and, where appropriate, by email. Continued use of our
          service after changes constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="13. Contact Us">
        <p>For any privacy-related queries or to exercise your rights:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Email: <a href="mailto:info@sreesvadistaprasada.com" className="underline" style={{ color: '#800020' }}>info@sreesvadistaprasada.com</a></li>
          <li>Phone: +44 73 0711 9962</li>
        </ul>
      </Section>

      <div className="pt-6 border-t text-sm" style={{ borderColor: 'rgba(128,0,32,0.15)', color: '#A09890' }}>
        <p>
          See also:{' '}
          <Link to="/terms" className="underline" style={{ color: '#800020' }}>Terms of Service</Link>
          {' '}·{' '}
          <Link to="/contact" className="underline" style={{ color: '#800020' }}>Contact Us</Link>
        </p>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
