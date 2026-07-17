import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Star, ChevronRight } from 'lucide-react';

const DISHES = [
  { name: 'Masala Dosa', desc: 'Crispy fermented rice crepe with spiced potato filling', link: '/breakfast' },
  { name: 'Chicken Biryani', desc: 'Slow-cooked dum biryani with fragrant Basmati rice', link: '/svadista' },
  { name: 'Gongura Mutton', desc: 'Tender mutton in Andhra sorrel leaf gravy', link: '/svadista' },
  { name: 'Mango Avakaya', desc: 'Handmade Andhra raw mango pickle — ship to Edinburgh', link: '/snacks' },
  { name: 'Paneer Butter Masala', desc: 'Creamy tomato paneer curry from pure veg kitchen', link: '/prasada' },
  { name: 'Dabba Wala Tiffin', desc: 'Weekly home-cooked meal subscription delivered to you', link: '/subscriptions' },
];

const C = {
  primary: '#800020',
  cream: '#FDFBF7',
  gold: '#F4C430',
  surface: '#FDF8F3',
  muted: '#9C7B62',
  dark: '#2C1810',
};

export default function Edinburgh() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
      <Helmet>
        <title>South Indian Food Edinburgh | Dosa, Biryani &amp; Tiffin Delivery | Sree Svadista Prasada</title>
        <meta name="description" content="Order authentic South Indian food in Edinburgh. Sree Svadista Prasada delivers Andhra curries, dosas, biryanis, and weekly tiffin subscriptions. Real home-style cooking from Milton Keynes." />
        <meta name="keywords" content="South Indian food Edinburgh, Indian takeaway Edinburgh, dosa Edinburgh, biryani delivery Edinburgh, authentic Indian food Edinburgh, South Indian restaurant near Edinburgh, Andhra food Edinburgh, tiffin service Edinburgh, Indian meal subscription Edinburgh, best Indian food Edinburgh" />
        <link rel="canonical" href="https://sreesvadistaprasada.com/edinburgh" />
        <meta property="og:title" content="South Indian Food Edinburgh | Dosa &amp; Biryani Delivery" />
        <meta property="og:description" content="Order authentic South Indian food delivered to Edinburgh. Andhra curries, masala dosa, biryani and weekly tiffin subscriptions from Sree Svadista Prasada." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sreesvadistaprasada.com/edinburgh" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" />
        <meta property="og:site_name" content="Sree Svadista Prasada" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="South Indian Food Edinburgh | Dosa &amp; Biryani Delivery" />
        <meta name="twitter:description" content="Order authentic South Indian food delivered to Edinburgh. Andhra curries, masala dosa, biryani and weekly tiffin subscriptions from Sree Svadista Prasada." />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Sree Svadista Prasada — Edinburgh Delivery",
          "description": "Authentic South Indian food delivery serving Edinburgh. Andhra curries, dosas, biryanis, Andhra pickles and weekly tiffin subscriptions.",
          "url": "https://sreesvadistaprasada.com/edinburgh",
          "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80",
          "areaServed": [{"@type": "City", "name": "Edinburgh"}, {"@type": "State", "name": "Scotland"}],
          "servesCuisine": ["South Indian", "Indian", "Andhra", "Vegetarian", "Vegan"],
          "hasMap": "https://maps.google.com/?q=Edinburgh,Scotland",
          "sameAs": ["https://sreesvadistaprasada.com"],
          "parentOrganization": {
            "@type": "Restaurant",
            "name": "Sree Svadista Prasada",
            "url": "https://sreesvadistaprasada.com",
            "address": {"@type": "PostalAddress", "addressLocality": "Milton Keynes", "addressCountry": "GB"}
          }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {"@type": "ListItem", position: 1, name: "Home", item: "https://sreesvadistaprasada.com"},
            {"@type": "ListItem", position: 2, name: "Edinburgh", item: "https://sreesvadistaprasada.com/edinburgh"}
          ]
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(55vh, 460px)' }}>
        <img
          src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1280"
          srcSet="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?crop=entropy&cs=srgb&fm=jpg&q=85&w=640 640w, https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1280 1280w"
          sizes="100vw"
          alt="Authentic South Indian food delivery Edinburgh — Sree Svadista Prasada"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.93) 0%, rgba(128,0,32,0.75) 50%, rgba(128,0,32,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-yellow-300" />
              <span className="text-xs uppercase tracking-[0.25em] font-medium" style={{ color: 'rgba(244,196,48,0.85)' }}>Edinburgh</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Authentic South Indian Food in Edinburgh
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Real home-style Andhra cooking — dosas, biryanis, slow-cooked curries, and weekly tiffin subscriptions delivered to Edinburgh.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/subscriptions" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded" style={{ backgroundColor: C.gold, color: C.primary }}>
                Start Tiffin Subscription
              </Link>
              <Link to="/menu" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded border-2" style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>
                Browse Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why SSP Edinburgh */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            South Indian Food You Can Trust, Delivered to Edinburgh
          </h2>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
            Edinburgh has a thriving South Asian community — but authentic Andhra and Telugu cooking is rare to find. Sree Svadista Prasada bridges that gap with real home-style food made from scratch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🫙',
              title: 'Pickles & Snacks Delivered Nationwide',
              desc: 'Our handmade Andhra pickles — Mango Avakaya, Gongura Pickle, and Nalla Karam — ship across the UK including Edinburgh. No preservatives, no shortcuts.',
            },
            {
              icon: '📦',
              title: 'Weekly Tiffin Subscription',
              desc: 'Subscribe to our Dabba Wala meal plan. Freshly cooked South Indian meals — veg Prasada box or non-veg Svadista box — delivered to your door Monday to Friday.',
            },
            {
              icon: '🍛',
              title: 'Two Kitchens. Zero Compromise.',
              desc: 'Our Prasada kitchen is 100% vegetarian. Our Svadista kitchen prepares bold non-veg Andhra dishes. Your dietary preferences are taken seriously.',
            },
          ].map(item => (
            <div key={item.title} className="rounded-2xl p-6" style={{ backgroundColor: C.surface, border: '0.5px solid rgba(128,0,32,0.1)' }}>
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular dishes */}
      <section className="py-14 px-4 md:px-8" style={{ backgroundColor: C.surface }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Most Ordered South Indian Dishes
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: C.muted }}>Popular with our Edinburgh customers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DISHES.map(dish => (
              <Link
                key={dish.name}
                to={dish.link}
                className="flex items-start gap-4 rounded-xl p-4 transition-all hover:shadow-md"
                style={{ backgroundColor: C.cream, border: '0.5px solid rgba(128,0,32,0.12)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>{dish.name}</p>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{dish.desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: C.primary, flexShrink: 0, marginTop: 2 }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Edinburgh SEO content */}
      <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="prose prose-sm max-w-none" style={{ color: C.muted }}>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Finding Authentic South Indian Food in Edinburgh
          </h2>
          <p className="leading-relaxed mb-4">
            Edinburgh is home to a large and growing South Asian community. From the Southside to Leith, food lovers in Edinburgh are searching for the real thing — not generic "Indian curry house" food, but authentic Telugu and Andhra home cooking. That's exactly what Sree Svadista Prasada offers.
          </p>
          <p className="leading-relaxed mb-4">
            We specialise in South Indian food that most Edinburgh restaurants simply don't serve: <strong>Gongura Chicken Curry</strong>, <strong>Gutti Vankaya Masala</strong>, <strong>Pulihora</strong>, and slow-cooked <strong>Andhra Mutton Curry</strong>. These are dishes rooted in Andhra Pradesh and Telangana — and we make them the way they're made at home.
          </p>
          <h3 className="text-xl font-bold mt-8 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Dosa Delivery Edinburgh
          </h3>
          <p className="leading-relaxed mb-4">
            Searching for dosa delivery in Edinburgh? Our breakfast menu features crispy <strong>Masala Dosa</strong>, buttery <strong>Ghee Dosa</strong>, and soft <strong>Rava Dosa</strong>. Each dosa is freshly made — thin, lacy, and fermented for the right texture. Served with our homemade coconut chutney and piping-hot sambar.
          </p>
          <h3 className="text-xl font-bold mt-8 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Andhra Pickles Posted to Edinburgh
          </h3>
          <p className="leading-relaxed mb-4">
            Our handmade Andhra pickles are available to order online with UK-wide delivery, including Edinburgh. <strong>Mango Avakaya</strong> (raw mango pickle), <strong>Gongura Pickle</strong> (sorrel leaf), and six varieties of traditional <strong>podis</strong> (spiced powders) — made in small batches without artificial preservatives.
          </p>
          <h3 className="text-xl font-bold mt-8 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Indian Tiffin Service Delivered to Edinburgh
          </h3>
          <p className="leading-relaxed">
            Our <strong>Dabba Wala tiffin subscription</strong> is available to Edinburgh residents. Choose from the <strong>Svadista Box</strong> (non-veg Andhra meals) or the <strong>Prasada Box</strong> (100% pure vegetarian). Weekly (5 meals) or monthly (20 meals) plans. Fresh, hot, and home-cooked every weekday.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center" style={{ backgroundColor: C.primary }}>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Ready to Order South Indian Food in Edinburgh?
        </h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Browse our full menu or start your weekly tiffin subscription today.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/subscriptions" className="px-8 py-3.5 text-sm font-bold rounded" style={{ backgroundColor: C.gold, color: C.primary }}>
            Start Tiffin Subscription
          </Link>
          <Link to="/snacks" className="px-8 py-3.5 text-sm font-bold rounded border-2" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
            Order Andhra Pickles
          </Link>
        </div>
      </section>
    </div>
  );
}
