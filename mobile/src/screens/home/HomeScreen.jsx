import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  TextInput, Image, RefreshControl,
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const CATEGORIES = [
  { id: 'all', label: '🍽 All' },
  { id: 'Svadista', label: '🍖 Svadista' },
  { id: 'Prasada', label: '🌿 Prasada' },
  { id: 'Breakfast', label: '🌅 Breakfast' },
  { id: 'Snacks', label: '🫙 Snacks' },
  { id: 'dabba', label: '📦 Dabba Wala' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { addToCart, cartCount } = useCart();

  const [postcode, setPostcode] = useState('');
  const [specials, setSpecials] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const pc = await AsyncStorage.getItem('ssp_postcode');
    if (pc) setPostcode(pc);

    try {
      const [specialsRes, trendingRes] = await Promise.all([
        api.get('/daily-specials').catch(() => ({ data: [] })),
        api.get('/menu?available=true&featured=true').catch(() => ({ data: [] })),
      ]);
      setSpecials(specialsRes.data || []);
      setTrending(trendingRes.data || []);
    } catch {}

    if (user) {
      try {
        const [ordersRes, subRes] = await Promise.all([
          api.get('/orders').catch(() => ({ data: [] })),
          api.get('/subscriptions').catch(() => ({ data: null })),
        ]);
        setRecentOrders(ordersRes.data?.slice(0, 5) || []);
        setSubscription(subRes.data);
      } catch {}
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategoryPress = (cat) => {
    if (cat.id === 'dabba') { navigation.navigate('DabbaWala'); return; }
    if (cat.id === 'all') { navigation.navigate('MenuTab'); return; }
    navigation.navigate('Category', { category: cat.id });
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.crimson} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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

        {/* Search */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Category', { category: 'all', showSearch: true })}
          activeOpacity={0.8}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search dishes, pickles, dabbas...</Text>
        </TouchableOpacity>

        {/* Category chips */}
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, activeCategory === item.id && styles.chipActive]}
              onPress={() => { setActiveCategory(item.id); handleCategoryPress(item); }}
            >
              <Text style={[styles.chipText, activeCategory === item.id && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Today's Specials */}
        {specials.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TODAY'S SPECIALS</Text>
              <Text style={styles.sectionSub}>Straight off this morning's stove</Text>
            </View>
            <FlatList
              horizontal
              data={specials}
              keyExtractor={(item) => item.id || item.title}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingVertical: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.specialCard}
                  onPress={() => item.link && navigation.navigate('ItemDetail', { itemId: item.link.replace('/item/', '') })}
                >
                  <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400' }} style={styles.specialImage} />
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today</Text>
                  </View>
                  <View style={styles.specialBody}>
                    <Text style={styles.specialName} numberOfLines={2}>{item.title}</Text>
                    {item.price != null && <Text style={styles.specialPrice}>£{item.price.toFixed(2)}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Order Again */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>ORDER AGAIN</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingVertical: 12, gap: 10 }}
              data={recentOrders.flatMap(o => o.items || []).slice(0, 6)}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reorderChip}
                  onPress={() => addToCart(item)}
                >
                  {item.image && <Image source={{ uri: item.image }} style={styles.reorderImage} />}
                  <Text style={styles.reorderName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.reorderPlus}>+</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Loved & Reordered */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>LOVED & REORDERED</Text>
              <Text style={styles.sectionSub}>The plates our families keep asking for</Text>
            </View>
            <FlatList
              horizontal
              data={trending}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingVertical: 12 }}
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

        {/* Dabba Wala card */}
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
                        : 'Active subscription'}
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
              <Text style={styles.dabbaCTATitle}>📦 The Dabba Wala</Text>
              <Text style={styles.dabbaCTASub}>A hot dabba, every day, like clockwork</Text>
              <View style={styles.dabbaCTABtn}>
                <Text style={styles.dabbaCTABtnText}>Start My Dabba →</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <CartBar onPress={() => navigation.navigate('Cart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: 12, paddingBottom: 8 },
  headerLeft: { flex: 1 },
  greeting: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.deepGold, marginBottom: 4 },
  locationChip: { backgroundColor: COLORS.lightGrey, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  locationText: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  cartBtn: { position: 'relative', padding: 4 },
  cartIcon: { fontSize: 22 },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.red, borderRadius: RADIUS.full, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 9, color: COLORS.white },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, marginHorizontal: SPACING.xl, marginVertical: 10, paddingHorizontal: 14, paddingVertical: 11 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchPlaceholder: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, flex: 1 },
  chips: { paddingHorizontal: SPACING.xl, paddingVertical: 6, gap: 8 },
  chip: { borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: COLORS.white },
  chipActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  chipText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  chipTextActive: { color: COLORS.white },
  section: { marginTop: 8 },
  sectionPad: { paddingHorizontal: SPACING.xl, marginTop: 8 },
  sectionHeader: { paddingHorizontal: SPACING.xl, paddingTop: 8 },
  sectionLabel: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 2 },
  sectionSub: { fontFamily: FONTS.headingItalic, fontSize: 11, color: COLORS.grey, marginTop: 2 },
  specialCard: { width: 155, backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, overflow: 'hidden', marginRight: 12, ...SHADOW.light },
  specialImage: { width: '100%', height: 85, resizeMode: 'cover' },
  todayBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.gold, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  todayBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 9, color: COLORS.brown, textTransform: 'uppercase' },
  specialBody: { padding: 8 },
  specialName: { fontFamily: FONTS.heading, fontSize: 12, color: COLORS.brown, marginBottom: 3 },
  specialPrice: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.crimson },
  reorderChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 7, gap: 6, ...SHADOW.light, borderWidth: 1, borderColor: COLORS.border },
  reorderImage: { width: 28, height: 28, borderRadius: RADIUS.full },
  reorderName: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown, maxWidth: 90 },
  reorderPlus: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.crimson },
  dabbaActive: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.card },
  dabbaGradient: { borderRadius: RADIUS.xl, padding: 18 },
  dabbaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dabbaTitle: { fontFamily: FONTS.heading, fontSize: 17, color: COLORS.white },
  dabbaSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.gold, marginTop: 4 },
  dabbaArrow: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: 'rgba(255,255,255,0.8)', textDecorationLine: 'underline' },
  dabbaCTA: { backgroundColor: COLORS.cream, borderRadius: RADIUS.xl, borderWidth: 1.5, borderColor: `${COLORS.crimson}30`, padding: 18, ...SHADOW.light },
  dabbaCTATitle: { fontFamily: FONTS.heading, fontSize: 17, color: COLORS.crimson },
  dabbaCTASub: { fontFamily: FONTS.headingItalic, fontSize: 12, color: COLORS.deepGold, marginTop: 4, marginBottom: 12 },
  dabbaCTABtn: { backgroundColor: COLORS.crimson, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  dabbaCTABtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.white },
});
