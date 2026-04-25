import Link from 'next/link';

export const metadata = {
  title: 'What is Ragi Sangati? — The Only Ragi Delivery in the UK',
  description:
    'Ragi Sangati is the soul food of Andhra Pradesh — finger millet cooked into ' +
    'a wholesome ball, served with curries, pappu and pulusu. ' +
    'Sree Svadista Prasada is the only place in the UK where you can order ' +
    'Ragi Sangati for delivery. Freshly made in Milton Keynes.',
  alternates: { canonical: 'https://www.sreesvadistaprasada.com/ragi-specials/about' },
};

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
          'Sree Svadista Prasada in Milton Keynes is the only restaurant in the ' +
          'UK currently offering Ragi Sangati for delivery. Order online at ' +
          'sreesvadistaprasada.com for delivery across all Milton Keynes postcodes.',
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
          'protein. It has a low glycaemic index, making it suitable for those ' +
          'managing blood sugar. It has been a staple food in Andhra Pradesh ' +
          'and Karnataka for centuries.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Ragi Sangati served with?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'In Andhra tradition, Ragi Sangati is served with Kodi Kura (chicken curry), ' +
          'Mutton Curry, or Pappu (toor dal) and Pachi Pulusu (raw tamarind sauce). ' +
          'At Sree Svadista Prasada we offer all three combinations.',
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
          The traditional Andhra superfood — and the only Ragi Sangati delivery in the United Kingdom.
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
          Ragi Sangati is finger millet flour cooked in water until it forms a soft, dense, smooth ball — earthy in flavour, heavy with nutrition, and completely satisfying in a way that lighter food is not. It is the evening meal of coastal Andhra villages. In Rayalaseema, it is comfort. For the Telugu diaspora in the UK, it is memory made edible — the taste of a grandmother&apos;s kitchen, of a village in Andhra Pradesh, of a childhood that no London restaurant has ever tried to recreate.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          It is served alongside curries, pappu and pulusu — not as a side dish but as the centrepiece of the meal. You take a piece of the Sangati, dip it into the curry or dal, and eat it in one go. There is a rhythm to eating it. Once you understand the rhythm, you understand why Andhra swears by it.
        </p>

        {/* Section 3 */}
        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          The Only Ragi Sangati Delivery in the UK
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Search for Ragi Sangati delivery in the UK and you will find results from Hyderabad on Zomato and Swiggy. Nothing from a UK restaurant. Nothing from a UK delivery service. Sree Svadista Prasada in Milton Keynes is the only place in the United Kingdom where you can order Ragi Sangati for delivery. Freshly made every day — not frozen, not reheated. Made from finger millet cooked the Andhra way, paired with slow-cooked curries made from scratch.
        </p>

        {/* Menu */}
        <h2 className="text-2xl font-bold mt-10 mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Our Ragi Menu
        </h2>
        <div className="space-y-4 mb-8">
          {[
            { name: 'Ragi Sangati with Chicken Curry', price: '£9.99', desc: 'Fresh Ragi Sangati with slow-cooked Andhra Kodi Kura (country chicken curry). The traditional coastal Andhra meal.' },
            { name: 'Ragi Sangati with Mutton Curry', price: '£10.99', desc: 'Ragi Sangati with slow-braised mutton curry. The richer, more indulgent version. The mutton is cooked long — the extra time shows.' },
            { name: 'Ragi Sangati with Pappu and Pachi Pulusu', price: '£7.99', desc: 'The traditional vegetarian way — with toor dal (pappu) and raw tamarind sauce (pachi pulusu). Simple, clean, entirely authentic.' },
            { name: 'Ragi Jaava / Malt', price: '£6.99', desc: 'A warm finger millet drink — lightly sweetened, high in calcium and iron. An Andhra morning ritual for generations.' },
            { name: 'Ragi Butter Milk', price: '£5.99', desc: 'Fermented buttermilk with cooked Ragi, ginger and cumin. Cooling, probiotic, the drink of the Rayalaseema countryside.' },
          ].map(item => (
            <div key={item.name} className="rounded-lg p-5" style={{ border: '1px solid rgba(244,196,48,0.4)', backgroundColor: '#FDFBF7' }}>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold" style={{ color: '#800020' }}>{item.name}</h3>
                <span className="font-medium flex-shrink-0 ml-4" style={{ color: '#5C4B47' }}>{item.price}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#5C4B47' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-bold mt-10 mb-5" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-3 mb-10">
          {[
            ['Is Ragi Sangati gluten-free?', 'Yes. Finger millet is naturally gluten-free. Ragi Sangati contains no wheat, barley or rye.'],
            ['Is Ragi Sangati healthy?', 'Finger millet is one of the most nutritious grains available — high in calcium, iron and fibre, low on the glycaemic index. It has been a dietary staple in Andhra Pradesh for over four thousand years.'],
            ['What does Ragi Sangati taste like?', 'Earthy, slightly nutty, with a density that lighter grains do not have. It is not a strong flavour on its own — the character comes from the curries and dal it is served with. The combination is greater than either alone.'],
            ['Can I add Ragi Sangati to my Dabba Wala subscription?', 'Yes. Add Ragi Sangati to any weekly or monthly Dabba Wala plan. Contact us via WhatsApp or the ordering app to customise your subscription.'],
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
              Add to Dabba Wala
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
