import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  Image, RefreshControl, Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, SHADOW, RADIUS } from '../../constants/theme';
import DishCard from '../../components/DishCard';
import CartBar from '../../components/CartBar';

const { width } = Dimensions.get('window');
const BANNER_W = width - SPACING.xl * 2;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── hero banner slides ────────────────────────────────────
const BANNERS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&q=80',
    tag: 'Daily special',
    title: 'Chicken Dum Biryani',
    sub: 'Slow-cooked in sealed pot. Limited portions.',
    action: 'Order Now',
    screen: 'Category',
    params: { category: 'Svadista' },
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
    tag: 'The Dabba Wala',
    title: 'Fresh meals, Mon–Fri',
    sub: 'Subscribe once. Eat well every day.',
    action: 'Start My Dabba',
    screen: 'DabbaWala',
    params: {},
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    tag: 'Prasada kitchen',
    title: 'Pure vegetarian today',
    sub: 'Temple-style cooking. Made with devotion.',
    action: 'Explore',
    screen: 'Category',
    params: { category: 'Prasada' },
  },
];

const CATEGORIES = [
  { id: 'all',       label: '🍽 All',          screen: 'MenuTab' },
  { id: 'Svadista',  label: '🍖 Svadista',      screen: 'Category', params: { category: 'Svadista' } },
  { id: 'Prasada',   label: '🌿 Prasada',       screen: 'Category', params: { category: 'Prasada' } },
  { id: 'Breakfast', label: '🌅 Breakfast',     screen: 'Category', params: { category: 'Breakfast' } },
  { id: 'Snacks',    label: '🫙 Snacks',         screen: 'Category', params: { category: 'Snacks' } },
  { id: 'dabba',     label: '📦 Dabba Wala',    screen: 'DabbaWala' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { addToCart, cartCount } = useCart();

  const [postcode, setPostcode] = useState('');
  const [specials, setSpecials] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // banner auto-scroll
  const bannerRef = useRef(null);
  const bannerIdx = useRef(0);
  const bannerTimer = useRef(null);

  const startBannerTimer = () => {
    clearInterval(bannerTimer.current);
    bannerTimer.current = setInterval(() => {
      bannerIdx.current = (bannerIdx.current + 1) % BANNERS.length;
      bannerRef.current?.scrollToIndex({ index: bannerIdx.current, animated: true });
    }, 3800);
  };

  useEffect(() => {
    startBannerTimer();
    return () => clearInterval(bannerTimer.current);
  }, []);

  const loadData = useCallback(async () => {
    const pc = await AsyncStorage.getItem('ssp_postcode');
    if (pc) setPostcode(pc);

    try {
      const [specialsRes, trendingRes] = await Promise.all([
        api.get('/daily-specials').catch(() => ({ data: [] })),
        api.get('/menu?available=true&featured=true').catch(() => ({ data: [] })),
      ]);
      setSpecials(specialsRes.data?.slice(0, 8) || []);
      setTrending(trendingRes.data?.slice(0, 10) || []);
    } catch {}

    if (user) {
      try {
        const [ordersRes, subRes] = await Promise.all([
          api.get('/orders').catch(() => ({ data: [] })),
          api.get('/subscriptions').catch(() => ({ data: [] })),
        ]);
        const items = (ordersRes.data || [])
          .flatMap(o => o.items || [])
          .slice(0, 8);
        setRecentItems(items);
        const today = new Date().toISOString().split('T')[0];
        const active = (subRes.data || []).find(
          s => s.status === 'active' && (!s.end_date || s.end_date >= today)
        );
        setSubscription(active || null);
      } catch {}
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigate = (screen, params) => navigation.navigate(screen, params);
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.crimson} />}
      >
        {/* ── Header ─────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
            {postcode ? (
              <TouchableOpacity style={styles.locationChip}>
                <Text style={styles.locationText}>📍 {postcode}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.cartIcon}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search bar ─────────────────────────────── */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Category', { category: 'all', showSearch: true })}
          activeOpacity={0.8}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search dishes, pickles, dabbas...</Text>
        </TouchableOpacity>

        {/* ── Category chips ─────────────────────────── */}
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => navigate(item.screen, item.params)}
              activeOpacity={0.8}
            >
              <Text style={styles.chipText}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ── Hero banner (Zomato auto-scroll) ───────── */}
        <View style={styles.bannerWrap}>
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onScrollBeginDrag={() => clearInterval(bannerTimer.current)}
            onMomentumScrollEnd={(e) => {
              bannerIdx.current = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12));
              startBannerTimer();
            }}
            contentContainerStyle={{ gap: 12, paddingHorizontal: SPACING.xl }}
            snapToInterval={BANNER_W + 12}
            decelerationRate="fast"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bannerCard}
                onPress={() => navigate(item.screen, item.params)}
                activeOpacity={0.92}
              >
                <Image source={{ uri: item.image }} style={styles.bannerImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.bannerBody}>
                  <View style={styles.bannerTag}>
                    <Text style={styles.bannerTagText}>{item.tag}</Text>
                  </View>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSub}>{item.sub}</Text>
                  <View style={styles.bannerBtn}>
                    <Text style={styles.bannerBtnText}>{item.action} →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
          {/* Dot indicators */}
          <View style={styles.bannerDots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.bannerDot, bannerIdx.current === i && styles.bannerDotActive]} />
            ))}
          </View>
        </View>

        {/* ── Today's Specials ───────────────────────── */}
        {specials.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>TODAY'S SPECIALS</Text>
              <Text style={styles.sectionSub}>Straight off this morning's stove</Text>
            </View>
            <FlatList
              horizontal
              data={specials}
              keyExtractor={(item) => String(item.id || item.title)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.specialCard}
                  onPress={() => item.link && navigation.navigate('ItemDetail', { itemId: item.link.replace('/item/', '') })}
                  activeOpacity={0.88}
                >
                  <Image
                    source={{ uri: item.image || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400' }}
                    style={styles.specialImage}
                  />
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today</Text>
                  </View>
                  <View style={styles.specialBody}>
                    <Text style={styles.specialName} numberOfLines={2}>{item.title}</Text>
                    {item.price != null && <Text style={styles.specialPrice}>£{Number(item.price).toFixed(2)}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Order Again (Swiggy) ───────────────────── */}
        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>ORDER AGAIN</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.hList, { gap: 10 }]}
              data={recentItems}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reorderChip}
                  onPress={() => addToCart(item)}
                  activeOpacity={0.82}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.reorderImage} />
                  ) : null}
                  <Text style={styles.reorderName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.reorderPlus}>
                    <Text style={styles.reorderPlusText}>+</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Choose Your World (Uber Eats style) ────── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>CHOOSE YOUR WORLD</Text>
            <Text style={styles.sectionSub}>Two kitchens, one soul</Text>
          </View>
          <View style={styles.worldRow}>
            <TouchableOpacity
              style={[styles.worldCard, { marginRight: 6 }]}
              onPress={() => navigate('Category', { category: 'Svadista' })}
              activeOpacity={0.88}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=500&q=80' }}
                style={styles.worldImage}
              />
              <LinearGradient colors={['transparent', 'rgba(128,0,32,0.85)']} style={StyleSheet.absoluteFill} />
              <View style={styles.worldBody}>
                <Text style={styles.worldEmoji}>🍖</Text>
                <Text style={styles.worldName}>Svadista</Text>
                <Text style={styles.worldSub}>Bold · Non-veg</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.worldCard, { marginLeft: 6 }]}
              onPress={() => navigate('Category', { category: 'Prasada' })}
              activeOpacity={0.88}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80' }}
                style={styles.worldImage}
              />
              <LinearGradient colors={['transparent', 'rgba(74,124,89,0.85)']} style={StyleSheet.absoluteFill} />
              <View style={styles.worldBody}>
                <Text style={styles.worldEmoji}>🌿</Text>
                <Text style={styles.worldName}>Prasada</Text>
                <Text style={styles.worldSub}>Pure · Vegetarian</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Loved & Reordered (Zomato trending) ────── */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>LOVED & REORDERED</Text>
              <Text style={styles.sectionSub}>The plates our families keep asking for</Text>
            </View>
            <FlatList
              horizontal
              data={trending}
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => (
                <DishCard
                  item={item}
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  onAddToCart={addToCart}
                />
              )}
            />
          </View>
        )}

        {/* ── Dabba Wala CTA ─────────────────────────── */}
        <View style={styles.sectionPad}>
          {subscription ? (
            <TouchableOpacity
              style={styles.dabbaActive}
              onPress={() => navigation.navigate('DabbaWala')}
              activeOpacity={0.88}
            >
              <LinearGradient colors={[COLORS.crimson, '#5a0016']} style={styles.dabbaGradient}>
                <View style={styles.dabbaRow}>
                  <View>
                    <Text style={styles.dabbaTitle}>📦 Your Dabba</Text>
                    <Text style={styles.dabbaSub}>
                      {subscription.next_delivery
                        ? `Next delivery: ${new Date(subscription.next_delivery).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`
                        : `${subscription.plan} · ${subscription.box_type} box`}
                    </Text>
                  </View>
                  <Text style={styles.dabbaArrow}>Manage →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.dabbaCTA}
              onPress={() => navigation.navigate('DabbaWala')}
              activeOpacity={0.88}
            >
              <Text style={styles.dabbaCTATag}>THE DABBA WALA</Text>
              <Text style={styles.dabbaCTATitle}>A hot dabba, every day,{'\n'}like clockwork</Text>
              <Text style={styles.dabbaCTASub}>Mon–Fri · Packed fresh · Delivered warm</Text>
              <View style={styles.dabbaCTABtn}>
                <Text style={styles.dabbaCTABtnText}>Start My Dabba →</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── More to explore ────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>MORE TO EXPLORE</Text>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.hList, { gap: 10 }]}
            data={[
              { label: '🌅 Breakfast', screen: 'Category', params: { category: 'Breakfast' } },
              { label: '🫙 Snacks & Pickles', screen: 'Category', params: { category: 'Snacks' } },
              { label: '🌶 Street Food', screen: 'Category', params: { category: 'StreetFood' } },
              { label: '🌾 Ragi Specials', screen: 'Category', params: { category: 'RagiSpecials' } },
              { label: '🥤 Drinks', screen: 'Category', params: { category: 'Drinks' } },
            ]}
            keyExtractor={(item) => item.label}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exploreChip}
                onPress={() => navigate(item.screen, item.params)}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreChipText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <CartBar onPress={() => navigation.navigate('Cart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },

  // header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: 12, paddingBottom: 8 },
  greeting: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.deepGold, marginBottom: 4 },
  locationChip: { backgroundColor: COLORS.lightGrey, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  locationText: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  cartBtn: { position: 'relative', padding: 4 },
  cartIcon: { fontSize: 22 },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.red, borderRadius: RADIUS.full, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 9, color: COLORS.white },

  // search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, marginHorizontal: SPACING.xl, marginVertical: 10, paddingHorizontal: 14, paddingVertical: 11 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchPlaceholder: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, flex: 1 },

  // chips
  chips: { paddingHorizontal: SPACING.xl, paddingVertical: 6, gap: 8 },
  chip: { borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: COLORS.white },
  chipText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },

  // hero banner
  bannerWrap: { marginTop: 10, marginBottom: 4 },
  bannerCard: { width: BANNER_W, height: 175, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.card },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerBody: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  bannerTag: { backgroundColor: COLORS.gold, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 },
  bannerTagText: { fontFamily: FONTS.bodyBold, fontSize: 9, color: COLORS.brown, textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerTitle: { fontFamily: FONTS.heading, fontSize: 17, color: COLORS.white, marginBottom: 3 },
  bannerSub: { fontFamily: FONTS.body, fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  bannerBtn: { backgroundColor: COLORS.crimson, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  bannerBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.white },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  bannerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  bannerDotActive: { width: 14, backgroundColor: COLORS.crimson },

  // sections
  section: { marginTop: 10 },
  sectionPad: { paddingHorizontal: SPACING.xl, marginTop: 10 },
  sectionHead: { paddingHorizontal: SPACING.xl, paddingTop: 8, marginBottom: 2 },
  sectionLabel: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 2 },
  sectionSub: { fontFamily: FONTS.headingItalic, fontSize: 11, color: COLORS.grey, marginTop: 2 },
  hList: { paddingHorizontal: SPACING.xl, paddingVertical: 12 },

  // specials
  specialCard: { width: 150, backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, overflow: 'hidden', marginRight: 12, ...SHADOW.light },
  specialImage: { width: '100%', height: 90, resizeMode: 'cover' },
  todayBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.gold, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  todayBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 9, color: COLORS.brown, textTransform: 'uppercase' },
  specialBody: { padding: 8 },
  specialName: { fontFamily: FONTS.heading, fontSize: 12, color: COLORS.brown, marginBottom: 3 },
  specialPrice: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.crimson },

  // reorder
  reorderChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingLeft: 6, paddingRight: 10, paddingVertical: 6, ...SHADOW.light, borderWidth: 1, borderColor: COLORS.border },
  reorderImage: { width: 30, height: 30, borderRadius: RADIUS.full, marginRight: 8 },
  reorderName: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown, maxWidth: 90, marginRight: 6 },
  reorderPlus: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  reorderPlusText: { color: COLORS.white, fontSize: 14, lineHeight: 20 },

  // choose your world
  worldRow: { flexDirection: 'row', paddingHorizontal: SPACING.xl, paddingVertical: 12 },
  worldCard: { flex: 1, height: 140, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.card },
  worldImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  worldBody: { position: 'absolute', bottom: 12, left: 12 },
  worldEmoji: { fontSize: 20, marginBottom: 4 },
  worldName: { fontFamily: FONTS.heading, fontSize: 17, color: COLORS.white },
  worldSub: { fontFamily: FONTS.body, fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // dabba
  dabbaActive: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.card },
  dabbaGradient: { borderRadius: RADIUS.xl, padding: 18 },
  dabbaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dabbaTitle: { fontFamily: FONTS.heading, fontSize: 17, color: COLORS.white },
  dabbaSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.gold, marginTop: 4 },
  dabbaArrow: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: 'rgba(255,255,255,0.8)', textDecorationLine: 'underline' },
  dabbaCTA: { backgroundColor: COLORS.cream, borderRadius: RADIUS.xl, borderWidth: 1.5, borderColor: `${COLORS.crimson}30`, padding: 20, ...SHADOW.light },
  dabbaCTATag: { fontFamily: FONTS.bodyBold, fontSize: 9, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  dabbaCTATitle: { fontFamily: FONTS.heading, fontSize: 19, color: COLORS.crimson, lineHeight: 26, marginBottom: 6 },
  dabbaCTASub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, marginBottom: 14 },
  dabbaCTABtn: { backgroundColor: COLORS.crimson, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 9, alignSelf: 'flex-start' },
  dabbaCTABtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.white },

  // explore
  exploreChip: { borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: COLORS.white },
  exploreChipText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown },
});
