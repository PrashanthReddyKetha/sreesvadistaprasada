import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';

function DeleteAction({ dragX, onDelete }) {
  const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.8], extrapolate: 'clamp' });
  return (
    <TouchableOpacity onPress={onDelete} style={styles.deleteAction} activeOpacity={0.85}>
      <Animated.Text style={[styles.deleteIcon, { transform: [{ scale }] }]}>🗑</Animated.Text>
    </TouchableOpacity>
  );
}

function CartRow({ item, onAdd, onRemove, onDelete }) {
  const swipeRef = useRef(null);

  const handleDelete = () => {
    swipeRef.current?.close();
    onDelete(item.id);
  };

  const renderRightActions = (progress, dragX) => (
    <DeleteAction dragX={dragX} onDelete={handleDelete} />
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} rightThreshold={40} overshootRight={false}>
      <View style={styles.cartItem}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.itemPrice}>£{item.price?.toFixed(2)} each</Text>
        </View>
        <View style={styles.itemRight}>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onRemove(item.id)}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepCount}>{item.quantity}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onAdd(item)}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.linePrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      </View>
    </Swipeable>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { cartItems, cartTotal, addToCart, removeFromCart, removeItemCompletely } = useCart();
  const { isGuest } = useAuth();

  const [orderType, setOrderType] = useState('delivery');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [upsell, setUpsell] = useState([]);

  const discount = promoApplied ? cartTotal * 0.15 : orderType === 'collection' ? cartTotal * 0.1 : 0;
  const deliveryFee = orderType === 'delivery' && cartTotal < 30 ? 2.99 : 0;
  const total = cartTotal - discount + deliveryFee;

  useEffect(() => {
    api.get('/menu', { params: { featured: 'true', available: 'true' } })
      .then(res => {
        const cartIds = new Set(cartItems.map(i => i.id));
        setUpsell((res.data || []).filter(i => !cartIds.has(i.id)).slice(0, 6));
      })
      .catch(() => {});
  }, []);

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'HOME15') {
      setPromoApplied(true);
      Alert.alert('🎁', '15% off applied!');
    } else {
      Alert.alert('', 'Invalid promo code.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Your Cart" />
        <EmptyState
          emoji="🛒"
          message="Your cart is empty — shall we fix that?"
          actionLabel="Browse Menu"
          onAction={() => navigation.navigate('MenuTab')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={`Cart (${cartItems.reduce((s, i) => s + i.quantity, 0)})`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Swipeable item rows */}
        <View style={styles.itemsSection}>
          <Text style={styles.swipeHint}>← Swipe left to remove</Text>
          {cartItems.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              onAdd={addToCart}
              onRemove={removeFromCart}
              onDelete={removeItemCompletely}
            />
          ))}
        </View>

        {/* Order type toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order Type</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, orderType === 'delivery' && styles.toggleActive]}
              onPress={() => setOrderType('delivery')}
            >
              <Text style={[styles.toggleText, orderType === 'delivery' && styles.toggleActiveText]}>🛵  Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, orderType === 'collection' && styles.toggleActive]}
              onPress={() => setOrderType('collection')}
            >
              <Text style={[styles.toggleText, orderType === 'collection' && styles.toggleActiveText]}>🏪  Collection</Text>
            </TouchableOpacity>
          </View>
          {orderType === 'collection' && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>✓ 10% off for collection</Text>
            </View>
          )}
          {orderType === 'delivery' && cartTotal < 30 && (
            <View style={styles.freeDeliveryBanner}>
              <Text style={styles.freeDeliveryText}>
                Add £{(30 - cartTotal).toFixed(2)} more for free delivery
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min((cartTotal / 30) * 100, 100)}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Promo code */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Promo Code</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter code"
              placeholderTextColor={COLORS.grey}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              editable={!promoApplied}
            />
            <TouchableOpacity
              style={[styles.promoBtn, promoApplied && { borderColor: COLORS.green }]}
              onPress={applyPromo}
              disabled={promoApplied}
            >
              <Text style={[styles.promoBtnText, promoApplied && { color: COLORS.green }]}>
                {promoApplied ? 'Applied ✓' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</Text>
            <Text style={styles.summaryVal}>£{cartTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery</Text>
            <Text style={[styles.summaryVal, deliveryFee === 0 && { color: '#059669' }]}>
              {deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : orderType === 'delivery' ? 'Free' : '—'}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: '#059669' }]}>Discount</Text>
              <Text style={[styles.summaryVal, { color: '#059669' }]}>−£{discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>£{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Upsell strip */}
        {upsell.length > 0 && (
          <View style={styles.upsellSection}>
            <Text style={styles.upsellTitle}>You might also like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upsellScroll}>
              {upsell.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.upsellCard}
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: item.image }} style={styles.upsellImage} />
                  <View style={styles.upsellBody}>
                    <Text style={styles.upsellName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.upsellFooter}>
                      <Text style={styles.upsellPrice}>£{item.price?.toFixed(2)}</Text>
                      <TouchableOpacity style={styles.upsellAdd} onPress={() => addToCart(item)}>
                        <Text style={styles.upsellAddText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Place Order CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={() => {
            if (isGuest) { navigation.navigate('Login'); return; }
            navigation.navigate('Checkout', { orderType, total, discount, deliveryFee });
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.placeOrderText}>Place Order · £{total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },

  // Items
  itemsSection: { paddingTop: 8 },
  swipeHint: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey, textAlign: 'right', paddingHorizontal: SPACING.xl, paddingBottom: 6 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey, gap: 12, backgroundColor: COLORS.warmWhite },
  itemImage: { width: 64, height: 64, borderRadius: RADIUS.md, resizeMode: 'cover' },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown, marginBottom: 3 },
  itemPrice: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.crimson, lineHeight: 20 },
  stepCount: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.brown, minWidth: 18, textAlign: 'center' },
  linePrice: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.crimson },

  // Swipe delete
  deleteAction: { width: 72, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  deleteIcon: { fontSize: 22 },

  // Section
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },

  // Toggle
  toggle: { flexDirection: 'row', backgroundColor: COLORS.lightGrey, borderRadius: RADIUS.md, padding: 3 },
  toggleBtn: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm },
  toggleActive: { backgroundColor: COLORS.white, ...SHADOW.light },
  toggleText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.grey },
  toggleActiveText: { color: COLORS.brown, fontFamily: FONTS.bodySemiBold },

  savingsBadge: { marginTop: 8, backgroundColor: 'rgba(5,150,105,0.1)', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start' },
  savingsBadgeText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: '#059669' },

  freeDeliveryBanner: { marginTop: 10 },
  freeDeliveryText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, marginBottom: 6 },
  progressTrack: { height: 4, backgroundColor: COLORS.lightGrey, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.crimson, borderRadius: 2 },

  // Promo
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInput: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown, backgroundColor: COLORS.white },
  promoBtn: { borderWidth: 1.5, borderColor: COLORS.crimson, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  promoBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.crimson },

  // Summary
  summaryCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, margin: SPACING.xl, padding: SPACING.lg, ...SHADOW.light },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryKey: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey },
  summaryVal: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown },
  summaryDivider: { height: 1, backgroundColor: COLORS.lightGrey, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalKey: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.brown },
  totalVal: { fontFamily: FONTS.bodyBold, fontSize: 20, color: COLORS.crimson },

  // Upsell
  upsellSection: { paddingHorizontal: SPACING.xl, paddingBottom: 12 },
  upsellTitle: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.brown, marginBottom: 12 },
  upsellScroll: { gap: 10 },
  upsellCard: { width: 130, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.light },
  upsellImage: { width: '100%', height: 80, resizeMode: 'cover' },
  upsellBody: { padding: 8 },
  upsellName: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.brown, marginBottom: 6, lineHeight: 16 },
  upsellFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upsellPrice: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.crimson },
  upsellAdd: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  upsellAddText: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.white, lineHeight: 18 },

  // Footer
  footer: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, paddingHorizontal: SPACING.xl, paddingTop: 12 },
  placeOrderBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 52, alignItems: 'center', justifyContent: 'center' },
  placeOrderText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.white },
});
