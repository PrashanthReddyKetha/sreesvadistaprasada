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

const TermsAndServices = () => (
  <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
    {/* Hero */}
    <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" style={{ backgroundColor: '#800020' }}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-14">
        <p className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: '#F4C430' }}>Legal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Terms of Service
        </h1>
        <p className="text-sm text-gray-300 mt-2">Last updated: 11 April 2026</p>
      </div>
    </section>

    <div className="max-w-4xl mx-auto px-4 md:px-8 py-14">

      <p className="text-sm leading-relaxed mb-10 p-5 rounded-lg" style={{ color: '#5C4B47', backgroundColor: 'rgba(128,0,32,0.04)', border: '1px solid rgba(128,0,32,0.1)' }}>
        Please read these Terms of Service carefully before using our website or placing an order.
        By accessing <strong>sreesvadistaprasada.vercel.app</strong> or using our services, you agree to be bound by these terms.
        If you do not agree, please do not use our service.
      </p>

      <Section title="1. About Us">
        <p>
          Sree Svadista Prasada ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") is a South Indian
          food ordering and meal-subscription service operating in Milton Keynes, Edinburgh, and Glasgow, UK.
          Contact: <a href="mailto:info@sreesvadistaprasada.com" className="underline" style={{ color: '#800020' }}>info@sreesvadistaprasada.com</a> | +44 73 0711 9962.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least 18 years old and reside in a delivery area we serve to place an order.
          By using this service you confirm that you meet these requirements. We reserve the right to
          refuse service or cancel orders at our discretion.
        </p>
      </Section>

      <Section title="3. Orders and Contract">
        <p>
          When you place an order through our website, you are making an offer to purchase goods.
          A contract is formed only when we confirm your order by email or in-app notification.
          We reserve the right to decline orders (e.g. if items are unavailable or if we cannot
          deliver to your postcode).
        </p>
        <p>
          All prices are displayed in <strong>GBP (£)</strong> and include VAT where applicable.
          We reserve the right to amend prices at any time; changes will not affect orders already confirmed.
        </p>
        <p>
          Minimum order values and delivery charges (if any) are displayed at checkout before you complete your purchase.
          Free delivery is available on orders over <strong>£30</strong> within our delivery zones.
        </p>
      </Section>

      <Section title="4. Payment">
        <p>
          Payment is processed securely through our third-party payment provider. We do not store card details
          on our systems. By providing payment information, you confirm that you are authorised to use the
          payment method and that the billing details are accurate.
        </p>
        <p>
          Orders will not be processed until payment is confirmed. In the event of a payment failure,
          your order will not be placed.
        </p>
      </Section>

      <Section title="5. Delivery">
        <ul className="list-disc ml-5 space-y-1">
          <li>We deliver to selected postcodes in Milton Keynes, Edinburgh, and Glasgow. You can check delivery availability at checkout using our postcode checker.</li>
          <li>Delivery time estimates are provided in good faith but are not guaranteed. Delays may occur due to traffic, weather, or high demand.</li>
          <li>You must ensure someone is available to receive the delivery. If the delivery cannot be completed, we will attempt to contact you. We are not responsible for spoilage of food left unattended.</li>
          <li>Risk of damage or loss passes to you on delivery.</li>
        </ul>
      </Section>

      <Section title="6. Take Away">
        <p>
          Take away orders are available for collection from our kitchen. Collection time will be confirmed
          after you place the order. Please arrive at the confirmed time to ensure food quality.
        </p>
      </Section>

      <Section title="7. Cancellations and Refunds">
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Before preparation starts:</strong> You may cancel your order for a full refund by contacting us within 15 minutes of placing the order.</li>
          <li><strong>After preparation starts:</strong> We cannot accept cancellations once your order is being prepared. This is because food is prepared fresh to order.</li>
          <li><strong>Defective or incorrect items:</strong> If you receive an incorrect or unsatisfactory item, please contact us within 2 hours of delivery with a description and photograph. We will offer a replacement or full/partial refund at our discretion.</li>
          <li><strong>Allergies:</strong> We take allergen information seriously. However, our food is prepared in kitchens where allergens are present. If you have a severe allergy, please contact us before ordering. We cannot accept liability for allergic reactions where allergen information was provided at the time of ordering.</li>
        </ul>
        <p>
          Refunds are processed to the original payment method within 5–10 business days.
        </p>
      </Section>

      <Section title="8. Dabba Wala — Meal Subscription Service">
        <ul className="list-disc ml-5 space-y-1">
          <li>The Dabba Wala subscription is a recurring meal plan delivering home-cooked South Indian meals on your chosen schedule.</li>
          <li>Subscriptions are billed in advance (weekly or monthly) as selected at sign-up.</li>
          <li>You may <strong>pause or cancel</strong> your subscription at any time via your Dashboard with at least <strong>48 hours' notice</strong> before the next billing date. No refund is given for the current billing period already paid.</li>
          <li>We reserve the right to modify the subscription menu with reasonable notice. If we make substantial changes, you may cancel without penalty.</li>
          <li>Subscriptions are personal and non-transferable.</li>
        </ul>
      </Section>

      <Section title="9. Catering Services">
        <p>
          Corporate, event, and temple catering enquiries are handled separately from regular orders.
          A catering quote will be provided after submission of an enquiry form. A deposit may be required
          to confirm a catering booking. Full terms for catering engagements will be set out in a separate
          service agreement provided at the time of booking.
        </p>
      </Section>

      <Section title="10. AI-Generated Content">
        <p>
          Some menu descriptions and suggestions on this website may have been assisted or generated using
          an AI language model (Anthropic Claude). While we review and approve all content:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>AI-generated descriptions are for informational purposes only.</li>
          <li>Actual dishes may vary slightly from descriptions. Images are representative.</li>
          <li>No automated AI decision-making is used for pricing, order processing, or customer profiling.</li>
          <li>This use of AI complies with the EU AI Act classification for low-risk, non-decision-making AI applications.</li>
        </ul>
      </Section>

      <Section title="11. Intellectual Property">
        <p>
          All content on this website — including text, images, logos, and design — is owned by or licensed
          to Sree Svadista Prasada. You may not reproduce, distribute, or use our content for commercial
          purposes without our written permission. Our name and logo are protected and may not be used
          without express consent.
        </p>
      </Section>

      <Section title="12. User Accounts">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You must
          not share your account with others. We reserve the right to suspend or terminate accounts that
          violate these terms or engage in fraudulent activity. You are responsible for all activity
          carried out under your account.
        </p>
      </Section>

      <Section title="13. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Sree Svadista Prasada's total liability to you for any
          claim arising out of or in connection with these terms or our services shall not exceed the value
          of your most recent order. We are not liable for:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Indirect or consequential losses;</li>
          <li>Loss of profit or opportunity;</li>
          <li>Third-party website failures or service interruptions;</li>
          <li>Delays or failures resulting from events outside our reasonable control (force majeure).</li>
        </ul>
        <p>
          Nothing in these terms limits our liability for death or personal injury caused by our negligence,
          fraud or fraudulent misrepresentation, or any liability that cannot be excluded under UK law.
        </p>
      </Section>

      <Section title="14. Governing Law and Disputes">
        <p>
          These Terms of Service are governed by the laws of <strong>England and Wales</strong>.
          Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>
        <p>
          We encourage you to contact us first to resolve any dispute informally.
          If we cannot reach a resolution, you may use the UK's{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#800020' }}>
            Online Dispute Resolution (ODR) platform
          </a>{' '}
          or contact Citizens Advice for guidance.
        </p>
      </Section>

      <Section title="15. Changes to These Terms">
        <p>
          We may update these Terms from time to time. We will notify you of material changes by updating the
          "Last updated" date above. Your continued use of the service after any changes constitutes
          acceptance of the updated terms.
        </p>
      </Section>

      <div className="pt-6 border-t text-sm" style={{ borderColor: 'rgba(128,0,32,0.15)', color: '#A09890' }}>
        <p>
          See also:{' '}
          <Link href="/privacy-policy" className="underline" style={{ color: '#800020' }}>Privacy Policy</Link>
          {' '}·{' '}
          <Link href="/contact" className="underline" style={{ color: '#800020' }}>Contact Us</Link>
        </p>
      </div>
    </div>
  </div>
);

export default TermsAndServices;
