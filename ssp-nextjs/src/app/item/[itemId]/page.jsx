'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart, ShoppingCart, Star, ChevronDown, ChevronUp,
  Flame, Leaf, AlertTriangle, Users, Plus, Minus,
  ArrowLeft, Share2, CheckCircle, Award, Clock, Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import api from '@/api';

// ── constants ──────────────────────────────────────────────────────────────
const CAT_LABELS = { nonVeg:'Non-Veg', veg:'Veg', prasada:'Prasada', breakfast:'Breakfast', pickles:'Pickles', podis:'Podis' };

const COMPLEMENTS = {
  nonVeg:    ['pickles','podis'],
  veg:       ['pickles','podis'],
  prasada:   ['veg','pickles'],
  breakfast: ['podis','pickles'],
  pickles:   ['nonVeg','veg'],
  podis:     ['nonVeg','breakfast'],
};

const ALLERGEN_COLORS = {
  gluten:  '#FEF3C7',  dairy: '#DBEAFE',  eggs: '#FEE2E2',
  nuts:    '#FEF9C3',  sesame:'#E0E7FF',  mustard:'#FEF08A',
  soy:     '#DCFCE7',  celery:'#F0FDF4',
};

const CATEGORY_FAQS = {
  nonVeg: [
    { q:'Is the meat halal?', a:'Yes, all our meat is sourced from halal-certified suppliers.' },
    { q:'Can I request a different spice level?', a:'Absolutely — add a note in Special Instructions at checkout and we\'ll adjust it for you.' },
    { q:'What sides go best with this?', a:'Our homemade pickles and podis pair beautifully. Check the "Goes Best With" section below.' },
  ],
  veg: [
    { q:'Is this suitable for vegans?', a:'Most veg dishes use ghee. For vegan preparation, add a note at checkout and we\'ll accommodate you.' },
    { q:'Are veg dishes cooked separately from non-veg?', a:'Yes — we use dedicated cookware and utensils for all vegetarian preparations.' },
    { q:'Are the spices freshly ground?', a:'Yes, we grind our own masala blends fresh every morning using traditional stone grinding.' },
  ],
  prasada: [
    { q:'What makes Prasada different?', a:'Prasada is temple-style cooking — sattvic food prepared without onion or garlic, offering spiritual nourishment alongside taste.' },
    { q:'Is Prasada suitable for fasting?', a:'Most items are suitable for fasting. Check allergen info or ask us directly.' },
  ],
  breakfast: [
    { q:'Can I order breakfast items for lunch or dinner?', a:'Absolutely! Our breakfast items are made fresh throughout the day.' },
    { q:'Are the dosas made to order?', a:'Yes — all dosas and idlis are made fresh when your order is placed.' },
  ],
  pickles: [
    { q:'How long do the pickles last?', a:'Our pickles have a shelf life of 3–6 months when refrigerated. Best consumed within 30 days once opened.' },
    { q:'Are the pickles very spicy?', a:'Spice levels vary by variety. Check the spice indicator on each item. We also offer mild versions on request.' },
  ],
  podis: [
    { q:'What is podi used for?', a:'Podi (gunpowder) is a dry chutney mixed with ghee or oil and served alongside dosas, idlis, rice, or used as a seasoning.' },
    { q:'How much podi do I need per serving?', a:'Typically 1–2 teaspoons per serving. A 100g jar lasts a household of 4 about 2–3 weeks.' },
  ],
};

const GENERAL_FAQS = [
  { q:'How long does delivery take?', a:'45–60 mins for Milton Keynes, 60–90 mins for Edinburgh and Glasgow.' },
  { q:'What is the minimum for free delivery?', a:'Orders over £30 qualify for free delivery across all our delivery areas.' },
  { q:'Can I customise my order?', a:'Yes — use the Special Instructions field at checkout for any requests.' },
  { q:'Do you cater for large groups?', a:'Yes! Visit our Catering page to request a quote for events and celebrations.' },
];

// ── sub-components ─────────────────────────────────────────────────────────
const StarRow = ({ rating, size = 16, interactive = false, onRate }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        onClick={() => interactive && onRate && onRate(i)}
        className={interactive ? 'cursor-pointer' : ''}
        style={{ color: i <= Math.round(rating) ? '#F4C430' : '#D1D5DB', fill: i <= Math.round(rating) ? '#F4C430' : 'none' }} />
    ))}
  </div>
);

const SpiceDots = ({ level }) => (
  <div className="flex gap-1 items-center">
    {[1,2,3,4,5].map(i => (
      <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i <= level ? '#C62828' : '#E5E7EB' }} />
    ))}
    <span className="text-xs ml-1" style={{ color:'#9C7B6B' }}>
      {level === 0 ? 'No spice' : level <= 1 ? 'Mild' : level <= 2 ? 'Medium' : level <= 3 ? 'Spicy' : level <= 4 ? 'Very Spicy' : 'Extremely Hot'}
    </span>
  </div>
);

const MiniCard = ({ item }) => {
  const { addToCart } = useCart();
  return (
    <Link href={`/item/${item.id}`} className="flex-shrink-0 w-44 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow" style={{ border:'1px solid rgba(244,196,48,0.2)' }}>
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 flex items-center justify-center" style={{ backgroundColor:'rgba(128,0,32,0.06)' }}>
          <ShoppingCart size={24} style={{ color:'#800020' }} />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold" style={{ color:'#800020' }}>£{item.price?.toFixed(2)}</span>
          <button onClick={e => { e.preventDefault(); addToCart({ ...item, price:`£${item.price.toFixed(2)}` }); }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor:'#800020' }}>
            <Plus size={12} />
          </button>
        </div>
      </div>
    </Link>
  );
};

// ── main page ──────────────────────────────────────────────────────────────
export default function ItemDetail() {
  const params = useParams();
  const itemId = params?.itemId;
  const router = useRouter();
  const { user, setAuthOpen } = useAuth();
  const { addToCart } = useCart();

  const [item, setItem]         = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [social, setSocial]     = useState({ likes:0, order_count:0, user_liked:false, user_reviewed:false });
  const [goesWith, setGoesWith] = useState([]);
  const [similar, setSimilar]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [qty, setQty]           = useState(1);
  const [added, setAdded]       = useState(false);
  const [liking, setLiking]     = useState(false);

  const [reviewForm, setReviewForm]           = useState({ rating:5, comment:'' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError]         = useState('');
  const [reviewSuccess, setReviewSuccess]     = useState(false);

  const [openFaq, setOpenFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [itemId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemRes, reviewsRes, socialRes] = await Promise.all([
        api.get(`/menu/${itemId}`),
        api.get(`/menu/${itemId}/reviews`),
        api.get(`/menu/${itemId}/social`),
      ]);
      const it = itemRes.data;
      setItem(it);
      setReviews(reviewsRes.data);
      setSocial(socialRes.data);

      const cats = COMPLEMENTS[it.category] || [];
      const promises = [api.get(`/menu?category=${it.category}&available=true`)];

      // If item has manual pairs_with, fetch those specific items; otherwise fetch by category
      if (it.pairs_with?.length > 0) {
        promises.push(...it.pairs_with.slice(0, 6).map(id => api.get(`/menu/${id}`)));
      } else if (cats[0]) {
        promises.push(api.get(`/menu?category=${cats[0]}&available=true`));
      }

      const [simRes, ...pairResults] = await Promise.all(promises);
      setSimilar(simRes.data.filter(i => i.id !== itemId).slice(0, 8));

      if (it.pairs_with?.length > 0) {
        setGoesWith(pairResults.map(r => r.data).filter(Boolean));
      } else if (pairResults[0]) {
        setGoesWith(pairResults[0].data.slice(0, 6));
      }
    } catch (e) {
      if (e.response?.status === 404) setNotFound(true);
    } finally { setLoading(false); }
  }, [itemId]);

  useEffect(() => { load(); }, [load]);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({ ...item, price:`£${item.price.toFixed(2)}` });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleLike = async () => {
    if (!user) { setAuthOpen(true); return; }
    setLiking(true);
    try {
      const res = await api.post(`/menu/${itemId}/like`);
      setSocial(p => ({ ...p, user_liked: res.data.liked, likes: p.likes + (res.data.liked ? 1 : -1) }));
    } catch { /* ignore */ }
    finally { setLiking(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    setReviewSubmitting(true); setReviewError('');
    try {
      const res = await api.post(`/menu/${itemId}/reviews`, reviewForm);
      setReviews(p => [res.data, ...p]);
      setSocial(p => ({ ...p, user_reviewed: true }));
      setReviewSuccess(true);
      setReviewForm({ rating:5, comment:'' });
    } catch (e) {
      setReviewError(e.response?.data?.detail || 'Could not submit review. Please try again.');
    } finally { setReviewSubmitting(false); }
  };

  const avgRating = reviews.length ? reviews.reduce((s,r) => s+r.rating, 0) / reviews.length : 0;
  const ratingDist = [5,4,3,2,1].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }));
  // Custom item FAQs first, then category FAQs, then general
  const faqs = [
    ...(item?.faqs?.filter(f => f.q && f.a) || []),
    ...(CATEGORY_FAQS[item?.category] || []),
    ...GENERAL_FAQS,
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-24" style={{ backgroundColor:'#FAF8F4' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-[#800020] border-t-transparent animate-spin" />
        <p className="text-sm" style={{ color:'#9C7B6B' }}>Loading dish details…</p>
      </div>
    </div>
  );

  if (notFound || !item) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24" style={{ backgroundColor:'#FAF8F4' }}>
      <p className="text-xl font-semibold" style={{ color:'#800020' }}>Dish not found</p>
      <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color:'#B8860B' }}>← Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-16" style={{ backgroundColor:'#FAF8F4' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6 flex-wrap" style={{ color:'#9C7B6B' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/menus" className="hover:underline">Menus</Link>
          <span>/</span>
          <span className="capitalize">{CAT_LABELS[item.category]}</span>
          <span>/</span>
          <span style={{ color:'#3D2B1F' }}>{item.name}</span>
        </div>

        {/* ── Hero ── */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio:'4/3' }}>
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background:'linear-gradient(135deg, rgba(128,0,32,0.08) 0%, rgba(184,134,11,0.08) 100%)' }}>
                <ShoppingCart size={64} style={{ color:'#800020', opacity:0.3 }} />
              </div>
            )}
            {/* Tag badge */}
            {item.tag && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
                style={{ backgroundColor:'#F4C430', color:'#3D2B1F' }}>{item.tag}</div>
            )}
            {/* Veg / Non-veg indicator */}
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-white">
              {item.is_veg
                ? <Leaf size={16} style={{ color:'#166534' }} />
                : <Flame size={16} style={{ color:'#C62828' }} />}
            </div>
          </div>

          {/* Info card */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color:'#B8860B' }}>
                {CAT_LABELS[item.category]}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight" style={{ fontFamily:"'Playfair Display',serif", color:'#3D2B1F' }}>
                {item.name}
              </h1>

              {/* Rating + social proof */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {reviews.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <StarRow rating={avgRating} size={18} />
                    <span className="text-sm font-bold" style={{ color:'#3D2B1F' }}>{avgRating.toFixed(1)}</span>
                    <span className="text-sm" style={{ color:'#9C7B6B' }}>({reviews.length} review{reviews.length!==1?'s':''})</span>
                  </div>
                ) : (
                  <span className="text-sm" style={{ color:'#9C7B6B' }}>No reviews yet — be the first!</span>
                )}
                {social.order_count > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor:'rgba(128,0,32,0.08)', color:'#800020' }}>
                    <Users size={12} /> {social.order_count} ordered
                  </div>
                )}
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color:'#5C4B47' }}>{item.description}</p>

              {/* Spice level */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:'#9C7B6B' }}>Spice Level</p>
                <SpiceDots level={item.spice_level} />
              </div>

              {/* Allergens */}
              {item.allergens?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={13} style={{ color:'#B8860B' }} />
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color:'#9C7B6B' }}>Allergens</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {item.allergens.map(a => (
                      <span key={a} className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                        style={{ backgroundColor: ALLERGEN_COLORS[a] || '#F3F4F6', color:'#374151', border:'1px solid rgba(0,0,0,0.08)' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price + add to cart */}
            <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.25)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold" style={{ color:'#800020' }}>£{item.price.toFixed(2)}</p>
                  <p className="text-xs" style={{ color:'#9C7B6B' }}>per serving</p>
                </div>
                <button onClick={handleLike} disabled={liking}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{ backgroundColor: social.user_liked ? '#FEE2E2' : 'rgba(128,0,32,0.08)', color: social.user_liked ? '#C62828' : '#9C7B6B' }}>
                  <Heart size={18} style={{ fill: social.user_liked ? '#C62828' : 'none' }} />
                  <span className="text-sm font-semibold">{social.likes}</span>
                </button>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold" style={{ color:'#5C4B47' }}>Quantity</p>
                <div className="flex items-center gap-2 rounded-xl overflow-hidden" style={{ border:'1px solid rgba(128,0,32,0.2)' }}>
                  <button onClick={() => setQty(q => Math.max(1, q-1))}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50" style={{ color:'#800020' }}>
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{qty}</span>
                  <button onClick={() => setQty(q => q+1)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50" style={{ color:'#800020' }}>
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-sm font-bold" style={{ color:'#800020' }}>= £{(item.price * qty).toFixed(2)}</span>
              </div>

              <button onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all hover:shadow-lg active:scale-95"
                style={{ backgroundColor: added ? '#166534' : '#800020' }}>
                {added ? <><CheckCircle size={18} /> Added to Cart!</> : <><ShoppingCart size={18} /> Add to Cart</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick Info Bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { icon: Clock,    label:'Prep Time',     value:'30–45 min' },
            { icon: Users,    label:'Serves',        value:'1 person' },
            { icon: Award,    label:'Authenticity',  value:'Village Recipe' },
            { icon: Package,  label:'Packaging',     value:'Eco-friendly' },
          ].map(({ icon:Icon, label, value }) => (
            <div key={label} className="rounded-xl p-4 text-center" style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)' }}>
              <Icon size={20} className="mx-auto mb-1.5" style={{ color:'#B8860B' }} />
              <p className="text-xs font-semibold" style={{ color:'#9C7B6B' }}>{label}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color:'#3D2B1F' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {[['about','About'],['reviews',`Reviews (${reviews.length})`],['faqs','FAQs']].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{ backgroundColor: activeTab===id?'#800020':'#FDFBF7', color: activeTab===id?'#FDFBF7':'#5C4B47', border: activeTab===id?'none':'1px solid rgba(128,0,32,0.15)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── About Tab ── */}
        {activeTab === 'about' && (
          <div className="rounded-2xl p-6 mb-10 space-y-4" style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)' }}>
            <h2 className="text-xl font-bold" style={{ fontFamily:"'Playfair Display',serif", color:'#800020' }}>About This Dish</h2>
            <p className="text-sm leading-relaxed" style={{ color:'#5C4B47' }}>{item.description}</p>
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                {[
                  ['Category',    CAT_LABELS[item.category]],
                  ['Dietary',     item.is_veg ? '🌿 Vegetarian' : '🍖 Non-Vegetarian'],
                  ['Spice Level', `${item.spice_level}/5`],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between text-sm py-2 border-b" style={{ borderColor:'rgba(244,196,48,0.15)' }}>
                    <span style={{ color:'#9C7B6B' }}>{k}</span>
                    <span className="font-semibold" style={{ color:'#3D2B1F' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {item.allergens?.length > 0 && (
                  <div className="py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:'#9C7B6B' }}>Contains Allergens</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.allergens.map(a => (
                        <span key={a} className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                          style={{ backgroundColor: ALLERGEN_COLORS[a]||'#F3F4F6', color:'#374151' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs p-3 rounded-xl" style={{ backgroundColor:'rgba(128,0,32,0.04)', color:'#5C4B47' }}>
                  ⚠️ Prepared in a kitchen that handles all common allergens. If you have severe allergies, please contact us before ordering.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Reviews Tab ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 mb-10">
            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="rounded-2xl p-6" style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)' }}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-6xl font-bold mb-1" style={{ color:'#800020' }}>{avgRating.toFixed(1)}</p>
                    <StarRow rating={avgRating} size={22} />
                    <p className="text-sm mt-2" style={{ color:'#9C7B6B' }}>{reviews.length} review{reviews.length!==1?'s':''}</p>
                  </div>
                  <div className="space-y-2">
                    {ratingDist.map(({ n, count }) => (
                      <div key={n} className="flex items-center gap-2 text-sm">
                        <span className="w-4 text-right font-semibold" style={{ color:'#5C4B47' }}>{n}</span>
                        <Star size={12} style={{ color:'#F4C430', fill:'#F4C430', flexShrink:0 }} />
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor:'#E5E7EB' }}>
                          <div className="h-full rounded-full" style={{ width:`${reviews.length ? (count/reviews.length)*100 : 0}%`, backgroundColor:'#F4C430' }} />
                        </div>
                        <span className="w-5 text-xs" style={{ color:'#9C7B6B' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Write review */}
            {!social.user_reviewed ? (
              <div className="rounded-2xl p-6" style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)' }}>
                <h3 className="font-bold mb-4" style={{ fontFamily:"'Playfair Display',serif", color:'#800020' }}>
                  {user ? 'Leave a Review' : 'Sign in to Leave a Review'}
                </h3>
                {user ? (
                  <form onSubmit={handleReview} className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-2" style={{ color:'#5C4B47' }}>Your Rating</p>
                      <StarRow rating={reviewForm.rating} size={28} interactive onRate={r => setReviewForm(p => ({...p, rating:r}))} />
                    </div>
                    <textarea
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(p => ({...p, comment:e.target.value}))}
                      rows={4} required minLength={5} placeholder="Tell others what you thought of this dish…"
                      className="w-full px-4 py-3 rounded-xl text-sm border resize-none outline-none focus:ring-2 focus:ring-[#800020]/30"
                      style={{ borderColor:'rgba(128,0,32,0.2)', backgroundColor:'white', color:'#3D2B1F' }}
                    />
                    {reviewError && <p className="text-sm p-3 rounded-xl" style={{ backgroundColor:'#FEE2E2', color:'#991B1B' }}>{reviewError}</p>}
                    {reviewSuccess && <p className="text-sm p-3 rounded-xl" style={{ backgroundColor:'#DCFCE7', color:'#166534' }}>Review submitted — thank you!</p>}
                    <button type="submit" disabled={reviewSubmitting}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor:'#800020' }}>
                      {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <button onClick={() => setAuthOpen(true)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor:'#800020' }}>
                    Sign In to Review
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor:'#DCFCE7', border:'1px solid #BBF7D0' }}>
                <CheckCircle size={18} style={{ color:'#166534' }} />
                <p className="text-sm font-semibold" style={{ color:'#166534' }}>You've already reviewed this item. Thank you!</p>
              </div>
            )}

            {/* Review list */}
            {reviews.length === 0 ? (
              <div className="text-center py-10" style={{ color:'#9C7B6B' }}>
                <Star size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No reviews yet</p>
                <p className="text-sm mt-1">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="rounded-2xl p-5" style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                          style={{ backgroundColor:'#800020' }}>
                          {r.user_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color:'#3D2B1F' }}>{r.user_name}</p>
                          <p className="text-xs" style={{ color:'#9C7B6B' }}>
                            {new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                          </p>
                        </div>
                      </div>
                      <StarRow rating={r.rating} size={14} />
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color:'#5C4B47' }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FAQs Tab ── */}
        {activeTab === 'faqs' && (
          <div className="space-y-2 mb-10">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)' }}>
                <button onClick={() => setOpenFaq(openFaq===i?null:i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="font-semibold text-sm pr-4" style={{ color:'#3D2B1F' }}>{faq.q}</span>
                  {openFaq===i ? <ChevronUp size={16} style={{ color:'#800020', flexShrink:0 }} /> : <ChevronDown size={16} style={{ color:'#9C7B6B', flexShrink:0 }} />}
                </button>
                {openFaq===i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed border-t" style={{ color:'#5C4B47', borderColor:'rgba(244,196,48,0.15)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Goes Best With ── */}
        {goesWith.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily:"'Playfair Display',serif", color:'#800020' }}>
              Goes Best With
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth:'none' }}>
              {goesWith.map(it => <MiniCard key={it.id} item={it} />)}
            </div>
          </div>
        )}

        {/* ── Combo Deal ── */}
        {goesWith.length > 0 && item && (
          <div className="rounded-2xl p-6 mb-10" style={{ background:'linear-gradient(135deg, #800020 0%, #5C0015 100%)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:'rgba(244,196,48,0.8)' }}>Combo Deal</p>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily:"'Playfair Display',serif" }}>
              Pair it perfectly
            </h3>
            <div className="flex items-center gap-4 flex-wrap mt-4">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />}
                <div>
                  <p className="text-white text-sm font-semibold">{item.name}</p>
                  <p className="text-white/70 text-xs">£{item.price.toFixed(2)}</p>
                </div>
              </div>
              <Plus size={20} style={{ color:'rgba(244,196,48,0.8)', flexShrink:0 }} />
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                {goesWith[0]?.image && <img src={goesWith[0].image} alt={goesWith[0].name} className="w-10 h-10 rounded-lg object-cover" />}
                <div>
                  <p className="text-white text-sm font-semibold">{goesWith[0]?.name}</p>
                  <p className="text-white/70 text-xs">£{goesWith[0]?.price?.toFixed(2)}</p>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white/60 text-xs line-through">£{(item.price + (goesWith[0]?.price||0)).toFixed(2)}</p>
                <p className="text-2xl font-bold" style={{ color:'#F4C430' }}>£{((item.price + (goesWith[0]?.price||0)) * 0.95).toFixed(2)}</p>
                <p className="text-xs" style={{ color:'rgba(244,196,48,0.7)' }}>Save 5% together</p>
              </div>
            </div>
            <button onClick={() => {
              addToCart({ ...item, price:`£${item.price.toFixed(2)}` });
              if (goesWith[0]) addToCart({ ...goesWith[0], price:`£${goesWith[0].price.toFixed(2)}` });
            }} className="mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
              style={{ backgroundColor:'#F4C430', color:'#3D2B1F' }}>
              Add Both to Cart
            </button>
          </div>
        )}

        {/* ── You May Also Like ── */}
        {similar.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily:"'Playfair Display',serif", color:'#800020' }}>
              You May Also Like
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth:'none' }}>
              {similar.map(it => <MiniCard key={it.id} item={it} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
