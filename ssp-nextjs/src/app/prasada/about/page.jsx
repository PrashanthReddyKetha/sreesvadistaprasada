import Link from 'next/link';

export const metadata = {
  title: 'About Prasada — Pure Vegetarian South Indian Food, Milton Keynes',
  description:
    'The story behind Prasada: Gongura Pappu, Gutti Vankaya, Punugulu, ' +
    'Naivedyam sacred rice and the full breadth of Andhra vegetarian cooking — ' +
    'freshly made and delivered across Milton Keynes. ' +
    'No other restaurant in MK offers these dishes.',
  alternates: { canonical: 'https://www.sreesvadistaprasada.com/prasada/about' },
};

export default function PrasadaAboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        {/* Breadcrumb */}
        <nav className="text-sm mb-8" style={{ color: '#5C4B47' }}>
          <Link href="/prasada" className="hover:text-[#800020]">Prasada menu</Link>
          <span className="mx-2">→</span>
          <span>About</span>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Prasada — Pure Vegetarian South Indian Food
        </h1>
        <p className="text-lg mb-10" style={{ color: '#5C4B47' }}>
          Freshly made Andhra vegetarian cooking. Delivered across Milton Keynes.
        </p>

        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          What is Prasada?
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Prasada is our pure vegetarian menu — and in South Indian and Hindu tradition, prasada means sacred food: an offering made with devotion and received with gratitude. That is the spirit in which this menu was built. Pure, honest, made without shortcuts. No meat, no compromise. Just the full breadth of Andhra vegetarian cooking, freshly made and delivered across Milton Keynes every day.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Dishes Unavailable Anywhere Else in Milton Keynes
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Prasada carries dishes that no other restaurant in Milton Keynes offers. Our <strong>Gongura Pappu</strong> is toor dal slow-cooked with sorrel leaves — the tangy, earthy dal that every Andhra household makes on Sundays. Our <strong>Gutti Vankaya Masala</strong> stuffs small brinjals with a hand-ground paste of peanuts, sesame and coconut — braised until the brinjals are completely tender and the stuffing has seeped through. One of the great dishes of Andhra cuisine. Order it once and it becomes the reason you come back.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          <strong>Punugulu</strong> — crispy fermented rice and lentil fritters, the street snack of coastal Andhra — are made from the same live batter as our dosas. <strong>Bhindi Pulusu</strong> cooks okra in a thick tamarind base without a trace of sliminess. <strong>Perugu Pulusu</strong> is a yogurt-based curry that has no real equivalent in any other regional Indian cuisine. <strong>Mulakkada Tomato Curry</strong> uses drumstick (moringa) — the vegetable that the English-speaking world has barely discovered. <strong>Ghee Pappu Avakaya Rice</strong> — dal, Andhra mango pickle and ghee mixed through hot rice — is one of the most famous simple meals of Andhra cuisine. None of these dishes appear on any other menu in Milton Keynes.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Naivedyam — Sacred Temple Food
        </h2>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          Prasada carries a dedicated Naivedyam section: sacred offerings prepared without onion or garlic in the full sattvic tradition. Prasadam Pulihora — temple-style tamarind rice, prepared exactly as it would be offered at a temple. Chekara Pongal — sweet Pongal with jaggery, ghee and cashews, offered at temples across Andhra and Telangana during festivals. Coconut Rice, Lemon Rice, Pongal. These are dishes cooked for gods before they reach the table.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: '#2D2422' }}>
          If you need Naivedyam for a pooja, temple function or religious event in Milton Keynes — catered, hot and prepared correctly — we are the only kitchen in MK that does this. No other caterer offers authentic Andhra Naivedyam.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          Freshly Made — Not Frozen, Not Reheated
        </h2>
        <p className="leading-relaxed mb-10" style={{ color: '#2D2422' }}>
          Every dish on the Prasada menu is made fresh to order. The sambar is slow-cooked with house-made sambar powder. The rasam is freshly tempered. The dosa batter is live and fermented overnight. The dal is cooked from scratch. This is pure South Indian food delivered the way it should be — not reheated, not a ready meal. Real cooking, real flavour, delivered to Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley and all of Milton Keynes.
        </p>

        {/* CTA */}
        <div className="flex gap-4 flex-wrap">
          <Link href="/prasada">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#800020' }}>
              View Prasada menu
            </button>
          </Link>
          <Link href="/catering">
            <button className="px-7 py-3 rounded-sm text-sm font-semibold border transition-all hover:bg-[#800020]/5" style={{ borderColor: '#800020', color: '#800020' }}>
              Naivedyam catering enquiry
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
