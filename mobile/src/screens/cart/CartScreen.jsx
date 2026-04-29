import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { cartItems, cartTotal, addToCart, removeFromCart, removeItemCompletely } = useCart();
  const { isGuest } = useAuth();
  const [orderType, setOrderType] = useState('delivery');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const discount = promoApplied ? cartTotal * 0.15 : orderType === 'collection' ? cartTotal * 0.1 : 0;
  const deliveryFee = orderType === 'delivery' && cartTotal < 30 ? 2.99 : 0;
  const total = cartTotal - discount + deliveryFee;

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
          onAction={() => { navigation.goBack(); navigation.navigate('MenuTab'); }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={`Your Cart (${cartItems.length})`} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Items */}
        <View style={styles.itemsSection}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>£{item.price?.toFixed(2)} each</Text>
              </View>
              <View style={styles.itemRight}>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => removeFromCart(item.id)}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepCount}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => addToCart(item)}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.linePrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order Type</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, orderType === 'delivery' && styles.toggleActive]}
              onPress={() => setOrderType('delivery')}
            >
              <Text style={[styles.toggleText, orderType === 'delivery' && styles.toggleActiveText]}>🛵 Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, orderType === 'collection' && styles.toggleActive]}
              onPress={() => setOrderType('collection')}
            >
              <Text style={[styles.toggleText, orderType === 'collection' && styles.toggleActiveText]}>🏪 Collection</Text>
            </TouchableOpacity>
          </View>
          {orderType === 'collection' && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>✓ 10% off applied for collection</Text>
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
            <TouchableOpacity style={styles.promoBtn} onPress={applyPromo} disabled={promoApplied}>
              <Text style={styles.promoBtnText}>{promoApplied ? 'Applied ✓' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        <View style={[styles.section, styles.summaryCard]}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryVal}>£{cartTotal.toFixed(2)}</Text>
          </View>
          {deliveryFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Delivery fee</Text>
              <Text style={styles.summaryVal}>£{deliveryFee.toFixed(2)}</Text>
            </View>
          )}
          {deliveryFee === 0 && orderType === 'delivery' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Delivery</Text>
              <Text style={[styles.summaryVal, { color: COLORS.green }]}>Free</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: COLORS.green }]}>Discount</Text>
              <Text style={[styles.summaryVal, { color: COLORS.green }]}>−£{discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>£{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={() => {
            if (isGuest) { navigation.navigate('Login'); return; }
            navigation.navigate('Checkout', { orderType, total, discount, deliveryFee });
          }}
        >
          <Text style={styles.placeOrderText}>Place Order · £{total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  itemsSection: { paddingHorizontal: SPACING.xl, paddingTop: 12 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey, gap: 12 },
  itemImage: { width: 64, height: 64, borderRadius: RADIUS.md, resizeMode: 'cover' },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown, marginBottom: 3 },
  itemPrice: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 28, height: 28, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.crimson, lineHeight: 20 },
  stepCount: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.brown, minWidth: 16, textAlign: 'center' },
  linePrice: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.crimson },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  toggle: { flexDirection: 'row', backgroundColor: COLORS.lightGrey, borderRadius: RADIUS.md, padding: 3 },
  toggleBtn: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm },
  toggleActive: { backgroundColor: COLORS.white, ...SHADOW.light },
  toggleText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.grey },
  toggleActiveText: { color: COLORS.brown, fontFamily: FONTS.bodySemiBold },
  discountBadge: { marginTop: 8, backgroundColor: 'rgba(74,124,89,0.1)', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start' },
  discountBadgeText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.green },
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInput: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown, backgroundColor: COLORS.white },
  promoBtn: { borderWidth: 1.5, borderColor: COLORS.crimson, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 11 },
  promoBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.crimson },
  summaryCard: { backgroundColor: COLORS.cream, borderRadius: RADIUS.xl, margin: SPACING.xl, padding: SPACING.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryKey: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey },
  summaryVal: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown },
  totalRow: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: 0 },
  totalKey: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.brown },
  totalVal: { fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.crimson },
  footer: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, paddingHorizontal: SPACING.xl, paddingTop: 12 },
  placeOrderBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 52, alignItems: 'center', justifyContent: 'center' },
  placeOrderText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.white },
});
