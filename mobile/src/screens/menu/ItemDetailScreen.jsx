import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, Alert,
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

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { itemId } = route.params;
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [social, setSocial] = useState({ likes: 0, order_count: 0, liked: false });
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    loadAll();
  }, [itemId]);

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

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  if (loading) return <LoadingScreen />;
  if (!item) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: item.image }} style={styles.hero} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={[styles.backCircle, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.backCircleText}>←</Text>
          </TouchableOpacity>
          <View style={[styles.topRight, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.iconCircle} onPress={handleLike}>
              <Text style={{ fontSize: 16 }}>{social.liked ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Meta row */}
          <View style={styles.metaRow}>
            <VegDot isVeg={item.is_veg} />
            <Text style={styles.categoryLabel}>{item.category} · {item.is_veg ? 'Pure Veg' : 'Non-Veg'}</Text>
          </View>

          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.spiceRow}>
            <SpiceFlames level={item.spice_level} />
            {social.order_count > 0 && (
              <Text style={styles.orderCount}>{social.order_count} orders</Text>
            )}
            {social.likes > 0 && (
              <Text style={styles.likeCount}>❤️ {social.likes}</Text>
            )}
          </View>

          <Text style={styles.price}>£{item.price?.toFixed(2)}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {item.allergens?.length > 0 && item.allergens[0] !== 'none' && (
            <View style={styles.allergenRow}>
              {item.allergens.map(a => <AllergenBadge key={a} label={a} />)}
            </View>
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

          {/* FAQs */}
          {item.faqs?.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>FAQs</Text>
              {item.faqs.map((faq, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.faqRow}
                  onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
                >
                  <Text style={styles.faqQ}>{faq.question}</Text>
                  <Text style={styles.faqToggle}>{expandedFaq === i ? '−' : '+'}</Text>
                  {expandedFaq === i && <Text style={styles.faqA}>{faq.answer}</Text>}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Reviews */}
          <View style={styles.divider} />
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {avgRating && <Text style={styles.avgRating}>{avgRating} ★</Text>}
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet — be the first.</Text>
          ) : (
            reviews.slice(0, 5).map((review, i) => (
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
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Add to Cart */}
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
  content: { padding: SPACING.xl, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20, backgroundColor: COLORS.warmWhite },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  categoryLabel: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.green, textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.brown, marginBottom: 8, lineHeight: 34 },
  spiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  orderCount: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  likeCount: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  price: { fontFamily: FONTS.bodyBold, fontSize: 24, color: COLORS.crimson, marginBottom: 10 },
  description: { fontFamily: FONTS.body, fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 12 },
  allergenRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  divider: { height: 1, backgroundColor: COLORS.lightGrey, marginVertical: 16 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.brown, marginBottom: 12 },
  pairsScroll: { marginBottom: 4 },
  pairChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 8, marginRight: 10, gap: 8, ...SHADOW.light, borderWidth: 1, borderColor: COLORS.border },
  pairImage: { width: 40, height: 40, borderRadius: RADIUS.md },
  pairBody: {},
  pairName: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown, maxWidth: 100 },
  pairPrice: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.crimson },
  faqRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  faqQ: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown, flex: 1, paddingRight: 24 },
  faqToggle: { position: 'absolute', right: 0, top: 12, fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.crimson },
  faqA: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, marginTop: 8, lineHeight: 20 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  avgRating: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.gold },
  noReviews: { fontFamily: FONTS.headingItalic, fontSize: 13, color: COLORS.grey },
  reviewCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 12, marginBottom: 10, ...SHADOW.light },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.white },
  reviewMeta: { flex: 1 },
  reviewName: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.brown },
  reviewDate: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  reviewStars: { color: COLORS.gold, fontSize: 12 },
  reviewComment: { fontFamily: FONTS.body, fontSize: 12, color: '#6B7280', lineHeight: 18 },
  stickyBar: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SPACING.xl, paddingTop: 12 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qBtn: { width: 34, height: 34, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  qBtnText: { fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.crimson, lineHeight: 22 },
  qCount: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.brown, minWidth: 20, textAlign: 'center' },
  addBtn: { flex: 1, backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 46, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
});
