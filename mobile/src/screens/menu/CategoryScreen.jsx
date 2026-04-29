import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, Dimensions, RefreshControl,
} from 'react-native';
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
const CARD_WIDTH = (width - SPACING.xl * 2 - 12) / 2;

const FILTERS = ['All', 'Spicy', 'Mild', 'New'];

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { category, showSearch } = route.params || {};
  const { addToCart } = useCart();

  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams({ available: 'true' });
      if (category && category !== 'all') params.append('category', category);
      if (search) params.append('search', search);
      const res = await api.get(`/menu?${params}`);
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    let result = [...items];
    if (filter === 'Spicy') result = result.filter(i => i.spice_level > 1);
    if (filter === 'Mild') result = result.filter(i => !i.spice_level || i.spice_level <= 1);
    if (filter === 'New') result = result.filter(i => i.tag === 'New');
    setFiltered(result);
  }, [items, filter]);

  const categoryLabel = category && category !== 'all' ? `Sree ${category}` : 'All Menu';

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH }, SHADOW.card]}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
      activeOpacity={0.92}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.vegDot}><VegDot isVeg={item.is_veg} /></View>
        {item.tag && (
          <View style={[styles.tagBadge, { backgroundColor: item.tag === 'New' ? '#1D4ED8' : COLORS.gold }]}>
            <Text style={[styles.tagText, { color: item.tag === 'New' ? COLORS.white : COLORS.brown }]}>{item.tag}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        </View>
        <SpiceFlames level={item.spice_level} />
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        {item.allergens?.length > 0 && item.allergens[0] !== 'none' && (
          <View style={styles.allergens}>
            {item.allergens.slice(0, 2).map(a => <AllergenBadge key={a} label={a} />)}
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>£{item.price?.toFixed(2)}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryLabel}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes..."
          placeholderTextColor={COLORS.grey}
          value={search}
          onChangeText={setSearch}
          autoFocus={showSearch}
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Grid */}
      {loading ? (
        <EmptyState emoji="🍽" message="Loading the menu..." />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🔍" message="Nothing found. Try a different search or filter." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor={COLORS.crimson} />}
          renderItem={renderItem}
        />
      )}

      <CartBar onPress={() => navigation.navigate('Cart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: COLORS.crimson },
  headerTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.crimson },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, margin: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: COLORS.brown },
  filterList: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  filterChip: { borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: COLORS.white },
  filterActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  filterText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  filterTextActive: { color: COLORS.white },
  grid: { paddingHorizontal: SPACING.xl, paddingBottom: 80 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden' },
  imageWrap: { height: 120, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  vegDot: { position: 'absolute', top: 8, right: 8 },
  tagBadge: { position: 'absolute', top: 8, left: 8, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  tagText: { fontSize: 8, fontFamily: FONTS.bodyBold, textTransform: 'uppercase' },
  body: { padding: 10 },
  nameRow: { marginBottom: 2 },
  name: { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.brown },
  desc: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey, lineHeight: 15, marginTop: 3, marginBottom: 4 },
  allergens: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.crimson },
  addBtn: { backgroundColor: COLORS.crimson, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5 },
  addText: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.white },
});
