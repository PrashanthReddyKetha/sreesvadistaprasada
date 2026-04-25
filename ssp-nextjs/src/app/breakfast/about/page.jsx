import Link from 'next/link';

export const metadata = {
  title: 'About Our South Indian Breakfast — Dosas, Idli & Andhra Tiffins, Milton Keynes',
  description:
    'The story behind our South Indian breakfast: crispy dosas with fermented batter, ' +
    'Nellore Ghee Karam Dosa, Uggani and Andhra tiffin classics ' +
    'unavailable anywhere else in Milton Keynes. Freshly made daily.',
  alternates: { canonical: 'https://www.sreesvadistaprasada.com/breakfast/about' },
};

export default function BreakfastAboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        {/* Breadcrumb */}
        <nav className="text-sm mb-8" style={{ color: '#5C4B47' }}>
          <Link href="/breakfast" className="hover:text-[#800020]">Breakfast menu</Link>
          <span className="mx-2">→</span>
          <span>About</span>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          South Indian Breakfast — The Way It Should Be
        </h1>
        <p className="text-lg mb-10" style={{ color: '#5C4B47' }}>
          Freshly made daily. Delivered across Milton Keynes. Andhra breakfast classics you won&apos;t find anywhere else in MK.
        </p>

        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          The Dosa
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          A properly made dosa begins the night before. The batter — ground from par-boiled rice and urad dal — ferments overnight in a warm kitchen, developing a live culture that gives the dosa its faint sourness and its lightness. The next morning, the batter is spread across a hot iron tawa with a practiced hand: thin enough at the edges to crackle, thicker in the centre to stay yielding. The result is a crepe that no pan coating and no batter powder can replicate.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          We make ten varieties. The most distinctive is the <strong>Nellore Ghee Karam Dosa</strong> — a specialty of Nellore, the coastal Andhra town known for the heat of its food. The dosa is spread with a hand-ground karam paste of dried red chilli, garlic and tamarind, then finished with ghee that sizzles as it hits the tawa. Bold, aromatic, building heat. The only Nellore Karam Dosa available for delivery in Milton Keynes.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Uggani — The Andhra Street Breakfast
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Uggani is puffed rice tossed in a hot wok with diced onion, green chilli, curry leaves, peanuts and groundnut oil — the street breakfast of coastal Andhra that has fed working people since before any restaurant thought to put it on a menu. Crunchy, savoury, fast and deeply satisfying. The only Uggani on any delivery menu in Milton Keynes.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Idli, Vada and the Art of Fermentation
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Idli — soft, steamed, cloudlike — is made from the same fermented batter as the dosa. The fermentation is what makes it: the sourness, the lightness, the way it absorbs sambar from beneath and softens into the broth. Our vadas are fried from a thick urad dal batter until the exterior is golden and the interior stays tender. Served with our house sambar — slow-cooked, built from scratch with house-made sambar powder — and two fresh chutneys.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Freshly Made. Every Morning.
        </h2>
        <p className="leading-relaxed mb-10" style={{ color: '#2D2422' }}>
          Everything on our breakfast menu is made fresh every day. The batter is live. The sambar is cooked from scratch. The chutneys are freshly ground. This is not reheated breakfast food. It is South Indian morning food made the right way, delivered hot across Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley and all of Milton Keynes.
        </p>

        {/* CTA */}
        <div className="flex gap-4 flex-wrap">
          <Link href="/breakfast">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#800020' }}>
              View breakfast menu
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
