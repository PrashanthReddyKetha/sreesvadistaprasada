import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import Link from 'next/link';

export const metadata = pageMeta('/ragi-specials/about');

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Ragi Sangati?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Ragi Sangati is a traditional South Indian dish from Andhra Pradesh ' +
          'and Telangana, made from finger millet (ragi). The millet flour is ' +
          'cooked in water until it forms a soft, dense ball, then served alongside ' +
          'curries, dal (pappu) and pulusu. It is high in calcium, iron, fibre and ' +
          'is naturally gluten-free.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I order Ragi Sangati in the UK?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Sree Svadista Prasada in Milton Keynes cooks Ragi Sangati fresh to order. ' +
          'Order online at sreesvadistaprasada.com for delivery across Milton Keynes ' +
          'or collection from our Greenleys kitchen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Ragi Sangati healthy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes. Finger millet (ragi) is one of the most nutritious grains available. ' +
          'It is naturally gluten-free, high in calcium, iron, dietary fibre and ' +
          'protein, with a low glycaemic index. It has been a staple food in ' +
          'Andhra Pradesh and Karnataka for centuries.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Ragi Sangati served with?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'In Andhra tradition, Ragi Sangati is served with Kodi Kura (chicken curry), ' +
          'or Pappu (toor dal) and Pachi Pulusu (raw tamarind sauce). ' +
          'At Sree Svadista Prasada we serve it both ways.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Ragi Malt or Ragi Jaava?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Ragi Malt (also called Ragi Jaava) is a warm drink made from finger millet ' +
          'flour cooked in water or milk and lightly sweetened. It is a traditional ' +
          'Andhra morning drink — high in calcium and iron, with a low glycaemic index.',
      },
    },
  ],
};

export default function RagiAboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        {/* Breadcrumb */}
        <nav className="text-sm mb-8" style={{ color: '#5C4B47' }}>
          <Link href="/ragi-specials" className="hover:text-[#800020]">Ragi Specials menu</Link>
          <span className="mx-2">→</span>
          <span>About</span>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          What is Ragi Sangati?
        </h1>
        <p className="text-lg mb-10" style={{ color: '#5C4B47' }}>
          The traditional Andhra finger millet meal — cooked fresh in our Milton Keynes kitchen.
        </p>

        {/* Section 1 */}
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          The Grain That Andhra Lives By
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Ragi — finger millet — has been grown in the Deccan Plateau for over four thousand years. In Andhra Pradesh and Telangana, it is not a trend or a health food movement. It is the everyday grain of the countryside: drought-resistant, densely nutritious, deeply rooted in the culture of the region. Naturally gluten-free, high in calcium, iron, dietary fibre and protein, with a low glycaemic index that makes it one of the most nutritionally complete grains available anywhere in the world.
        </p>

        {/* Section 2 */}
        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          What is Ragi Sangati?
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Ragi Sangati is finger millet flour cooked in water until it forms a soft, dense, smooth ball — the finger millet ball known across the border in Karnataka as ragi mudde — earthy in flavour, heavy with nutrition, and completely satisfying in a way that lighter food is not. It is the evening meal of coastal Andhra villages. In Rayalaseema, it is comfort. For the Telugu diaspora in the UK, it is memory made edible — the taste of a grandmother&apos;s kitchen, of a village in Andhra Pradesh, of a childhood that no London restaurant has ever tried to recreate.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          It is served alongside curries, pappu and pulusu — not as a side dish but as the centrepiece of the meal. You take a piece of the Sangati, dip it into the curry or dal, and eat it in one go. There is a rhythm to eating it. Once you understand the rhythm, you understand why Andhra swears by it.
        </p>

        {/* Section 3 */}
        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Ragi Sangati in Milton Keynes
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Andhra ragi food is hard to find on a menu in Britain. We make Ragi Sangati in our Greenleys kitchen in Milton Keynes — freshly made, not frozen, not reheated. Finger millet cooked the Andhra way, paired with slow-cooked curries made from scratch. Order it online for delivery across Milton Keynes or collection.
        </p>

        {/* Menu */}
        <h2 className="text-2xl font-bold mt-10 mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Our Ragi Menu
        </h2>
        <div className="space-y-4 mb-8">
          {[
            { name: 'Ragi Sangati with Chicken Curry', desc: 'Fresh Ragi Sangati with slow-cooked Andhra Kodi Kura (chicken curry). The traditional Andhra meal.' },
            { name: 'Ragi Sangati with Pappu and Pachi Pulusu', desc: 'The traditional vegetarian way — with toor dal (pappu) and raw tamarind sauce (pachi pulusu). Simple, clean, entirely authentic.' },
            { name: 'Ragi Jaava / Malt', desc: 'A warm finger millet drink (ragi malt) — lightly sweetened. An Andhra morning ritual for generations.' },
            { name: 'Ragi Butter Milk', desc: 'Buttermilk with cooked ragi, ginger and cumin. Cooling — the drink of the Rayalaseema countryside.' },
          ].map(item => (
            <div key={item.name} className="rounded-lg p-5" style={{ border: '1px solid rgba(244,196,48,0.4)', backgroundColor: '#FDFBF7' }}>
              <h3 className="font-semibold mb-1" style={{ color: '#800020' }}>{item.name}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5C4B47' }}>{item.desc}</p>
            </div>
          ))}
          <p className="text-sm" style={{ color: '#5C4B47' }}>
            Today&apos;s prices and availability are on the <Link href="/ragi-specials" className="underline hover:text-[#800020]">Ragi Specials menu</Link>.
          </p>
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-bold mt-10 mb-5" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-3 mb-10">
          {[
            ['Is Ragi Sangati gluten-free?', 'Finger millet is naturally gluten-free, and Ragi Sangati itself is made without wheat, barley or rye. Our kitchen also cooks with wheat, so if you need to avoid gluten strictly, please tell us before you order.'],
            ['Is Ragi Sangati healthy?', 'Finger millet is one of the most nutritious grains available — high in calcium, iron and fibre, low on the glycaemic index. It has been a dietary staple in Andhra Pradesh for over four thousand years.'],
            ['What does Ragi Sangati taste like?', 'Earthy, slightly nutty, with a density that lighter grains do not have. It is not a strong flavour on its own — the character comes from the curries and dal it is served with. The combination is greater than either alone.'],
            ['Can I have Ragi Sangati with my Dabba Wala plan?', 'Message us on WhatsApp with your plan and we will tell you what we can do.'],
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
          <Link href="/ragi-specials">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#800020' }}>
              Order Ragi Sangati
            </button>
          </Link>
          <Link href="/subscriptions">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold border transition-all hover:bg-[#800020]/5" style={{ borderColor: '#800020', color: '#800020' }}>
              See Dabba Wala plans
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
