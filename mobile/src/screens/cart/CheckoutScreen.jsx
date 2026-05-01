import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

const DELIVERY_SLOTS = ['ASAP (~45 min)', '12:00–12:30', '12:30–13:00', '13:00–13:30', '18:00–18:30', '18:30–19:00', '19:00–19:30'];

const DOOR_INSTRUCTIONS = [
  { id: 'ring', label: 'Ring bell', emoji: '🔔' },
  { id: 'knock', label: 'Knock', emoji: '🤜' },
  { id: 'call', label: 'Call me', emoji: '📞' },
  { id: 'leave', label: 'Leave at door', emoji: '🚪' },
];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { orderType, discount } = route.params;
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  // Delivery rules (mirrors backend ZONES)
  const MIN_ORDER_DELIVERY = 15.0;
  const DELIVERY_FEE = 3.99;
  const FREE_DELIVERY_OVER = 30.0;
  const SMALL_ORDER_FEE = 1.99; // charged when delivery order < MIN_ORDER but > 0

  const subtotalAfterDiscount = cartTotal - discount;
  const isDelivery = orderType === 'delivery';

  // Compute delivery fee: free over £30, else £3.99; add small order fee if under £15
  const rawDeliveryFee = isDelivery
    ? (subtotalAfterDiscount >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE)
    : 0;
  const smallOrderFee = isDelivery && cartTotal < MIN_ORDER_DELIVERY ? SMALL_ORDER_FEE : 0;
  const deliveryFee = rawDeliveryFee;
  const total = subtotalAfterDiscount + deliveryFee + smallOrderFee;

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [slot, setSlot] = useState(DELIVERY_SLOTS[0]);
  const [doorInstruction, setDoorInstruction] = useState('ring');
  const [safePlace, setSafePlace] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [postcodeStatus, setPostcodeStatus] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('ssp_postcode').then(pc => { if (pc) setPostcode(pc); });
  }, []);

  // Check postcode when it changes
  useEffect(() => {
    if (postcode.trim().length < 5) { setPostcodeStatus(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/delivery/check', { postcode: postcode.trim().toUpperCase() });
        const ok = res.data.service_type === 'full';
        setPostcodeStatus({ ok, city: res.data.city });
        if (ok && res.data.city && !city) setCity(res.data.city);
      } catch { setPostcodeStatus(null); }
    }, 600);
    return () => clearTimeout(timer);
  }, [postcode]);

  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && (!address.trim() || !postcode.trim())) {
      Alert.alert('', 'Please enter your delivery address and postcode.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('', 'Please add a phone number so we can reach you.');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        customer_name: user?.name || 'Guest',
        customer_email: user?.email || 'guest@ssp.com',
        customer_phone: phone.trim(),
        delivery_type: orderType === 'delivery' ? 'delivery' : 'takeaway',
        delivery_address: {
          line1: orderType === 'delivery' ? address.trim() : '1 Greenleys',
          city: orderType === 'delivery' ? (city || 'Milton Keynes') : 'Milton Keynes',
          postcode: orderType === 'delivery' ? postcode.trim().toUpperCase() : 'MK12 6HG',
        },
        items: cartItems.map(i => ({
          menu_item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        notes: [
          slot !== DELIVERY_SLOTS[0] ? `Slot: ${slot}` : '',
          doorInstruction ? `Door: ${DOOR_INSTRUCTIONS.find(d => d.id === doorInstruction)?.label}` : '',
          doorInstruction === 'leave' && safePlace ? `Safe place: ${safePlace}` : '',
          instructions.trim(),
        ].filter(Boolean).join(' | ') || undefined,
        user_id: user?.id || undefined,
      };
      const res = await api.post('/orders', orderData);
      clearCart();
      navigation.replace('OrderConfirmed', { order: res.data });
    } catch (err) {
      Alert.alert('', err?.response?.data?.detail || 'Something went quiet. Try again?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Complete Order" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* Order type pill */}
          <View style={styles.section}>
            <View style={styles.typeCard}>
              <Text style={styles.typeIcon}>{orderType === 'delivery' ? '🛵' : '🏪'}</Text>
              <View>
                <Text style={styles.typeTitle}>{orderType === 'delivery' ? 'Delivery' : 'Collection'}</Text>
                <Text style={styles.typeSub}>
                  {orderType === 'collection'
                    ? '10% off applied · Collect from Greenleys, Milton Keynes'
                    : 'We bring it to your door'}
                </Text>
              </View>
            </View>
          </View>

          {/* Delivery address */}
          {orderType === 'delivery' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Delivery Address</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Street address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="House number and street name"
                  placeholderTextColor={COLORS.grey}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>City / Town</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Milton Keynes"
                  placeholderTextColor={COLORS.grey}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Postcode</Text>
                <TextInput
                  style={[styles.input, postcodeStatus && { borderColor: postcodeStatus.ok ? '#059669' : '#DC2626' }]}
                  placeholder="e.g. MK9 2FP"
                  placeholderTextColor={COLORS.grey}
                  value={postcode}
                  onChangeText={setPostcode}
                  autoCapitalize="characters"
                />
                {postcodeStatus && (
                  <Text style={[styles.postcodeMsg, { color: postcodeStatus.ok ? '#059669' : '#DC2626' }]}>
                    {postcodeStatus.ok ? `✓ We deliver to ${postcodeStatus.city}` : '✗ Outside our delivery area'}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Door instruction */}
          {orderType === 'delivery' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Door Instruction</Text>
              <View style={styles.doorGrid}>
                {DOOR_INSTRUCTIONS.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.doorChip, doorInstruction === d.id && styles.doorChipActive]}
                    onPress={() => setDoorInstruction(d.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doorEmoji}>{d.emoji}</Text>
                    <Text style={[styles.doorLabel, doorInstruction === d.id && styles.doorLabelActive]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {doorInstruction === 'leave' && (
                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  placeholder="Where shall we leave it? (e.g. porch, behind gate)"
                  placeholderTextColor={COLORS.grey}
                  value={safePlace}
                  onChangeText={setSafePlace}
                />
              )}
            </View>
          )}

          {/* Delivery slot */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Delivery Slot</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotScroll}>
              {DELIVERY_SLOTS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.slotChip, slot === s && styles.slotChipActive]}
                  onPress={() => setSlot(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.slotText, slot === s && styles.slotTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Contact</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="07xxx xxxxxx"
                placeholderTextColor={COLORS.grey}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Special instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Extra Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Allergies, spice level, anything else..."
              placeholderTextColor={COLORS.grey}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Minimum order warning */}
          {isDelivery && cartTotal < MIN_ORDER_DELIVERY && (
            <View style={[styles.section, { paddingTop: 0 }]}>
              <View style={styles.minOrderBanner}>
                <Text style={styles.minOrderText}>
                  ⚠️  Minimum order for delivery is £{MIN_ORDER_DELIVERY.toFixed(2)}.
                  A small order fee of £{SMALL_ORDER_FEE.toFixed(2)} applies.
                </Text>
              </View>
            </View>
          )}

          {/* Order summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.sectionLabel}>Order Summary</Text>
            {cartItems.slice(0, 4).map(item => (
              <View key={item.id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName} numberOfLines={1}>{item.quantity}× {item.name}</Text>
                <Text style={styles.summaryItemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            {cartItems.length > 4 && (
              <Text style={styles.moreItems}>+{cartItems.length - 4} more items</Text>
            )}
            <View style={styles.summaryDivider} />
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryKey, { color: '#059669' }]}>Discount</Text>
                <Text style={[styles.summaryVal, { color: '#059669' }]}>−£{discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Delivery</Text>
              <Text style={[styles.summaryVal, deliveryFee === 0 && isDelivery && { color: '#059669' }]}>
                {!isDelivery ? '—' : deliveryFee === 0 ? 'Free 🎉' : `£${deliveryFee.toFixed(2)}`}
              </Text>
            </View>
            {smallOrderFee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Small order fee</Text>
                <Text style={styles.summaryVal}>£{smallOrderFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment note */}
          <View style={styles.section}>
            <View style={styles.paymentNote}>
              <Text style={styles.paymentNoteText}>💳  Payment collected on delivery / at collection</Text>
              <Text style={styles.paymentNoteSub}>We accept cash and card. No online payment needed.</Text>
            </View>
          </View>

        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
            onPress={handlePlaceOrder}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.confirmText}>
              {loading ? 'Placing your order…' : `Confirm Order · £${total.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  section: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  sectionLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },

  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: `${COLORS.crimson}22` },
  typeIcon: { fontSize: 24 },
  typeTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown },
  typeSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, marginTop: 2 },

  field: { marginBottom: SPACING.md },
  fieldLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.white },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  postcodeMsg: { fontFamily: FONTS.bodyMedium, fontSize: 12, marginTop: 5 },

  doorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  doorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  doorChipActive: { borderColor: COLORS.crimson, backgroundColor: `${COLORS.crimson}10` },
  doorEmoji: { fontSize: 14 },
  doorLabel: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  doorLabelActive: { color: COLORS.crimson },

  slotScroll: { gap: 8, paddingBottom: 2 },
  slotChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  slotChipActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  slotText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  slotTextActive: { color: COLORS.white },

  summaryCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, margin: SPACING.xl, padding: SPACING.lg, ...SHADOW.light },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItemName: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, flex: 1 },
  summaryItemPrice: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown },
  moreItems: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginBottom: 8 },
  summaryDivider: { height: 1, backgroundColor: COLORS.lightGrey, marginVertical: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryKey: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey },
  summaryVal: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.brown },
  totalValue: { fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.crimson },

  minOrderBanner: { backgroundColor: 'rgba(234,179,8,0.12)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.4)', borderRadius: RADIUS.md, padding: 12, marginTop: SPACING.xl },
  minOrderText: { fontFamily: FONTS.body, fontSize: 12, color: '#92400E', lineHeight: 18 },
  paymentNote: { backgroundColor: COLORS.lightGrey, borderRadius: RADIUS.lg, padding: 14 },
  paymentNoteText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown },
  paymentNoteSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, marginTop: 4 },

  footer: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, paddingHorizontal: SPACING.xl, paddingTop: 12 },
  confirmBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 52, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.white },
});
