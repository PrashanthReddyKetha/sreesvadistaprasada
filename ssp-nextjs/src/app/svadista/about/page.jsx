import Link from 'next/link';

export const metadata = {
  title: 'About Svadista — Halal Non-Veg South Indian Food, Milton Keynes',
  description:
    'The story behind Svadista: Gongura Chicken, Gongura Mutton, Whole Grilled Chicken, ' +
    'halal-certified Andhra and Telugu non-vegetarian cooking freshly made and ' +
    'delivered across Milton Keynes. The only Gongura kitchen in MK.',
  alternates: { canonical: 'https://www.sreesvadistaprasada.com/svadista/about' },
};

export default function SvadistaAboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        {/* Breadcrumb */}
        <nav className="text-sm mb-8" style={{ color: '#5C4B47' }}>
          <Link href="/svadista" className="hover:text-[#800020]">Svadista menu</Link>
          <span className="mx-2">→</span>
          <span>About</span>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Svadista — Halal Non-Vegetarian South Indian Food
        </h1>
        <p className="text-lg mb-10" style={{ color: '#5C4B47' }}>
          Freshly made daily. Halal-certified. Delivered across Milton Keynes.
        </p>

        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Halal-Certified South Indian Food in Milton Keynes
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          All meat served at Sree Svadista Prasada is sourced from halal-certified suppliers. Svadista is the only halal Andhra and Telugu non-vegetarian kitchen in Milton Keynes — offering authentic South Indian food with full halal certification. Every dish. Every day. No exceptions.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Gongura — The Ingredient That Defines Andhra
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Gongura is the sorrel leaf. In Telugu, the word for it is gongura. In Andhra Pradesh, it is the defining ingredient of an entire cuisine — used in pickles, dal, curries and chutneys. It has a natural tartness that no other ingredient replicates. It tenderises meat as it cooks. It transforms a standard chicken curry into something completely distinctive.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Our <strong>Gongura Chicken Curry</strong> slow-cooks chicken with fresh sorrel leaves and Andhra spices for over an hour — until the tang of the gongura and the richness of the chicken become a single, indivisible flavour. Our <strong>Gongura Mutton</strong> braises mutton in the same way, for even longer. The result is a dish from the Krishna delta of coastal Andhra that the Telugu diaspora in the UK has been making at home because no restaurant was offering it. In Milton Keynes, we are the only kitchen making and delivering genuine Gongura food.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Dishes Unavailable at Any Other MK Restaurant
        </h2>
        <p className="leading-relaxed mb-5" style={{ color: '#2D2422' }}>
          Beyond Gongura, Svadista carries the dishes that define Telugu non-vegetarian cooking and appear on no other delivery menu in Milton Keynes:
        </p>
        <div className="space-y-4 mb-8">
          {[
            ['Whole Grilled Chicken', 'A whole bird marinated overnight in Andhra spices and slow-grilled until the skin is charred and the meat falls from the bone. The showstopper of our menu.'],
            ['Chicken Ghee Roast', 'Chicken lacquered in a dark, tamarind-and-ghee masala — concentrated, deeply spiced, the dish regulars reorder every time.'],
            ['Liver Fry', 'Chicken liver with curry leaves and Andhra spices — earthy, rich, unapologetic. Not on any other MK menu.'],
            ['Fish Pulusu', 'Fish in a coastal Andhra tamarind gravy — the only Fish Pulusu available for delivery in Milton Keynes.'],
            ['Prawns Iguru', 'Prawns in a thick, dry Andhra masala — intense, concentrated, the prawn curry for serious eaters.'],
            ['Prawns Ghee Roast', 'Prawns in the Ghee Roast masala — sweet from the prawn, fierce from the spice. Distinctive.'],
          ].map(([name, desc]) => (
            <div key={name} className="flex gap-3">
              <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: '#F4C430' }}>→</span>
              <p style={{ color: '#2D2422' }}>
                <strong>{name}</strong> — {desc}
              </p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Freshly Made. Not Frozen. Not Reheated.
        </h2>
        <p className="leading-relaxed mb-10" style={{ color: '#2D2422' }}>
          Every dish on the Svadista menu is cooked fresh to order. The curries are slow-cooked from scratch. The biryanis are layered and cooked on dum. The starters are fried to order. This is authentic South Indian food delivered hot — not a ready meal, not a frozen product, not reheated. Real cooking, freshly made, delivered across Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley and all of Milton Keynes.
        </p>

        {/* CTA */}
        <div className="flex gap-4 flex-wrap">
          <Link href="/svadista">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#800020' }}>
              View Svadista menu
            </button>
          </Link>
          <Link href="/milton-keynes">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold border transition-all hover:bg-[#800020]/5" style={{ borderColor: '#800020', color: '#800020' }}>
              Delivery areas in MK
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
