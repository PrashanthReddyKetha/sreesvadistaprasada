import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, Alert, TextInput, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import VegDot from '../../components/VegDot';
import SpiceFlames from '../../components/SpiceFlames';
import AllergenBadge from '../../components/AllergenBadge';
import LoadingScreen from '../../components/LoadingScreen';

const { width } = Dimensions.get('window');

const CATEGORY_FAQS = {
  Svadista: [
    { question: 'Is Svadista fully non-vegetarian?', answer: 'Yes — all Svadista dishes contain meat, eggs, or seafood. For pure veg options please see Sree Prasada.' },
    { question: 'How spicy are the dishes?', answer: 'We cook with authentic Telugu spice levels. Use the chilli indicators — 🌶🌶🌶 means bold heat.' },
    { question: 'Can I ask for milder spice?', answer: 'Yes. Leave a note at checkout and our chefs will adjust for you.' },
  ],
  Prasada: [
    { question: 'Is Prasada 100% vegetarian?', answer: 'Yes — Prasada is a pure vegetarian menu prepared in the sattvic tradition, without onion or garlic in most dishes.' },
    { question: 'Are Prasada dishes suitable for vegans?', answer: 'Several dishes are vegan-friendly. Look for the vegan tag or ask us when you order.' },
  ],
  Breakfast: [
    { question: 'What time do you stop taking breakfast orders?', answer: 'Breakfast items can be ordered until 11:30 AM on delivery days.' },
    { question: 'Are the batters freshly made?', answer: 'Yes — all idli and dosa batters are fermented fresh overnight.' },
  ],
  Snacks: [
    { question: 'How long do the pickles last?', answer: 'Our oil-based pickles last 3–6 months unopened, and up to 1 month after opening when refrigerated.' },
    { question: 'Are the podis freshly ground?', answer: 'Yes — all our podis are stone-ground fresh in small batches.' },
  ],
};

const GENERAL_FAQS = [
  { question: 'How long does delivery take?', answer: 'Typically 45–60 minutes depending on your area and order volume. You\'ll get an ETA when your order is confirmed.' },
  { question: 'What is the minimum order?', answer: 'Minimum order is £12 for delivery. Collection has no minimum.' },
  { question: 'Can I customise my order?', answer: 'Yes — use the notes field at checkout. We\'ll do our best to accommodate any requests.' },
  { question: 'Do you cater for events?', answer: 'Absolutely. Contact us through the Catering section for bespoke quotes for events of any size.' },
];

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { itemId } = route.params;
  const { addToCart } = useCart();
  const { user, logout } = useAuth();

  const [item, setItem] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [social, setSocial] = useState({ likes: 0, order_count: 0, liked: false });
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // FAQs
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Write review
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const reviewAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadAll(); }, [itemId]);

  const loadAll = async () => {
    try {
      const [itemRes, reviewsRes, socialRes] = await Promise.all([
        api.get(`/menu/${itemId}`),
        api.get(`/menu/${itemId}/reviews`).catch(() => ({ data: [] })),
        api.get(`/menu/${itemId}/social`).catch(() => ({ data: { likes: 0, order_count: 0, liked: false } })),
      ]);
      setItem(itemRes.data);
      setReviews(reviewsRes.data || []);
      setSocial(socialRes.data || { likes: 0, order_count: 0, liked: false });

      if (itemRes.data?.pairs_with?.length > 0) {
        const pairsRes = await Promise.all(
          itemRes.data.pairs_with.slice(0, 3).map(id => api.get(`/menu/${id}`).catch(() => null))
        );
        setPairs(pairsRes.filter(Boolean).map(r => r.data));
      }
    } catch {
      Alert.alert('', 'Something went quiet. Try again?');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) { Alert.alert('', 'Sign in to like dishes.'); return; }
    try {
      await api.post(`/menu/${itemId}/like`);
      setSocial(prev => ({ ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 }));
    } catch {}
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(item);
  };

  const handleAddCombo = (pair) => {
    addToCart(item);
    addToCart(pair);
  };

  const handleSubmitReview = async () => {
    if (!user) { Alert.alert('', 'Sign in to leave a review.'); return; }
    if (!reviewText.trim()) { Alert.alert('', 'Write a few words first.'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/menu/${itemId}/reviews`, { rating: reviewRating, comment: reviewText.trim() });
      setReviewDone(true);
      setReviewText('');
      Animated.timing(reviewAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      // Reload reviews
      const res = await api.get(`/menu/${itemId}/reviews`).catch(() => ({ data: reviews }));
      setReviews(res.data || []);
    } catch (e) {
      Alert.alert('', e?.response?.data?.detail || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  // Merge item FAQs + category FAQs
  const categoryFaqs = CATEGORY_FAQS[item?.category] || [];
  const allFaqs = [...(item?.faqs || []), ...categoryFaqs, ...GENERAL_FAQS];

  if (loading) return <LoadingScreen />;
  if (!item) return null;

  const comboPrice = pairs[0] ? (item.price + pairs[0].price) : null;
  const comboSaving = comboPrice ? (comboPrice * 0.05).toFixed(2) : null;
  const comboTotal = comboPrice ? (comboPrice * 0.95).toFixed(2) : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: item.image }} style={styles.hero} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'transparent']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={[styles.backCircle, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.backCircleText}>←</Text>
          </TouchableOpacity>
          <View style={[styles.topRight, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.iconCircle} onPress={handleLike}>
              <Text style={{ fontSize: 16 }}>{social.liked ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content sheet */}
        <View style={styles.content}>
          {/* Meta row */}
          <View style={styles.metaRow}>
            <VegDot isVeg={item.is_veg} />
            <Text style={styles.categoryLabel}>{item.category} · {item.is_veg ? 'Pure Veg' : 'Non-Veg'}</Text>
          </View>

          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.spiceRow}>
            <SpiceFlames level={item.spice_level} />
            {social.order_count > 0 && <Text style={styles.socialChip}>{social.order_count} orders</Text>}
            {social.likes > 0 && <Text style={styles.socialChip}>❤️ {social.likes}</Text>}
            {avgRating && <Text style={[styles.socialChip, { color: COLORS.gold }]}>★ {avgRating}</Text>}
          </View>

          <Text style={styles.price}>£{item.price?.toFixed(2)}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {item.allergens?.length > 0 && item.allergens[0] !== 'none' && (
            <View style={styles.allergenRow}>
              {item.allergens.map(a => <AllergenBadge key={a} label={a} />)}
            </View>
          )}

          {/* Combo deal (first pairs_with item) */}
          {pairs.length > 0 && comboSaving && (
            <>
              <View style={styles.divider} />
              <View style={styles.comboCard}>
                <LinearGradient
                  colors={['#FFF8E7', '#FFF3CD']}
                  style={styles.comboGradient}
                >
                  <Text style={styles.comboTag}>🎁 Combo Deal — Save £{comboSaving}</Text>
                  <View style={styles.comboRow}>
                    <Image source={{ uri: item.image }} style={styles.comboImg} />
                    <Text style={styles.comboPlusSign}>+</Text>
                    <Image source={{ uri: pairs[0].image }} style={styles.comboImg} />
                    <View style={styles.comboRight}>
                      <Text style={styles.comboNames} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.comboNames} numberOfLines={1}>{pairs[0].name}</Text>
                      <View style={styles.comboPriceRow}>
                        <Text style={styles.comboPriceOld}>£{comboPrice.toFixed(2)}</Text>
                        <Text style={styles.comboPriceNew}>£{comboTotal}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.comboBtn}
                    onPress={() => handleAddCombo(pairs[0])}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.comboBtnText}>Add Both to Cart</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </>
          )}

          {/* Goes Best With */}
          {pairs.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Goes Best With</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pairsScroll}>
                {pairs.map(pair => (
                  <TouchableOpacity
                    key={pair.id}
                    style={styles.pairChip}
                    onPress={() => navigation.push('ItemDetail', { itemId: pair.id })}
                  >
                    <Image source={{ uri: pair.image }} style={styles.pairImage} />
                    <View style={styles.pairBody}>
                      <Text style={styles.pairName} numberOfLines={1}>{pair.name}</Text>
                      <Text style={styles.pairPrice}>£{pair.price?.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Reviews section */}
          <View style={styles.divider} />
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {avgRating && (
              <View style={styles.ratingPill}>
                <Text style={styles.ratingPillText}>★ {avgRating}</Text>
              </View>
            )}
          </View>

          {/* Star distribution */}
          {reviews.length > 0 && (
            <View style={styles.starDistrib}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => r.rating === star).length;
                const pct = reviews.length ? count / reviews.length : 0;
                return (
                  <View key={star} style={styles.starRow}>
                    <Text style={styles.starLabel}>{star}★</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
                    </View>
                    <Text style={styles.starCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Write review */}
          {!reviewDone ? (
            <View style={styles.writeReview}>
              <Text style={styles.writeReviewTitle}>Leave a review</Text>
              {/* Star picker */}
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map(s => (
                  <TouchableOpacity key={s} onPress={() => setReviewRating(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={[styles.starPickerIcon, { color: s <= reviewRating ? COLORS.gold : COLORS.lightGrey }]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder={user ? 'Share what you loved...' : 'Sign in to write a review'}
                placeholderTextColor={COLORS.grey}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={3}
                editable={!!user}
              />
              <TouchableOpacity
                style={[styles.reviewSubmit, (!user || submittingReview) && { opacity: 0.5 }]}
                onPress={handleSubmitReview}
                disabled={!user || submittingReview}
              >
                <Text style={styles.reviewSubmitText}>{submittingReview ? 'Posting...' : 'Post Review'}</Text>
              </TouchableOpacity>
              {!user && (
                <TouchableOpacity onPress={logout}>
                  <Text style={styles.signInPrompt}>Sign in to post →</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Animated.View style={[styles.reviewSuccess, { opacity: reviewAnim }]}>
              <Text style={styles.reviewSuccessText}>✓ Review posted — thank you!</Text>
            </Animated.View>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet — be the first.</Text>
          ) : (
            reviews.slice(0, 6).map((review, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{review.user_name?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewName}>{review.user_name}</Text>
                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString('en-GB')}</Text>
                  </View>
                  <Text style={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
                </View>
                {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
              </View>
            ))
          )}

          {/* FAQs */}
          {allFaqs.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>FAQs</Text>
              {allFaqs.map((faq, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.faqRow}
                  onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqTop}>
                    <Text style={styles.faqQ}>{faq.question}</Text>
                    <Text style={styles.faqToggle}>{expandedFaq === i ? '−' : '+'}</Text>
                  </View>
                  {expandedFaq === i && <Text style={styles.faqA}>{faq.answer}</Text>}
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Add to Cart bar */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.quantityRow}>
          <TouchableOpacity style={styles.qBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
            <Text style={styles.qBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qCount}>{quantity}</Text>
          <TouchableOpacity style={styles.qBtn} onPress={() => setQuantity(q => q + 1)}>
            <Text style={styles.qBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
          <Text style={styles.addBtnText}>Add to Cart · £{(item.price * quantity).toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  heroWrap: { height: 280, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  backCircle: { position: 'absolute', left: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
  backCircleText: { fontSize: 18, color: COLORS.white },
  topRight: { position: 'absolute', right: 12, flexDirection: 'row', gap: 8 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },

  content: {
    padding: SPACING.xl,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    backgroundColor: COLORS.warmWhite,
  },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  categoryLabel: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: '#059669', textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.brown, marginBottom: 8, lineHeight: 34 },
  spiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  socialChip: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  price: { fontFamily: FONTS.bodyBold, fontSize: 24, color: COLORS.crimson, marginBottom: 10 },
  description: { fontFamily: FONTS.body, fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 12 },
  allergenRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4, gap: 4 },
  divider: { height: 1, backgroundColor: COLORS.lightGrey, marginVertical: 20 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.brown, marginBottom: 12 },

  // Combo card
  comboCard: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 4 },
  comboGradient: { padding: 16 },
  comboTag: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: '#92400E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  comboRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  comboImg: { width: 52, height: 52, borderRadius: RADIUS.md },
  comboPlusSign: { fontFamily: FONTS.bodyBold, fontSize: 16, color: '#92400E' },
  comboRight: { flex: 1 },
  comboNames: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown, marginBottom: 2 },
  comboPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  comboPriceOld: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, textDecorationLine: 'line-through' },
  comboPriceNew: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.crimson },
  comboBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 40, alignItems: 'center', justifyContent: 'center' },
  comboBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.white },

  // Goes Best With
  pairsScroll: { marginBottom: 4 },
  pairChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 8, marginRight: 10, gap: 8, ...SHADOW.light, borderWidth: 1, borderColor: COLORS.border },
  pairImage: { width: 40, height: 40, borderRadius: RADIUS.md },
  pairBody: {},
  pairName: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown, maxWidth: 100 },
  pairPrice: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.crimson },

  // Review header
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  ratingPill: { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  ratingPillText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.brown },

  // Star distribution
  starDistrib: { marginBottom: 16 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  starLabel: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, width: 24 },
  barTrack: { flex: 1, height: 5, backgroundColor: COLORS.lightGrey, borderRadius: 3 },
  barFill: { height: 5, backgroundColor: COLORS.gold, borderRadius: 3 },
  starCount: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, width: 16, textAlign: 'right' },

  // Write review
  writeReview: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, ...SHADOW.light },
  writeReviewTitle: { fontFamily: FONTS.heading, fontSize: 15, color: COLORS.brown, marginBottom: 10 },
  starPicker: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  starPickerIcon: { fontSize: 26 },
  reviewInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.brown,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  reviewSubmit: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 42, alignItems: 'center', justifyContent: 'center' },
  reviewSubmitText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.white },
  signInPrompt: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.crimson, textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },
  reviewSuccess: { backgroundColor: '#D1FAE5', borderRadius: RADIUS.md, padding: 12, marginBottom: 14, alignItems: 'center' },
  reviewSuccessText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: '#065F46' },

  noReviews: { fontFamily: FONTS.headingItalic, fontSize: 13, color: COLORS.grey, marginBottom: 12 },
  reviewCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 12, marginBottom: 10, ...SHADOW.light },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.white },
  reviewMeta: { flex: 1 },
  reviewName: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.brown },
  reviewDate: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  reviewStars: { color: COLORS.gold, fontSize: 12 },
  reviewComment: { fontFamily: FONTS.body, fontSize: 12, color: '#6B7280', lineHeight: 18 },

  // FAQs
  faqRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  faqTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  faqQ: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown, flex: 1, paddingRight: 16, lineHeight: 20 },
  faqToggle: { fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.crimson, lineHeight: 22 },
  faqA: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, marginTop: 8, lineHeight: 20 },

  // Sticky bar
  stickyBar: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SPACING.xl, paddingTop: 12 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qBtn: { width: 34, height: 34, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  qBtnText: { fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.crimson, lineHeight: 22 },
  qCount: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.brown, minWidth: 20, textAlign: 'center' },
  addBtn: { flex: 1, backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 46, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
});
