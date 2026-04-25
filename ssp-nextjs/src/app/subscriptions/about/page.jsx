import Link from 'next/link';

export const metadata = {
  title: 'How the Dabba Wala Works — Weekly South Indian Meal Subscription',
  description:
    'The Dabba Wala is the only weekly home-cooked South Indian meal subscription ' +
    'in Milton Keynes. Freshly made Andhra and Telugu food delivered daily — ' +
    'not frozen, not reheated. Real ghar ka khana.',
  alternates: { canonical: 'https://www.sreesvadistaprasada.com/subscriptions/about' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a Dabba Wala?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Dabba Wala is a meal delivery person who carries fresh home-cooked food in a dabba (tiffin box) to workers and homes. The tradition originates in Mumbai where Dabba Walas have delivered home-cooked lunches for over a century. Sree Svadista Prasada brings this tradition to Milton Keynes — delivering fresh Andhra and Telugu home cooking directly to your door.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is the Dabba Wala different from meal kit services?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Dabba Wala delivers fully cooked, freshly made food — not a kit to assemble. Unlike frozen or chilled ready meals, every dabba is cooked on the morning of delivery. No freezing, no reheating, no factory production. Real home cooking made fresh daily.',
      },
    },
    {
      '@type': 'Question',
      name: 'What areas does the Dabba Wala deliver to?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hot daily dabbas are delivered across all Milton Keynes postcodes MK1 to MK19, including Bletchley, Newport Pagnell, Central MK, Stony Stratford, Wolverton and Greenleys. Subscription deliveries also available to Edinburgh (Leith, Newington, Marchmont) and Glasgow (Pollokshields, Shawlands, Finnieston).',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I pause or cancel my subscription?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can pause or cancel your Dabba Wala subscription at any time. No lock-in, no cancellation fees.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Dabba Wala halal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. All meat in our Svadista and Mixed Dabbas is sourced from halal-certified suppliers.',
      },
    },
  ],
};

export default function SubscriptionsAboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        {/* Breadcrumb */}
        <nav className="text-sm mb-8" style={{ color: '#5C4B47' }}>
          <Link href="/subscriptions" className="hover:text-[#800020]">Dabba Wala subscription</Link>
          <span className="mx-2">→</span>
          <span>How it works</span>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          The Dabba Wala — How It Works
        </h1>
        <p className="text-lg mb-10" style={{ color: '#5C4B47' }}>
          Milton Keynes&apos; only weekly home-cooked South Indian meal subscription. Not frozen. Not reheated. Real ghar ka khana.
        </p>

        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          What is a Dabba Wala?
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          The Dabba Wala tradition originates in Mumbai, where for over a century a network of delivery workers carried fresh home-cooked lunches in dabba (tiffin) boxes from homes to offices across the city — with a precision that Harvard Business School studied. The dabba is not fast food. It is home food. Cooked that morning. Delivered hot.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Sree Svadista Prasada brings this tradition to Milton Keynes — delivering fresh Andhra and Telugu home cooking to your door, daily. Rice, dal, sabzi, curry, pickle, papad. A complete South Indian meal, made from scratch every morning.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Why Not a Ready Meal Service?
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Other Indian meal delivery services in the UK produce food in factories, freeze it, and ship it to you ready to microwave in three minutes. The food may be Indian in name — but it was cooked weeks ago, frozen at scale, and reheated in your kitchen. It is not home cooking. It is factory food.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Our Dabba is different. Every morning, our kitchen cooks fresh. The Gongura curry in your box was slow-cooked today. The dal was tempered this morning. The rice was cooked fresh. We do not freeze. We do not reheat. We cook and deliver. That is the difference between a meal delivery service and a real kitchen.
        </p>

        {/* Plans */}
        <h2 className="text-2xl font-bold mt-10 mb-5" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          The Three Dabbas
        </h2>
        <div className="grid gap-4 mb-10">
          {[
            {
              name: 'Prasada Dabba — Pure Vegetarian',
              desc: 'Dal, rice, two sabzis, sambar or rasam, pickle and papad. Sattvic, clean, wholesome. Sattvic Naivedyam versions available without onion or garlic on request.',
            },
            {
              name: 'Svadista Dabba — Non-Vegetarian',
              desc: 'Rice, chicken or mutton curry, pickle, omelette and papad. Halal-certified meat every time. Bold Andhra flavour, every day.',
            },
            {
              name: 'Mixed Dabba — Weekly Rotation',
              desc: 'A weekly rotation of Prasada and Svadista. Variety planned by our kitchen. The most popular plan for families.',
            },
          ].map(plan => (
            <div key={plan.name} className="rounded-lg p-5" style={{ border: '1px solid rgba(244,196,48,0.4)', backgroundColor: '#FDFBF7' }}>
              <h3 className="font-semibold mb-2" style={{ color: '#800020' }}>{plan.name}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5C4B47' }}>{plan.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-3 mb-10">
          {[
            ['What areas do you deliver to?', 'Hot daily dabbas across all MK postcodes MK1–MK19 including Wolverton, Stony Stratford, Greenleys, Newport Pagnell and Bletchley. Weekly subscription delivery also to Edinburgh (Leith, Newington, Marchmont) and Glasgow (Pollokshields, Shawlands, Finnieston).'],
            ['Can I pause or cancel?', 'Yes. Pause or cancel anytime. No lock-in, no fees.'],
            ['Is the food halal?', 'Yes. All meat in Svadista and Mixed Dabbas uses halal-certified suppliers.'],
            ['Can I customise my dabba?', 'Yes. Contact us on WhatsApp with any dietary requirements or preferences and we will plan accordingly.'],
            ['How is the dabba delivered?', 'Delivered hot in insulated packaging to your door. You do not need to be home — leave delivery instructions at checkout.'],
          ].map(([q, a]) => (
            <details key={q} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(244,196,48,0.4)' }}>
              <summary className="px-5 py-4 cursor-pointer font-medium flex justify-between items-center hover:bg-[#F4C430]/10" style={{ color: '#2D2422', listStyle: 'none' }}>
                {q}
                <span style={{ color: '#800020' }}>+</span>
              </summary>
              <p className="px-5 py-4 text-sm leading-relaxed" style={{ color: '#5C4B47', borderTop: '1px solid rgba(244,196,48,0.4)', backgroundColor: '#FDFBF7' }}>
                {a}
              </p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-4 flex-wrap">
          <Link href="/subscriptions">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#800020' }}>
              Subscribe now
            </button>
          </Link>
          <Link href="/milton-keynes">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold border transition-all hover:bg-[#800020]/5" style={{ borderColor: '#800020', color: '#800020' }}>
              Delivery areas
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
