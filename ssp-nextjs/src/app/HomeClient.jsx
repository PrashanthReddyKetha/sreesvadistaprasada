'use client';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { Leaf, Flame, Star, ShoppingCart, ArrowRight, ChevronRight, Package, Calendar, Truck, MapPin } from 'lucide-react';
import { featuredDishes, mealMoments, chefSpecial, images, galleryImages } from '@/data/mockData';
import HeroSlider from '@/components/HeroSlider';
import api from '@/api';
import { useCart } from '@/context/CartContext';
import { buildItemUrl } from '@/lib/itemUrl';

const Home = () => {
  const trendingRef = useRef(null);
  const specialsRef = useRef(null);
  const router = useRouter();
  const [postcode, setPostcode] = useState('');
  const [postcodeResult, setPostcodeResult] = useState(null);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const { addToCart } = useCart();
  const [liveItems, setLiveItems] = useState([]);
  const [chefSpecialItem, setChefSpecialItem] = useState(null);
  const [dailySpecials, setDailySpecials] = useState([]);

  useEffect(() => {
    api.get('/menu?available=true&featured=true')
      .then(r => setLiveItems(r.data))
      .catch(() => {});
    api.get('/daily-specials')
      .then(r => setDailySpecials(r.data || []))
      .catch(() => {});
  }, []);

  // Look up the chef's special item by name to get its real ID for the detail page link
  useEffect(() => {
    api.get('/menu?available=true&search=Pulihora')
      .then(r => { if (r.data?.[0]) setChefSpecialItem(r.data[0]); })
      .catch(() => {});
  }, []);

  const scrollTrending = (direction) => {
    if (trendingRef.current) {
      const scrollAmount = 340;
      trendingRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollSpecials = (direction) => {
    if (specialsRef.current) {
      const scrollAmount = 220;
      specialsRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const checkPostcode = async (e) => {
    e.preventDefault();
    setPostcodeLoading(true);
    try {
      const res = await api.post('/delivery/check', { postcode });
      setPostcodeResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPostcodeLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>

      {/* Hero Slider */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]">
        <HeroSlider />
      </section>

      {/* ============================================ */}
      {/* TWO WORLDS NAVIGATION CARDS */}
      {/* ============================================ */}
      <section id="two-worlds" className="py-16 md:py-24 px-4 md:px-8" data-testid="two-worlds-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>
              Two kitchens, one soul
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Choose Your World
            </h2>
            <div className="section-divider mt-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Svadista Card */}
            <Link href="/svadista" className="group" data-testid="svadista-world-card">
              <div className="relative overflow-hidden rounded-lg" style={{ height: '420px' }}>
                <img
                  src={images.svadista}
                  alt="Sree Svadista Non-Veg Specialties"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to top, rgba(139, 58, 58, 0.95) 0%, rgba(139, 58, 58, 0.6) 40%, rgba(139, 58, 58, 0.15) 100%)'
                }} />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame size={18} className="text-red-300" />
                    <span className="text-xs uppercase tracking-[0.2em] text-red-200 font-medium">Non-Vegetarian</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Sree Svadista
                  </h3>
                  <p className="text-gray-200 text-sm mb-4 leading-relaxed max-w-sm">
                    Bold, rustic, village-style. The spicy heart of Telugu non-veg cooking.
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all duration-300">
                    Explore Non-Veg Specialties <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>

            {/* Prasada Card */}
            <Link href="/prasada" className="group" data-testid="prasada-world-card">
              <div className="relative overflow-hidden rounded-lg" style={{ height: '420px' }}>
                <img
                  src={images.prasada}
                  alt="Sree Prasada Pure Veg Bliss"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to top, rgba(74, 124, 89, 0.95) 0%, rgba(74, 124, 89, 0.6) 40%, rgba(74, 124, 89, 0.15) 100%)'
                }} />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf size={18} className="text-green-300" />
                    <span className="text-xs uppercase tracking-[0.2em] text-green-200 font-medium">Pure Vegetarian</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Sree Prasada
                  </h3>
                  <p className="text-gray-200 text-sm mb-4 leading-relaxed max-w-sm">
                    Divine, sattvic, temple-style. Pure food prepared with complete devotion.
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all duration-300">
                    Explore Pure Veg Bliss <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TODAY'S SPECIALS (horizontal scroll strip) */}
      {/* ============================================ */}
      {dailySpecials.length > 0 && (
        <section className="py-10 md:py-12 px-4 md:px-8" style={{ backgroundColor: '#FDF5E6' }} data-testid="todays-specials-section">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] mb-1" style={{ color: '#B8860B' }}>
                  Straight off this morning's stove
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  Today's Specials
                </h2>
              </div>
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => scrollSpecials('left')}
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors duration-200 hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                  style={{ borderColor: '#800020', color: '#800020' }}
                  data-testid="specials-scroll-left"
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <button
                  onClick={() => scrollSpecials('right')}
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors duration-200 hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                  style={{ borderColor: '#800020', color: '#800020' }}
                  data-testid="specials-scroll-right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div
              ref={specialsRef}
              className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {dailySpecials.map((s) => {
                const card = (
                  <div
                    className="rounded-lg overflow-hidden bg-white transition-all duration-200 group h-full"
                    style={{ boxShadow: '0 2px 10px rgba(128,0,32,0.06)', border: '1px solid rgba(244,196,48,0.4)' }}
                  >
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src={s.image || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'}
                        alt={s.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                        Today
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-bold leading-tight mb-1 line-clamp-2 group-hover:underline" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>
                        {s.title}
                      </h3>
                      {s.subtitle && (
                        <p className="text-[11px] text-gray-500 leading-snug mb-2 line-clamp-2">{s.subtitle}</p>
                      )}
                      {typeof s.price === 'number' && (
                        <p className="text-sm font-bold" style={{ color: '#800020' }}>£{s.price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                );
                return s.link ? (
                  <Link
                    key={s.id}
                    href={s.link}
                    className="flex-shrink-0 block"
                    style={{ width: '200px' }}
                    data-testid={`daily-special-${s.id}`}
                  >
                    {card}
                  </Link>
                ) : (
                  <div
                    key={s.id}
                    className="flex-shrink-0"
                    style={{ width: '200px' }}
                    data-testid={`daily-special-${s.id}`}
                  >
                    {card}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* TRENDING & LOVED */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }} data-testid="trending-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#B8860B' }}>
                The plates our families keep asking for
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Loved &amp; Reordered
              </h2>
            </div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollTrending('left')}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-200 hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                style={{ borderColor: '#800020', color: '#800020' }}
                data-testid="trending-scroll-left"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
              <button
                onClick={() => scrollTrending('right')}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-200 hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                style={{ borderColor: '#800020', color: '#800020' }}
                data-testid="trending-scroll-right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Horizontal Carousel */}
          <div
            ref={trendingRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {(liveItems.length > 0 ? liveItems : featuredDishes).map((dish) => {
              const isLive = liveItems.length > 0;
              const isVeg = isLive ? dish.is_veg : dish.category !== 'Non-Veg';
              const spice = isLive ? (dish.spice_level || 0) : (dish.spiceLevel || 0);
              const price = isLive ? `£${dish.price?.toFixed(2)}` : dish.price;
              const itemPath = isLive ? buildItemUrl(dish) : null;
              return (
              <div
                key={dish.id}
                className="flex-shrink-0 w-72 md:w-80 rounded-lg overflow-hidden group card-hover bg-white"
                style={{ boxShadow: '0 4px 20px rgba(128, 0, 32, 0.06)', cursor: itemPath ? 'pointer' : 'default' }}
                onClick={() => itemPath && navigate(itemPath)}
                data-testid={`trending-dish-${dish.id}`}
              >
                <div className="block relative h-48 overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {dish.tag && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-sm text-xs font-semibold text-white"
                      style={{ backgroundColor: dish.tag === 'New' ? '#1D4ED8' : '#8B3A3A' }}
                    >
                      {dish.tag}
                    </span>
                  )}
                  <div className="absolute top-3 right-3">
                    {!isVeg ? (
                      <div className="w-5 h-5 rounded-sm border-2 border-red-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-sm border-2 border-green-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>
                      {dish.name}
                    </h3>
                    {spice > 0 ? (
                      <div className="flex gap-0.5 shrink-0">
                        {Array(spice).fill(0).map((_, i) => (
                          <Flame key={i} size={12} className="text-red-500 fill-red-500" />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Mild</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">
                    {dish.description}
                  </p>
                  {dish.allergens && dish.allergens.length > 0 && dish.allergens[0] !== 'none' && (
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {dish.allergens.map(a => (
                        <span key={a} className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase" style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-bold" style={{ color: '#800020' }}>{price}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(dish); }}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-sm transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: '#800020' }}
                      data-testid={`add-to-cart-${dish.id}`}
                    >
                      <ShoppingCart size={13} /> Add
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide transition-colors duration-200 hover:gap-3"
              style={{ color: '#800020' }}
              data-testid="view-all-menu-link"
            >
              View Full Menu <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* DABBA WALA EXPLAINED */}
      {/* ============================================ */}
      <section className="py-12 md:py-20 px-4 md:px-8 relative overflow-hidden" style={{ backgroundColor: '#800020' }} data-testid="dabba-wala-section">
        <div className="absolute inset-0 grain-overlay opacity-5" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-[11px] md:text-sm uppercase tracking-[0.25em] mb-2 md:mb-3" style={{ color: '#F4C430' }}>
              A hot dabba, every day, like clockwork
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              The Dabba Wala
            </h2>
            <div className="w-12 h-0.5 mx-auto mt-3 md:mt-4" style={{ backgroundColor: '#F4C430' }} />
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-12 mb-8 md:mb-12">
            {[
              { num: '01', icon: Package, title: 'Pick Your Dabba', desc: 'Prasada, Svadista, or a bit of both. Weekly or monthly — whichever fits your week.' },
              { num: '02', icon: Calendar, title: 'Tell Us Your Days', desc: 'Choose days and times. Pause for a holiday, switch the menu, no fuss.' },
              { num: '03', icon: Truck, title: 'Open It Warm', desc: 'Packed fresh, sealed hot, at your door — the way a home meal should arrive.' },
            ].map((step) => (
              <div key={step.num} className="text-center" data-testid={`dabba-step-${step.num}`}>
                <div className="relative inline-block mb-3 md:mb-6">
                  <div className="w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2" style={{ borderColor: '#F4C430' }}>
                    <step.icon className="w-5 h-5 md:w-7 md:h-7" style={{ color: '#F4C430' }} />
                  </div>
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 text-[9px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                    {step.num}
                  </span>
                </div>
                <h3 className="text-xs md:text-xl font-bold text-white mb-1 md:mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {step.title}
                </h3>
                <p className="text-[10px] md:text-sm text-gray-300 leading-snug md:leading-relaxed max-w-xs mx-auto hidden sm:block">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/subscriptions">
              <button
                className="px-6 md:px-8 py-2.5 md:py-3.5 text-xs md:text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#F4C430', color: '#2D2422' }}
                data-testid="dabba-subscribe-btn"
              >
                Start My Dabba <ArrowRight size={16} className="inline ml-2" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CHEF'S SPECIAL + MEAL MOMENTS (Split Layout) */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 px-4 md:px-8" data-testid="chef-special-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 md:gap-12">
            {/* Chef's Special - 3 columns */}
            <div className="lg:col-span-3">
              <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#B8860B' }}>
                Cooked slow · served with both hands
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                This Week's Favourite
              </h2>

              <div className="relative rounded-lg overflow-hidden group" style={{ boxShadow: '0 8px 32px rgba(128, 0, 32, 0.08)' }}>
                <Link href={chefSpecialItem ? buildItemUrl(chefSpecialItem) : '/prasada'} className="block">
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img
                    src={chefSpecial.image}
                    alt={chefSpecial.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <span
                    className="absolute top-4 left-4 px-3 py-1.5 text-xs font-semibold text-white rounded-sm"
                    style={{ backgroundColor: '#F4C430', color: '#2D2422' }}
                  >
                    Chef's Special
                  </span>
                </div>
                <div className="p-6 md:p-8 bg-white">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 hover:underline" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                    {chefSpecial.name}
                  </h3>
                  <p className="text-sm italic mb-3" style={{ color: '#B8860B' }}>
                    "{chefSpecial.tagline}"
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {chefSpecial.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold" style={{ color: '#800020' }}>{chefSpecial.price}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); addToCart(chefSpecial); }}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-sm transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: '#800020' }}
                      data-testid="chef-special-add-btn"
                    >
                      <ShoppingCart size={15} /> Order Now
                    </button>
                  </div>
                </div>
                </Link>
              </div>
            </div>

            {/* Explore by Meal Moment - 2 columns */}
            <div className="lg:col-span-2">
              <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#B8860B' }}>
                Pick a time of day
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                By the Hour
              </h2>

              <div className="grid grid-cols-2 gap-4 md:gap-5">
                {mealMoments.map((moment) => (
                  <Link key={moment.id} href={moment.link} className="group text-center" data-testid={`meal-moment-${moment.id}`}>
                    <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 transition-all duration-300 group-hover:shadow-lg"
                      style={{ border: '3px solid rgba(244, 196, 48, 0.3)' }}
                    >
                      <img
                        src={moment.image}
                        alt={moment.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 rounded-full transition-colors duration-300 group-hover:bg-[#800020]/10" />
                    </div>
                    <p className="text-sm font-semibold tracking-wide" style={{ color: '#800020' }}>
                      {moment.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* DELIVERY POSTCODE CHECKER */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 px-4 md:px-8" data-testid="postcode-checker-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>Let's find your door</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Where Shall We Bring the Warmth?
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Drop your postcode and we'll tell you what's on the way. Hot meals and daily dabbas in Milton Keynes, Edinburgh &amp; Glasgow. Pickles and podis — we post those anywhere you call home.
              </p>
              <form onSubmit={checkPostcode} className="flex gap-2 mb-4" data-testid="postcode-form">
                <div className="relative flex-1">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => { setPostcode(e.target.value); setPostcodeResult(null); }}
                    placeholder="e.g. MK9 2FP"
                    className="w-full pl-10 pr-4 py-3 rounded-sm border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors"
                    data-testid="postcode-input"
                  />
                </div>
                <button type="submit" disabled={postcodeLoading} className="px-6 py-3 text-sm font-semibold text-white rounded-sm transition-all duration-200 hover:shadow-md" style={{ backgroundColor: '#800020' }} data-testid="postcode-check-btn">
                  {postcodeLoading ? '...' : 'Check'}
                </button>
              </form>
              {postcodeResult && (
                <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: postcodeResult.service_type === 'snacks_only' ? '#FDF5E6' : '#F0FFF4', border: `1px solid ${postcodeResult.service_type === 'snacks_only' ? 'rgba(184,134,11,0.3)' : 'rgba(74,124,89,0.3)'}` }} data-testid="postcode-result">
                  <p className="font-bold mb-2" style={{ color: postcodeResult.service_type === 'snacks_only' ? '#B8860B' : '#4A7C59' }}>
                    {postcodeResult.message}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><strong>Delivery:</strong> {postcodeResult.delivery_fee === 0 ? 'Free' : `£${postcodeResult.delivery_fee}`}</div>
                    <div><strong>Min Order:</strong> £{postcodeResult.min_order}</div>
                    <div><strong>Timing:</strong> {postcodeResult.estimated_time}</div>
                    <div><strong>Service:</strong> {postcodeResult.service_type === 'full' ? 'Full Menu' : 'Snacks & Pickles'}</div>
                  </div>
                </div>
              )}
            </div>
            {/* Delivery Areas Table */}
            <div className="rounded-lg bg-white p-6" style={{ boxShadow: '0 4px 20px rgba(128,0,32,0.06)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Delivery Areas</h3>
              <div className="space-y-3">
                {[
                  { city: 'Milton Keynes', postcodes: 'MK1–MK19', deliveryFee: 'Free over £30', timing: '45–60 min' },
                  { city: 'Edinburgh', postcodes: 'EH1–EH17', deliveryFee: 'Free over £30', timing: '45–60 min' },
                  { city: 'Glasgow', postcodes: 'G1–G46', deliveryFee: 'Free over £30', timing: '45–60 min' },
                  { city: 'Rest of UK', postcodes: 'Snacks & Pickles only', deliveryFee: 'Free over £25', timing: '2–3 days' },
                ].map((area) => (
                  <div key={area.city} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: area.city === 'Milton Keynes' ? 'rgba(128,0,32,0.04)' : '#fafafa' }} data-testid={`delivery-area-${area.city.toLowerCase().replace(/\s/g, '-')}`}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: area.city === 'Milton Keynes' ? '#800020' : '#2D2422' }}>
                        {area.city} {area.city === 'Milton Keynes' && <span className="text-xs font-normal ml-1" style={{ color: '#B8860B' }}>(Main)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{area.postcodes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium" style={{ color: '#4A7C59' }}>{area.deliveryFee}</p>
                      <p className="text-xs text-gray-400">{area.timing}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* GALLERY PREVIEW */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }} data-testid="gallery-preview-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#B8860B' }}>A peek into our kitchen</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              From Our Kitchen
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {galleryImages.slice(0, 8).map(img => (
              <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide transition-colors duration-200 hover:gap-3" style={{ color: '#800020' }} data-testid="view-gallery-link">
              View Full Gallery <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* OFFERS & SPECIALS */}
      {/* ============================================ */}
      <section className="py-12 md:py-16 px-4 md:px-8" data-testid="offers-section">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-lg p-8 md:p-12 text-center relative overflow-hidden"
            style={{ backgroundColor: '#FDF5E6', border: '1px solid rgba(244, 196, 48, 0.3)' }}
          >
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: '#F4C430', transform: 'translate(-50%, -50%)' }} />
            <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#800020', transform: 'translate(50%, 50%)' }} />

            <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#B8860B' }}>A little welcome gift</p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              15% OFF
            </h2>
            <p className="text-lg mb-1" style={{ color: '#800020' }}>
              Your first month of daily dabbas
            </p>
            <p className="text-sm text-gray-600 mb-6">Use code: <span className="font-bold" style={{ color: '#800020' }}>HOME15</span></p>
            <Link href="/subscriptions">
              <button
                className="px-8 py-3 text-sm font-semibold tracking-wide uppercase text-white rounded-sm transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#800020' }}
                data-testid="offer-cta-btn"
              >
                Bring It Home
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SNACKS & PICKLES (UK-WIDE) */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }} data-testid="snacks-pickles-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="relative rounded-lg overflow-hidden" style={{ height: '380px' }}>
              <img
                src={images.picklesShelf}
                alt="Traditional pickles and spices"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-4 left-4 px-3 py-1.5 rounded-sm text-xs font-semibold text-white" style={{ backgroundColor: '#4A7C59' }}>
                Ships UK-Wide
              </span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>
                Small jars · big memories
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Avakaya, Podis &amp; Sweet Things
              </h2>
              <p className="text-base text-gray-600 leading-relaxed mb-6">
                Hand-stirred pickles. Dry-roasted podis ground in small batches. Sweets folded the way grandmothers fold them — slow and smiling. From tangy Gongura to fiery Mango Avakaya, each jar carries a noisy Sunday kitchen inside it.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {['Avakaya', 'Gongura', 'Kandi Podi', 'Sweets', 'Podis'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: 'rgba(74, 124, 89, 0.1)', color: '#4A7C59' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href="/snacks">
                <button className="btn-outlined" data-testid="shop-snacks-btn">
                  Open the Pantry <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* OUR STORY TEASER */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 px-4 md:px-8" data-testid="story-teaser-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1">
              <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>
                Not just food · a feeling we kept chasing
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Why We Lit This Stove
              </h2>
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                Somewhere between a UK winter and a long video call home, we missed something no menu was naming — the smell of tadka hitting hot ghee, the hiss of mustard seeds, and a plate placed in front of us without being asked for.
              </p>
              <p className="text-base text-gray-600 leading-relaxed mb-8">
                So we lit our own stove. Two kitchens, one quiet promise —
                <em className="font-medium" style={{ color: '#800020' }}> taste for your heart.</em>
              </p>
              <Link href="/story">
                <button className="btn-outlined" data-testid="read-story-btn">
                  Sit With Us a While <ArrowRight size={16} />
                </button>
              </Link>
            </div>
            <div className="order-1 md:order-2 relative rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <img
                src={images.storyTeaser}
                alt="Traditional Indian cooking"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 rounded-lg" style={{ border: '1px solid rgba(244, 196, 48, 0.2)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 px-4 md:px-8" style={{ backgroundColor: '#800020' }} data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#F4C430' }}>
            Notes from the family we're feeding
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>
            Finally, a Taste of Home
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Priya S.', location: 'Edinburgh', text: 'The pulihora reminded me of my grandmother\'s cooking. I cried happy tears. Finally, authentic Andhra food in the UK!' },
              { name: 'Rajesh K.', location: 'Milton Keynes', text: 'The prasada is so pure and divine. Perfect for our weekly poojas. My mother-in-law gave it her stamp of approval!' },
              { name: 'Anitha R.', location: 'Glasgow', text: 'As a student, the weekly dabba is a lifesaver. Tastes exactly like home food. Amma would be proud.' },
            ].map((t, i) => (
              <div key={i} className="p-6 md:p-8 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} data-testid={`testimonial-${i}`}>
                <div className="flex gap-1 mb-4 justify-center">
                  {Array(5).fill(0).map((_, j) => (
                    <Star key={j} size={16} className="fill-[#F4C430] text-[#F4C430]" />
                  ))}
                </div>
                <p className="text-sm text-gray-200 leading-relaxed mb-6 italic">
                  "{t.text}"
                </p>
                <p className="text-white font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">{t.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
