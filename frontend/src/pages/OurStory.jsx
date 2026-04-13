import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Flame, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { images } from '../data/mockData';

const OurStory = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(50vh, 420px)' }}>
        <img
          src={images.storyTeaser}
          alt="Our Story"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.92) 0%, rgba(128,0,32,0.7) 50%, rgba(128,0,32,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: '#F4C430' }} />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Story
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed" data-testid="story-hero-subtitle">
              From Amma's Kitchen to the UK — A Journey of Love, Tradition, and Homely Food
            </p>
          </div>
        </div>
      </section>

      {/* The Beginning */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>Where it all began</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                The Beginning
              </h2>
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                Every great journey starts with a longing. For us, it was the longing for the taste of home —
                the kind of food that wraps you in warmth, transports you back to your grandmother's kitchen,
                and makes you feel truly at peace.
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                When we moved to the UK, we realized how many South Indians were missing authentic,
                traditional homely food. Not restaurant food, not fusion experiments — but real,
                soul-satisfying dishes cooked the way our grandmothers made them. That longing became
                <em className="font-medium" style={{ color: '#800020' }}> Sree Svadista Prasada.</em>
              </p>
            </div>
            <div className="relative rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <img
                src={images.cooking}
                alt="Traditional South Indian cooking"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 rounded-lg" style={{ border: '1px solid rgba(244, 196, 48, 0.2)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* The Meaning */}
      <section className="py-16 md:py-24 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles size={32} className="mx-auto mb-4" style={{ color: '#F4C430' }} />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            The Meaning of Our Name
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Sree</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Divinity, prosperity, and auspiciousness. The sacred blessing that graces every meal.</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Svadista</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Delicious and authentic — the traditional bold flavors that make your taste buds dance.</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Prasada</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Sacred food offered with devotion, pure and blessed. Prepared with temple-like purity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Worlds */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>Two kitchens, one love</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Two Culinary Worlds
            </h2>
            <div className="section-divider mt-4" />
          </div>

          <p className="text-base text-gray-600 leading-relaxed text-center max-w-3xl mx-auto mb-12">
            We understood that our community has diverse needs. Some crave the bold, rustic flavors of traditional non-vegetarian cooking.
            Others seek the pure, sattvic experience of temple-style vegetarian food.
            That's why we created two distinct experiences under one roof:
          </p>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Svadista Card */}
            <div className="relative rounded-lg overflow-hidden" style={{ height: '320px' }}>
              <img src={images.svadista} alt="Sree Svadista" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(139,58,58,0.95) 0%, rgba(139,58,58,0.5) 50%, rgba(139,58,58,0.1) 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={18} className="text-red-300" />
                  <span className="text-xs uppercase tracking-[0.2em] text-red-200 font-medium">Non-Vegetarian</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Sree Svadista</h3>
                <p className="text-sm text-gray-200 leading-relaxed max-w-sm">
                  Bold, rustic, village-style cooking. Authentic recipes passed down through generations.
                  The Sunday chicken curry that filled the house with irresistible aromas.
                </p>
              </div>
            </div>

            {/* Prasada Card */}
            <div className="relative rounded-lg overflow-hidden" style={{ height: '320px' }}>
              <img src={images.prasada} alt="Sree Prasada" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(74,124,89,0.95) 0%, rgba(74,124,89,0.5) 50%, rgba(74,124,89,0.1) 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf size={18} className="text-green-300" />
                  <span className="text-xs uppercase tracking-[0.2em] text-green-200 font-medium">Pure Vegetarian</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Sree Prasada</h3>
                <p className="text-sm text-gray-200 leading-relaxed max-w-sm">
                  100% pure vegetarian temple-style cooking. Separate utensils, different oils,
                  no cross-contamination. Food prepared with complete devotion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-16 md:py-24 px-4 md:px-8" style={{ backgroundColor: '#800020' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#F4C430' }}>What we stand for</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Promise
            </h2>
            <div className="w-12 h-0.5 mx-auto mt-4" style={{ backgroundColor: '#F4C430' }} />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Fresh Ingredients', desc: 'We source the finest ingredients, just like your grandmother would choose from the market.' },
              { title: 'No Shortcuts', desc: 'Every dish is cooked using traditional methods. No artificial flavors, no preservatives — just authentic taste.' },
              { title: 'Temple-like Purity', desc: 'For our pure vegetarian prasada, we maintain separate kitchens, utensils, and cooking oils.' },
              { title: 'Cooked with Devotion', desc: 'Every meal is prepared with the same love and care that your mother puts into her cooking.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Heart size={20} className="flex-shrink-0 mt-1" style={{ color: '#F4C430' }} />
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Serving Across the UK */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>More than a restaurant</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Serving Across the UK
          </h2>
          <p className="text-base text-gray-600 leading-relaxed mb-4">
            Sree Svadista Prasada is not just a restaurant — it's a gateway back home. Whether you're
            a student missing Amma's cooking, a professional craving authentic flavors, or a family
            looking for pure prasada for your pooja, we're here for you.
          </p>
          <p className="text-base text-gray-600 leading-relaxed mb-8">
            Now serving <strong className="font-bold" style={{ color: '#800020' }}>Milton Keynes</strong>, Edinburgh, and Glasgow with dine-in, delivery,
            weekly & monthly meal subscriptions (Dabba Wala service), and full catering for functions, poojas, and corporate events.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/menu">
              <button className="btn-outlined" data-testid="story-view-menu-btn">
                View Menu <ArrowRight size={16} />
              </button>
            </Link>
            <Link to="/subscriptions">
              <button className="px-8 py-3 text-sm font-semibold tracking-wide uppercase rounded-sm text-white transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#800020' }} data-testid="story-subscribe-btn">
                Subscribe Now <ArrowRight size={16} className="inline ml-2" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OurStory;
