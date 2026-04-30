import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import EmptyState from '../../components/EmptyState';

const STEPS = [
  { key: 'confirmed',        icon: '✓',  label: 'Order confirmed',       sub: 'We\'ve received your order' },
  { key: 'preparing',        icon: '🍳', label: 'Being prepared',         sub: 'Our chefs are on it' },
  { key: 'out_for_delivery', icon: '🛵', label: 'On the way',             sub: 'Your food is heading to you' },
  { key: 'delivered',        icon: '🏠', label: 'Delivered',              sub: 'Enjoy your meal!' },
];

const STATUS_COLORS = {
  confirmed: '#1D4ED8',
  preparing: '#B45309',
  out_for_delivery: '#059669',
  delivered: COLORS.crimson,
  cancelled: '#DC2626',
};

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function StatusPill({ status }) {
  const color = STATUS_COLORS[status] || COLORS.grey;
  return (
    <View style={[styles.pill, { backgroundColor: `${color}18` }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

function VerticalTimeline({ status }) {
  const currentIdx = STEPS.findIndex(s => s.key === status);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentIdx < STEPS.length - 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [currentIdx]);

  return (
    <View style={styles.timeline}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const pending = i > currentIdx;
        return (
          <View key={step.key} style={styles.timelineRow}>
            {/* Line + dot column */}
            <View style={styles.dotCol}>
              {i > 0 && (
                <View style={[styles.timelineLine, (done || active) && styles.timelineLineDone]} />
              )}
              <Animated.View style={[
                styles.dot,
                done && styles.dotDone,
                active && styles.dotActive,
                pending && styles.dotPending,
                active && { transform: [{ scale: pulseAnim }] },
              ]}>
                <Text style={[styles.dotIcon, (done || active) && styles.dotIconActive]}>{step.icon}</Text>
              </Animated.View>
            </View>
            {/* Text column */}
            <View style={[styles.stepText, i < STEPS.length - 1 && styles.stepTextMargin]}>
              <Text style={[styles.stepLabel, (done || active) && { color: COLORS.brown }]}>{step.label}</Text>
              {active && <Text style={styles.stepSub}>{step.sub}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function OrderCard({ order, onReorder }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = !['delivered', 'cancelled'].includes(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <TouchableOpacity
      style={[styles.orderCard, SHADOW.card, isActive && styles.orderCardActive]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.92}
    >
      {/* Active indicator strip */}
      {isActive && <View style={styles.activeStrip} />}

      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNum}>
            #{order.order_number || order.id?.slice(-6).toUpperCase()}
          </Text>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}
            {order.delivery_type === 'delivery' ? '🛵 Delivery' : '🏪 Collection'}
          </Text>
        </View>
        <StatusPill status={order.status} />
      </View>

      <Text style={styles.orderItems} numberOfLines={2}>
        {order.items?.map(i => `${i.quantity > 1 ? `${i.quantity}× ` : ''}${i.name}`).join(', ')}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.orderTotal}>£{(order.total ?? order.total_amount ?? 0).toFixed(2)}</Text>
        {!isActive && !isCancelled && (
          <TouchableOpacity style={styles.reorderBtn} onPress={() => onReorder(order)} activeOpacity={0.8}>
            <Text style={styles.reorderText}>Reorder →</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.expandHint}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Active: vertical timeline */}
      {isActive && (
        <View style={styles.timelineWrap}>
          <VerticalTimeline status={order.status} />
          {order.status === 'out_for_delivery' && (
            <View style={styles.etaBanner}>
              <Text style={styles.etaBannerText}>⏱  ETA 10–15 minutes</Text>
            </View>
          )}
          {order.status === 'confirmed' && (
            <View style={styles.etaBanner}>
              <Text style={styles.etaBannerText}>⏱  Estimated 45–60 minutes</Text>
            </View>
          )}
        </View>
      )}

      {/* Expanded: item list + address */}
      {expanded && (
        <View style={styles.expandedWrap}>
          <View style={styles.expandedDivider} />
          {order.items?.map((item, i) => (
            <View key={i} style={styles.expandedItem}>
              <Text style={styles.expandedItemName}>{item.quantity}× {item.name}</Text>
              <Text style={styles.expandedItemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          {order.delivery_address && (
            <Text style={styles.expandedAddress}>
              📍 {typeof order.delivery_address === 'string'
                ? order.delivery_address
                : `${order.delivery_address.line1}, ${order.delivery_address.city} ${order.delivery_address.postcode}`}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { isGuest } = useAuth();
  const [tab, setTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(prev => orders.length === 0 ? true : prev);
    try {
      const res = await api.get('/orders');
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (isGuest) return;
    fetchOrders();
    // Poll every 30s if there are active orders
    pollRef.current = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchOrders, isGuest]));

  const handleReorder = (order) => {
    order.items?.forEach(item => addToCart({
      id: item.menu_item_id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    }));
    navigation.navigate('Cart');
  };

  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const past = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
  const displayed = tab === 'active' ? active : past;

  if (isGuest) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>Orders</Text></View>
        <EmptyState
          emoji="📦"
          message="Sign in to track your orders and reorder your favourites."
          actionLabel="Sign In"
          onAction={() => navigation.navigate('Login')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        {active.length > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{active.length} active</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'active', label: `Active${active.length > 0 ? ` (${active.length})` : ''}` },
          { key: 'past', label: `Past${past.length > 0 ? ` (${past.length})` : ''}` },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <EmptyState emoji="📦" message="Loading your orders..." />
      ) : displayed.length === 0 ? (
        <EmptyState
          emoji="📦"
          message={tab === 'active' ? 'Nothing cooking right now. Ready when you are.' : 'No past orders yet.'}
          actionLabel={tab === 'active' ? 'Order Now' : undefined}
          onAction={tab === 'active' ? () => navigation.navigate('MenuTab') : undefined}
        />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor={COLORS.crimson}
            />
          }
          renderItem={({ item }) => <OrderCard order={item} onReorder={handleReorder} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.xl, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  title: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson, flex: 1 },
  activeBadge: { backgroundColor: `${COLORS.crimson}15`, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.crimson },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.crimson },
  tabText: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.grey },
  tabTextActive: { color: COLORS.crimson, fontFamily: FONTS.bodySemiBold },

  list: { padding: SPACING.xl, gap: 12, paddingBottom: 100 },

  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, overflow: 'hidden' },
  orderCardActive: { borderWidth: 1.5, borderColor: `${COLORS.crimson}30` },
  activeStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: COLORS.crimson, borderTopLeftRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.xl },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingLeft: 8 },
  orderNum: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.brown },
  orderDate: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: FONTS.bodyBold, fontSize: 10, textTransform: 'uppercase' },
  orderItems: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, lineHeight: 18, marginBottom: 10, paddingLeft: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingLeft: 8 },
  orderTotal: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.crimson, flex: 1 },
  reorderBtn: { borderWidth: 1.5, borderColor: COLORS.crimson, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  reorderText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.crimson },
  expandHint: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey },

  // Vertical timeline
  timelineWrap: { paddingLeft: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.lightGrey },
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dotCol: { alignItems: 'center', width: 32 },
  timelineLine: { width: 2, height: 22, backgroundColor: COLORS.lightGrey },
  timelineLineDone: { backgroundColor: COLORS.crimson },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.lightGrey, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: `${COLORS.crimson}20` },
  dotActive: { backgroundColor: COLORS.crimson },
  dotPending: { backgroundColor: COLORS.lightGrey },
  dotIcon: { fontSize: 12 },
  dotIconActive: {},
  stepText: { flex: 1, paddingLeft: 10, paddingTop: 4 },
  stepTextMargin: { paddingBottom: 14 },
  stepLabel: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.grey },
  stepSub: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 1 },

  etaBanner: { marginTop: 10, backgroundColor: 'rgba(244,196,48,0.12)', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start' },
  etaBannerText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.deepGold },

  // Expanded
  expandedWrap: { paddingLeft: 8 },
  expandedDivider: { height: 1, backgroundColor: COLORS.lightGrey, marginVertical: 10 },
  expandedItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  expandedItemName: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, flex: 1 },
  expandedItemPrice: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown },
  expandedAddress: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 6 },
});
