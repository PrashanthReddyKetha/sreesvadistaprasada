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

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { orderType, total, discount, deliveryFee } = route.params;
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [postcode, setPostcode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('ssp_postcode').then(pc => { if (pc) setPostcode(pc); });
  }, []);

  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && (!postcode || !address)) {
      Alert.alert('', 'Please enter your delivery address and postcode.');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        customer_name: user?.name || 'Guest',
        customer_email: user?.email || 'guest@ssp.com',
        customer_phone: phone || user?.phone || '00000000000',
        delivery_type: orderType === 'delivery' ? 'delivery' : 'takeaway',
        delivery_address: {
          line1: orderType === 'delivery' ? address : '1 Greenleys',
          city: orderType === 'delivery' ? 'Milton Keynes' : 'Milton Keynes',
          postcode: orderType === 'delivery' ? postcode : 'MK12 6HG',
        },
        items: cartItems.map(i => ({
          menu_item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        notes: instructions || undefined,
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

          {/* Order type reminder */}
          <View style={styles.section}>
            <View style={styles.typeCard}>
              <Text style={styles.typeIcon}>{orderType === 'delivery' ? '🛵' : '🏪'}</Text>
              <View>
                <Text style={styles.typeTitle}>{orderType === 'delivery' ? 'Delivery' : 'Collection'}</Text>
                <Text style={styles.typeSub}>
                  {orderType === 'collection' ? '10% off applied · Pick up from Greenleys, MK' : 'Delivered to your door'}
                </Text>
              </View>
            </View>
          </View>

          {/* Delivery details */}
          {orderType === 'delivery' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Delivery Details</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="House / flat number and street"
                  placeholderTextColor={COLORS.grey}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Postcode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MK9 2FP"
                  placeholderTextColor={COLORS.grey}
                  value={postcode}
                  onChangeText={setPostcode}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          )}

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
            <Text style={styles.sectionLabel}>Special Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Allergies, spice preferences, gate codes..."
              placeholderTextColor={COLORS.grey}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Order summary */}
          <View style={[styles.section, styles.summaryCard]}>
            <Text style={styles.sectionLabel}>Order Summary</Text>
            {cartItems.slice(0, 3).map(item => (
              <View key={item.id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName} numberOfLines={1}>{item.quantity}× {item.name}</Text>
                <Text style={styles.summaryItemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            {cartItems.length > 3 && <Text style={styles.moreItems}>+{cartItems.length - 3} more items</Text>}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment note */}
          <View style={styles.section}>
            <View style={styles.paymentNote}>
              <Text style={styles.paymentNoteText}>💳 Payment collected on delivery / at collection</Text>
              <Text style={styles.paymentNoteSub}>We accept cash and card.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handlePlaceOrder} disabled={loading}>
            <Text style={styles.confirmText}>{loading ? 'Placing order...' : `Confirm Order · £${total.toFixed(2)}`}</Text>
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
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: `${COLORS.crimson}20` },
  typeIcon: { fontSize: 24 },
  typeTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown },
  typeSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, marginTop: 2 },
  field: { marginBottom: SPACING.md },
  fieldLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.white },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  summaryCard: { backgroundColor: COLORS.cream, borderRadius: RADIUS.xl, margin: SPACING.xl, padding: SPACING.lg },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItemName: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, flex: 1 },
  summaryItemPrice: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown },
  moreItems: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginBottom: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.brown },
  totalValue: { fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.crimson },
  paymentNote: { backgroundColor: COLORS.lightGrey, borderRadius: RADIUS.lg, padding: 14 },
  paymentNoteText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown },
  paymentNoteSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, marginTop: 4 },
  footer: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, paddingHorizontal: SPACING.xl, paddingTop: 12 },
  confirmBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 52, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.white },
});
