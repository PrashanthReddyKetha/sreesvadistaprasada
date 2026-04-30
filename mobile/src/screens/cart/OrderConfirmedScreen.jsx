import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function OrderConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params || {};

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 5 }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Gentle pulse on the check circle
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const goHome = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
  };

  const goOrders = () => {
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: 'Tabs', state: { routes: [{ name: 'OrdersTab' }], index: 2 } }],
    }));
  };

  const items = order?.items || [];
  const deliveryType = order?.delivery_type === 'delivery' ? 'Delivery' : 'Collection';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated check circle */}
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: Animated.multiply(checkScale, pulseAnim) }], opacity: checkOpacity }]}>
          <LinearGradient colors={['#059669', '#047857']} style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </LinearGradient>
          <View style={styles.checkRing} />
        </Animated.View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
          <Text style={styles.heading}>Order placed!</Text>
          {order?.order_number && (
            <View style={styles.orderNumChip}>
              <Text style={styles.orderNumText}>Order #{order.order_number}</Text>
            </View>
          )}
          <Text style={styles.message}>
            Your food is with our kitchen now.{'\n'}We'll have it with you shortly.
          </Text>

          {/* ETA + type */}
          <View style={styles.etaRow}>
            <View style={styles.etaChip}>
              <Text style={styles.etaText}>⏱  45–60 min</Text>
            </View>
            <View style={styles.etaChip}>
              <Text style={styles.etaText}>{deliveryType === 'Delivery' ? '🛵' : '🏪'}  {deliveryType}</Text>
            </View>
          </View>

          {/* Items summary */}
          {items.length > 0 && (
            <View style={styles.itemsCard}>
              <Text style={styles.itemsTitle}>What's on its way</Text>
              {items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{item.quantity}×</Text>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              {order?.total_amount !== undefined && (
                <>
                  <View style={styles.itemsDivider} />
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemName, { fontFamily: FONTS.bodyBold, color: COLORS.brown }]}>Total</Text>
                    <Text style={[styles.itemPrice, { fontFamily: FONTS.bodyBold, color: COLORS.crimson, fontSize: 15 }]}>
                      £{order.total_amount?.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Warm note */}
          <Text style={styles.warmNote}>
            "Every dish is made with complete love.{'\n'}Thank you for choosing us today."
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Buttons */}
      <View style={[styles.buttons, { paddingHorizontal: SPACING.xl }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={goOrders} activeOpacity={0.9}>
          <Text style={styles.primaryText}>Track Order →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={goHome} activeOpacity={0.8}>
          <Text style={styles.ghostText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  scroll: { alignItems: 'center', paddingTop: 40, paddingHorizontal: SPACING.xl, paddingBottom: 24 },

  checkWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 38, color: COLORS.white },
  checkRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(5,150,105,0.2)',
  },

  content: { alignItems: 'center', width: '100%' },
  heading: { fontFamily: FONTS.heading, fontSize: 34, color: COLORS.crimson, marginBottom: 10, textAlign: 'center' },

  orderNumChip: { backgroundColor: `${COLORS.crimson}12`, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 },
  orderNumText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.crimson },

  message: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.grey, textAlign: 'center', lineHeight: 22, marginBottom: 18 },

  etaRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  etaChip: { backgroundColor: 'rgba(244,196,48,0.15)', borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 },
  etaText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.deepGold },

  itemsCard: { width: '100%', backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.lightGrey },
  itemsTitle: { fontFamily: FONTS.heading, fontSize: 15, color: COLORS.brown, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  itemQty: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.crimson, width: 22 },
  itemName: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey },
  itemPrice: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown },
  itemsDivider: { height: 1, backgroundColor: COLORS.lightGrey, marginVertical: 8 },

  warmNote: {
    fontFamily: FONTS.headingItalic,
    fontSize: 13,
    color: COLORS.grey,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
    paddingHorizontal: 8,
  },

  buttons: { gap: 10 },
  primaryBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.white },
  ghostBtn: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.sm, height: 46, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown },
});
