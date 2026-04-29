import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../api';
import { useCart } from '../../context/CartContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';

const STATUS_STEPS = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = { confirmed: 'Confirmed', preparing: 'Preparing', out_for_delivery: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled' };
const STATUS_ICONS = { confirmed: '✓', preparing: '🍳', out_for_delivery: '🛵', delivered: '🏠', cancelled: '✕' };
const STATUS_COLORS = { confirmed: '#1D4ED8', preparing: '#B45309', out_for_delivery: COLORS.green, delivered: COLORS.grey, cancelled: COLORS.red };

function StatusPill({ status }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${STATUS_COLORS[status] || COLORS.grey}18` }]}>
      <Text style={[styles.pillText, { color: STATUS_COLORS[status] || COLORS.grey }]}>
        {STATUS_ICONS[status]} {STATUS_LABELS[status] || status}
      </Text>
    </View>
  );
}

function ProgressTracker({ status }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <View style={styles.tracker}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <React.Fragment key={step}>
            <View style={styles.trackerStep}>
              <View style={[styles.stepCircle, done && styles.stepCircleDone, isCurrent && styles.stepCircleCurrent]}>
                <Text style={[styles.stepIcon, done && styles.stepIconDone]}>{STATUS_ICONS[step]}</Text>
              </View>
              <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{STATUS_LABELS[step]}</Text>
            </View>
            {i < STATUS_STEPS.length - 1 && (
              <View style={[styles.trackerLine, done && i < currentIndex && styles.trackerLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function OrderCard({ order, onReorder }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = !['delivered', 'cancelled'].includes(order.status);

  return (
    <TouchableOpacity
      style={[styles.orderCard, SHADOW.card]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.92}
    >
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.orderNum}>#{order.order_number || order.id?.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <StatusPill status={order.status} />
      </View>

      <Text style={styles.orderItems} numberOfLines={2}>
        {order.items?.map(i => i.name).join(', ')}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.orderTotal}>£{order.total_amount?.toFixed(2)}</Text>
        {!isActive && (
          <TouchableOpacity style={styles.reorderBtn} onPress={() => onReorder(order)}>
            <Text style={styles.reorderText}>Reorder</Text>
          </TouchableOpacity>
        )}
      </View>

      {isActive && <ProgressTracker status={order.status} />}

      {expanded && (
        <View style={styles.expandedItems}>
          {order.items?.map((item, i) => (
            <View key={i} style={styles.expandedItem}>
              <Text style={styles.expandedItemName}>{item.quantity}× {item.name}</Text>
              <Text style={styles.expandedItemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          {order.delivery_address && (
            <Text style={styles.expandedAddress}>📍 {order.delivery_address}</Text>
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

  const fetchOrders = useCallback(async () => {
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

  useFocusEffect(useCallback(() => { if (!isGuest) fetchOrders(); }, [fetchOrders, isGuest]));

  const handleReorder = (order) => {
    order.items?.forEach(item => addToCart(item));
    navigation.navigate('Cart');
  };

  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const past = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
  const displayed = tab === 'active' ? active : past;

  if (isGuest) return (
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['active', 'past'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active' ? 'Active' : 'Past'}
              {t === 'active' && active.length > 0 ? ` (${active.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <EmptyState emoji="📦" message="Loading your orders..." />
      ) : displayed.length === 0 ? (
        <EmptyState
          emoji="📦"
          message={tab === 'active' ? "Nothing cooking right now. Ready when you are." : "No past orders yet."}
          actionLabel={tab === 'active' ? "Order Now" : undefined}
          onAction={tab === 'active' ? () => navigation.navigate('MenuTab') : undefined}
        />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.crimson} />}
          renderItem={({ item }) => <OrderCard order={item} onReorder={handleReorder} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { paddingHorizontal: SPACING.xl, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  title: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.crimson },
  tabText: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.grey },
  tabTextActive: { color: COLORS.crimson, fontFamily: FONTS.bodySemiBold },
  list: { padding: SPACING.xl, gap: 12, paddingBottom: 80 },
  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderNum: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.brown },
  orderDate: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 2 },
  pill: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: FONTS.bodyBold, fontSize: 10, textTransform: 'uppercase' },
  orderItems: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderTotal: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.crimson },
  reorderBtn: { borderWidth: 1.5, borderColor: COLORS.crimson, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 6 },
  reorderText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.crimson },
  tracker: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  trackerStep: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.lightGrey, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepCircleDone: { backgroundColor: `${COLORS.crimson}18` },
  stepCircleCurrent: { backgroundColor: COLORS.crimson },
  stepIcon: { fontSize: 13 },
  stepIconDone: {},
  stepLabel: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.grey, textAlign: 'center' },
  stepLabelDone: { color: COLORS.crimson },
  trackerLine: { flex: 1, height: 2, backgroundColor: COLORS.lightGrey, marginTop: 15 },
  trackerLineDone: { backgroundColor: COLORS.crimson },
  expandedItems: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.lightGrey },
  expandedItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  expandedItemName: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, flex: 1 },
  expandedItemPrice: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown },
  expandedAddress: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 6 },
});
