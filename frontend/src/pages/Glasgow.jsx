import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';

const DISHES = [
  { name: 'Masala Dosa', desc: 'Crispy fermented rice crepe with spiced potato filling', link: '/breakfast' },
  { name: 'Gongura Chicken Curry', desc: 'Signature Andhra sorrel leaf chicken curry', link: '/svadista' },
  { name: 'Chicken 65', desc: 'Spicy deep-fried chicken — a South Indian classic', link: '/svadista' },
  { name: 'Mango Avakaya', desc: 'Handmade Andhra raw mango pickle — ship to Glasgow', link: '/snacks' },
  { name: 'Gutti Vankaya Masala', desc: 'Stuffed brinjal in rich Andhra masala', link: '/prasada' },
  { name: 'Dabba Wala Tiffin', desc: 'Weekly home-cooked South Indian meal subscription', link: '/subscriptions' },
];

const C = {
  primary: '#800020',
  cream: '#FDFBF7',
  gold: '#F4C430',
  surface: '#FDF8F3',
  muted: '#9C7B62',
  dark: '#2C1810',
};

export default function Glasgow() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
      <Helmet>
        <title>South Indian Food Glasgow | Dosa, Biryani &amp; Tiffin Delivery | Sree Svadista Prasada</title>
        <meta name="description" content="Order authentic South Indian food in Glasgow. Sree Svadista Prasada delivers Andhra curries, dosas, biryanis, and weekly tiffin subscriptions. Real home-style cooking." />
        <meta name="keywords" content="South Indian food Glasgow, Indian takeaway Glasgow, dosa Glasgow, biryani delivery Glasgow, authentic Indian food Glasgow, Andhra food Glasgow, tiffin service Glasgow, Indian meal subscription Glasgow, best South Indian food Glasgow, South Indian restaurant near Glasgow" />
        <link rel="canonical" href="https://sreesvadistaprasada.com/glasgow" />
        <meta property="og:title" content="South Indian Food Glasgow | Dosa &amp; Biryani Delivery" />
        <meta property="og:description" content="Order authentic South Indian food delivered to Glasgow. Andhra curries, masala dosa, biryani and weekly tiffin subscriptions from Sree Svadista Prasada." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sreesvadistaprasada.com/glasgow" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" />
        <meta property="og:site_name" content="Sree Svadista Prasada" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="South Indian Food Glasgow | Dosa &amp; Biryani Delivery" />
        <meta name="twitter:description" content="Order authentic South Indian food delivered to Glasgow. Andhra curries, masala dosa, biryani and weekly tiffin subscriptions from Sree Svadista Prasada." />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Sree Svadista Prasada — Glasgow Delivery",
          "description": "Authentic South Indian food delivery serving Glasgow. Andhra curries, dosas, biryanis, Andhra pickles and weekly tiffin subscriptions.",
          "url": "https://sreesvadistaprasada.com/glasgow",
          "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80",
          "areaServed": [{"@type": "City", "name": "Glasgow"}, {"@type": "State", "name": "Scotland"}],
          "servesCuisine": ["South Indian", "Indian", "Andhra", "Vegetarian", "Vegan"],
          "hasMap": "https://maps.google.com/?q=Glasgow,Scotland",
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
            {"@type": "ListItem", position: 2, name: "Glasgow", item: "https://sreesvadistaprasada.com/glasgow"}
          ]
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(55vh, 460px)' }}>
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1280"
          srcSet="https://images.unsplash.com/photo-1556910103-1c02745aae4d?crop=entropy&cs=srgb&fm=jpg&q=85&w=640 640w, https://images.unsplash.com/photo-1556910103-1c02745aae4d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1280 1280w"
          sizes="100vw"
          alt="Authentic South Indian food delivery Glasgow — Sree Svadista Prasada"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.93) 0%, rgba(128,0,32,0.75) 50%, rgba(128,0,32,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-yellow-300" />
              <span className="text-xs uppercase tracking-[0.25em] font-medium" style={{ color: 'rgba(244,196,48,0.85)' }}>Glasgow</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Authentic South Indian Food in Glasgow
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Real home-style Andhra cooking — dosas, biryanis, slow-cooked curries, and weekly tiffin subscriptions delivered to Glasgow.
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

      {/* Why SSP Glasgow */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            South Indian Food You Can Trust, Delivered to Glasgow
          </h2>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
            Glasgow has one of the UK's most vibrant South Asian communities, yet authentic Andhra and Telugu cuisine remains hard to find. Sree Svadista Prasada brings the real flavours of South India directly to your door.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🫙',
              title: 'Andhra Pickles Posted to Glasgow',
              desc: 'Our handmade Gongura Pickle, Mango Avakaya, and spiced podis are available to order online with UK-wide delivery. Made in small batches, no preservatives.',
            },
            {
              icon: '📦',
              title: 'Weekly Tiffin Subscription',
              desc: 'Subscribe to our Dabba Wala meal plan. Home-cooked South Indian meals — veg or non-veg box — delivered Monday to Friday. Weekly or monthly plans.',
            },
            {
              icon: '🍛',
              title: 'Two Kitchens. Zero Compromise.',
              desc: 'Prasada kitchen: 100% vegetarian temple-style cooking. Svadista kitchen: bold non-veg Andhra dishes with village-style spice. Both made fresh daily.',
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
          <p className="text-sm text-center mb-10" style={{ color: C.muted }}>Popular with our Glasgow customers</p>
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

      {/* Glasgow SEO content */}
      <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="prose prose-sm max-w-none" style={{ color: C.muted }}>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Finding Authentic South Indian Food in Glasgow
          </h2>
          <p className="leading-relaxed mb-4">
            Glasgow's South Asian community is one of the oldest and most established in Scotland. Yet for Telugu and Andhra food lovers — those searching for <strong>Pulihora</strong>, <strong>Gongura Mutton</strong>, or a proper <strong>Rasam</strong> — the options in Glasgow remain limited. That's where Sree Svadista Prasada comes in.
          </p>
          <p className="leading-relaxed mb-4">
            We specialise in the cuisine of Andhra Pradesh and Telangana. This means bold, tamarind-forward gravies, slow-cooked village-style meats, and the kind of temple-style vegetarian cooking that no generic Indian restaurant can replicate.
          </p>
          <h3 className="text-xl font-bold mt-8 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Dosa Delivery Glasgow
          </h3>
          <p className="leading-relaxed mb-4">
            Looking for dosa delivery in Glasgow? Our breakfast menu features crispy <strong>Masala Dosa</strong>, <strong>Rava Dosa</strong>, <strong>Ghee Dosa</strong>, and <strong>Ragi Dosa</strong>. All made from scratch using fermented batter — thin, lacy, and properly sour the way a dosa should be. Each served with coconut chutney and sambar.
          </p>
          <h3 className="text-xl font-bold mt-8 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Andhra Pickles Shipped to Glasgow
          </h3>
          <p className="leading-relaxed mb-4">
            Our Andhra pickle range ships across the UK including Glasgow. <strong>Mango Avakaya</strong> (raw mango in chilli and sesame), <strong>Gongura Pickle</strong> (sorrel leaf), <strong>Lemon Pickle</strong>, and <strong>Tomato Pickle</strong> — all handmade in small batches with no artificial preservatives.
          </p>
          <h3 className="text-xl font-bold mt-8 mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
            Indian Tiffin Service Delivered to Glasgow
          </h3>
          <p className="leading-relaxed">
            Our <strong>Dabba Wala tiffin subscription</strong> brings home-cooked South Indian meals to Glasgow residents. Choose the <strong>Svadista Box</strong> (non-veg Andhra cooking) or <strong>Prasada Box</strong> (100% pure vegetarian). 5 meals per week or 20 meals per month — fresh, hot, and made from scratch every weekday.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center" style={{ backgroundColor: C.primary }}>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Ready to Order South Indian Food in Glasgow?
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
