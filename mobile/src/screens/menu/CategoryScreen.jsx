import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, Dimensions, RefreshControl, Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import VegDot from '../../components/VegDot';
import SpiceFlames from '../../components/SpiceFlames';
import AllergenBadge from '../../components/AllergenBadge';
import CartBar from '../../components/CartBar';
import EmptyState from '../../components/EmptyState';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const HERO_HEIGHT = 220;

const CATEGORY_CONFIG = {
  Svadista: {
    label: 'Sree Svadista',
    apiCategory: 'nonVeg',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    gradient: ['rgba(0,0,0,0)', 'rgba(100,30,30,0.5)', 'rgba(100,30,30,0.92)'],
    accent: '#FCA5A5',
    tabs: ['All', 'Starters', 'Egg Specials', 'Curries', 'Biriyani', 'Indo - Chinese', 'Rice Bowls'],
  },
  Prasada: {
    label: 'Sree Prasada',
    apiCategory: 'veg',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    gradient: ['rgba(0,0,0,0)', 'rgba(40,80,50,0.5)', 'rgba(40,80,50,0.92)'],
    accent: '#86EFAC',
    tabs: ['All', 'Starters and Evening Delights', 'Indo Chinese', 'Curries & Daal', 'Naivedyam', 'Biriyanis & Rice'],
  },
  Breakfast: {
    label: 'Breakfast',
    apiCategory: 'breakfast',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
    gradient: ['rgba(0,0,0,0)', 'rgba(120,70,20,0.5)', 'rgba(120,70,20,0.9)'],
    accent: COLORS.gold,
    tabs: ['All', 'Idli & Vada', 'Dosas', 'Poori & Others'],
  },
  Snacks: {
    label: 'Snacks & Pickles',
    apiCategories: ['pickles', 'podis'],
    tabField: 'category',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
    gradient: ['rgba(0,0,0,0)', 'rgba(80,50,20,0.5)', 'rgba(80,50,20,0.9)'],
    accent: COLORS.gold,
    tabs: ['All', 'pickles', 'podis'],
  },
  StreetFood: {
    label: 'Street Food',
    apiCategory: 'streetFood',
    image: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800',
    gradient: ['rgba(0,0,0,0)', 'rgba(150,80,0,0.5)', 'rgba(150,80,0,0.9)'],
    accent: '#FB923C',
    tabs: ['All'],
  },
  RagiSpecials: {
    label: 'Ragi Specials',
    apiCategory: 'ragiSpecials',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800',
    gradient: ['rgba(0,0,0,0)', 'rgba(80,40,10,0.5)', 'rgba(80,40,10,0.9)'],
    accent: '#D97706',
    tabs: ['All'],
  },
  Drinks: {
    label: 'Drinks',
    apiCategory: 'drinks',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    gradient: ['rgba(0,0,0,0)', 'rgba(2,100,160,0.5)', 'rgba(2,100,160,0.9)'],
    accent: '#38BDF8',
    tabs: ['All'],
  },
};

const DEFAULT_CONFIG = {
  label: 'Menu',
  apiCategory: 'all',
  image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
  gradient: ['rgba(0,0,0,0)', 'rgba(40,40,40,0.5)', 'rgba(40,40,40,0.9)'],
  accent: COLORS.gold,
  tabs: ['All'],
};

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params || {};
  const config = CATEGORY_CONFIG[category] || DEFAULT_CONFIG;

  const { cartItems, addToCart, removeFromCart } = useCart();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const tabsRef = useRef(null);

  const fetchItems = useCallback(async () => {
    try {
      const baseParams = { available: 'true' };
      if (search) baseParams.search = search;

      if (config.apiCategories) {
        const results = await Promise.all(
          config.apiCategories.map(cat => api.get('/menu', { params: { ...baseParams, category: cat } }))
        );
        setItems(results.flatMap(r => r.data || []));
      } else {
        const params = { ...baseParams };
        if (config.apiCategory && config.apiCategory !== 'all') {
          params.category = config.apiCategory;
        }
        const res = await api.get('/menu', { params });
        setItems(res.data || []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [config.apiCategory, config.apiCategories, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter((item) => {
    if (activeTab === 'All') return true;
    if (config.tabField === 'category') return item.category === activeTab;
    return item.subcategory === activeTab;
  });

  const getQty = (itemId) => {
    return cartItems.find((i) => i.id === itemId)?.quantity || 0;
  };

  // Header title opacity — fades in as hero scrolls away
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderItem = ({ item }) => {
    const qty = getQty(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, { width: CARD_WIDTH }, SHADOW.card]}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        activeOpacity={0.92}
      >
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
          <View style={styles.vegDot}><VegDot isVeg={item.is_veg} /></View>
          {item.tag && (
            <View style={[styles.tagBadge, { backgroundColor: item.tag === 'New' ? '#1D4ED8' : COLORS.gold }]}>
              <Text style={[styles.tagText, { color: item.tag === 'New' ? COLORS.white : COLORS.brown }]}>{item.tag}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <SpiceFlames level={item.spice_level} />
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          {item.allergens?.length > 0 && item.allergens[0] !== 'none' && (
            <View style={styles.allergens}>
              {item.allergens.slice(0, 2).map(a => <AllergenBadge key={a} label={a} />)}
            </View>
          )}
          <View style={styles.footer}>
            <Text style={styles.price}>£{item.price?.toFixed(2)}</Text>
            {qty === 0 ? (
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => removeFromCart(item.id)}>
                  <Text style={styles.stepIcon}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepQty}>{qty}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => addToCart(item)}>
                  <Text style={styles.stepIcon}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: config.image }} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient colors={config.gradient} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroContent, { paddingTop: insets.top + 56 }]}>
          <Text style={[styles.heroAccent, { color: config.accent }]}>{config.label}</Text>
          <Text style={styles.heroCount}>{items.length} dishes</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search in this menu..."
          placeholderTextColor={COLORS.grey}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Subcategory tabs */}
      {config.tabs.length > 1 && (
        <ScrollView
          ref={tabsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
        >
          {config.tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && { color: COLORS.white }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Result count */}
      <Text style={styles.resultCount}>{filtered.length} items</Text>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Floating back button — always visible */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* Sticky header (fades in when hero scrolls away) */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top, opacity: headerBgOpacity }]}>
        <Animated.Text style={[styles.stickyTitle, { opacity: headerTitleOpacity }]}>
          {config.label}
        </Animated.Text>
      </Animated.View>

      {loading ? (
        <EmptyState emoji="🍽" message="Loading the menu..." />
      ) : (
        <Animated.FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState emoji="🔍" message="Nothing found. Try a different search or tab." />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchItems(); }}
              tintColor={COLORS.crimson}
            />
          }
          renderItem={renderItem}
        />
      )}

      <CartBar onPress={() => navigation.navigate('Cart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },

  // Floating back button
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, color: COLORS.white, lineHeight: 22 },

  // Sticky header
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.warmWhite,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  stickyTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.crimson,
    textAlign: 'center',
  },

  // Hero
  hero: { height: HERO_HEIGHT, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroAccent: { fontFamily: FONTS.heading, fontSize: 28, marginBottom: 4 },
  heroCount: { fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: COLORS.brown },
  clearIcon: { fontSize: 12, color: COLORS.grey, padding: 4 },

  // Tabs
  tabList: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  tab: {
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
  },
  tabText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },

  // Result count
  resultCount: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.grey,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Grid
  grid: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 12 },

  // Card
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden' },
  imageWrap: { height: 130, position: 'relative' },
  image: { width: '100%', height: '100%' },
  vegDot: { position: 'absolute', top: 8, right: 8 },
  tagBadge: { position: 'absolute', top: 8, left: 8, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  tagText: { fontSize: 8, fontFamily: FONTS.bodyBold, textTransform: 'uppercase' },
  cardBody: { padding: 10 },
  name: { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.brown, marginBottom: 2 },
  desc: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey, lineHeight: 15, marginTop: 3, marginBottom: 4 },
  allergens: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.crimson },

  // Add button
  addBtn: { backgroundColor: COLORS.crimson, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5 },
  addText: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.white },

  // Inline stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.crimson,
    borderRadius: 5,
    overflow: 'hidden',
  },
  stepBtn: { paddingHorizontal: 8, paddingVertical: 5 },
  stepIcon: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.white, lineHeight: 16 },
  stepQty: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.white, minWidth: 18, textAlign: 'center' },
});
