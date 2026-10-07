'use client';
import React from 'react';
import Link from 'next/link';

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
        <p className="text-sm text-gray-300 mt-2">Last updated: 7 October 2026</p>
      </div>
    </section>

    <div className="max-w-4xl mx-auto px-4 md:px-8 py-14">

      <Section title="1. Who We Are">
        <p>
          Sree Svadista Prasada ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") is a South Indian food ordering
          and meal-subscription service run from a home kitchen in Milton Keynes, United Kingdom (Edinburgh and Glasgow are planned, not yet served).
        </p>
        <p>
          For the purposes of UK data-protection law, we are the <strong>Data Controller</strong>.
          Our contact details are:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Email: <a href="mailto:info@sreesvadistaprasada.com" className="underline" style={{ color: '#800020' }}>info@sreesvadistaprasada.com</a></li>
          <li>Phone: +44 73 0711 9962</li>
          <li>Website: <a href="https://sreesvadistaprasada.com" className="underline" style={{ color: '#800020' }}>sreesvadistaprasada.com</a></li>
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
              ['Technical', 'Browser type and an anonymous daily code made from your internet address (the address itself is not stored)', 'Security, rate limiting, counting visits'],
              ['Communications', 'Enquiry content, support messages', 'Responding to enquiries'],
              ['Marketing', 'Email address, and the date you ticked the box (opt-in only)', 'Offers and news you asked for'],
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
          We use an AI language model provided by <strong>Anthropic (Claude)</strong> for two internal jobs: helping our kitchen
          write menu descriptions, and, at most a few times a month, explaining a sharp change in our overall figures
          (for example "orders fell this week"). This AI tool:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Is used only for internal content and for reading <strong>totals</strong>, <strong>not for automated decisions about customers</strong>.</li>
          <li>Never receives names, email addresses, phone numbers, addresses, order contents or anything typed by a visitor, only aggregate counts.</li>
          <li>Is operated in compliance with the EU AI Act's requirements for general-purpose AI systems (GPAI) used in low-risk administrative contexts.</li>
          <li>Does not perform any profiling, automated decision-making, or high-risk AI processing as defined under the EU AI Act or UK GDPR Article 22.</li>
        </ul>
        <p>
          You have the right to be informed about any automated decision-making that significantly affects you. No such processing occurs on this platform.
        </p>
      </Section>

      <Section title="5. Cookies and Similar Storage">
        <p>We use a small number of cookies and browser storage:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Essential</strong> — to keep your basket, keep you signed in and remember your cookie choice. These are always on and need no consent.</li>
          <li><strong>Analytics</strong> — only if you choose "Accept all". We use Google Analytics (loaded through Google Tag Manager) to understand how the site is used. If you choose "Essential only", Google Analytics sets no cookies and receives only anonymous, cookieless signals.</li>
        </ul>
        <p>You can change your choice at any time by clearing this site&apos;s data in your browser; the banner will appear again.</p>
      </Section>

      <Section title="5a. Our Own Visit Record">
        <p>
          We keep our own count of visits to this site: which pages and dishes are viewed, which buttons are used, and which
          website or campaign link brought the visitor. This record does not contain your name, email address, phone number
          or postal address, and anything typed into our forms is not read. To tell that several pages were opened in the
          same visit, your internet address and browser type are used for a moment to make an anonymous code that changes
          every day; the address itself is not stored, and the code cannot be turned back into it or used to follow you from
          one day to the next. If you accept analytics cookies, an anonymous number is kept in your browser so that a return
          visit can be recognised; if you do not, nothing is stored on your device for this purpose. Visits are not linked to
          customer accounts. The record is deleted automatically after 400 days.
        </p>
      </Section>

      <Section title="5b. Messages We Send">
        <p>
          We send messages about your order or meal plan by email, WhatsApp or text message; these are part of the service.
          We send offers, news and reminders (such as a request for a review, or notice that your plan is about to end)
          <strong> only if you have ticked the &quot;email me offers&quot; box</strong> at sign-up, at checkout or in the Dabba Wala wizard,
          or joined our newsletter. Every such email has a one-tap unsubscribe link, you can reply STOP on WhatsApp, and you
          can change your choice in My Account at any time. We keep a record of the messages we send for 400 days.
        </p>
      </Section>

      <Section title="6. Data Sharing and Third Parties">
        <p>We share your data only where necessary:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>MongoDB Atlas (MongoDB, Inc.)</strong> — our cloud database provider, storing orders, accounts, and enquiries. Data is processed under a Data Processing Agreement.</li>
          <li><strong>Vercel</strong> — hosting our frontend application. No personal data is stored by Vercel beyond standard server logs.</li>
          <li><strong>Render</strong> — hosting our backend API. Standard server logs apply.</li>
          <li><strong>Stripe</strong> — takes card payments. Your card details go to Stripe directly and never touch our servers; we receive a payment reference and the amount.</li>
          <li><strong>Resend</strong> — sends our emails (order confirmations, replies, and offers you have asked for).</li>
          <li><strong>Twilio</strong> — sends WhatsApp and text messages about your order or plan.</li>
          <li><strong>Google (Firebase)</strong> — verifies your phone number with a one-time code when you create an account.</li>
          <li><strong>Google Tag Manager / Google Analytics</strong> — only if you accept analytics cookies (Section 5).</li>
          <li><strong>Google OAuth</strong> — optional login via Google. We receive only your name and email address; Google's privacy policy governs their processing.</li>
          <li><strong>Delivery and postcode services</strong> — we use <em>postcodes.io</em> (a public UK postcode API) and <em>getAddress.io</em> for address lookup. Your postcode is sent to these services only during checkout address lookup; they do not receive any other personal data.</li>
          <li><strong>Anthropic</strong> — as described in Section 4, for AI-assisted menu content only. No customer data is shared.</li>
        </ul>
        <p>We do not sell, rent, or trade your personal data to third parties for marketing purposes.</p>
      </Section>

      <Section title="7. International Transfers">
        <p>
          Some of our service providers (MongoDB Atlas, Vercel, Render, Stripe, Resend, Twilio, Google, Anthropic) may process data outside the UK and EEA.
          Where this occurs, we rely on adequacy decisions or standard contractual clauses (SCCs) approved by the UK ICO
          to ensure your data receives an equivalent level of protection.
        </p>
      </Section>

      <Section title="8. Data Retention">
        <p>We retain your personal data for the following periods:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Account data</strong> — until you ask us to delete your account.</li>
          <li><strong>Order and payment records</strong> — 6 years, as required for UK tax records, with your name and contact details removed if you delete your account.</li>
          <li><strong>Enquiries and support messages</strong> — 2 years from last correspondence.</li>
          <li><strong>Newsletter and offer preferences</strong> — until you unsubscribe or withdraw consent.</li>
          <li><strong>Message records and our own visit record</strong> — 400 days.</li>
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
          <Link href="/terms" className="underline" style={{ color: '#800020' }}>Terms of Service</Link>
          {' '}·{' '}
          <Link href="/contact" className="underline" style={{ color: '#800020' }}>Contact Us</Link>
        </p>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
