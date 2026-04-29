import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function OrderConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params || {};

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const goHome = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
  };

  const goOrders = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs', state: { routes: [{ name: 'OrdersTab' }], index: 2 } }] }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
        <Text style={styles.checkMark}>✓</Text>
      </Animated.View>

      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <Text style={styles.heading}>Order Placed!</Text>
        {order?.order_number && (
          <Text style={styles.orderNum}>#{order.order_number}</Text>
        )}
        <Text style={styles.message}>
          Your food is being prepared.{'\n'}We'll notify you every step of the way.
        </Text>

        <View style={styles.etaChip}>
          <Text style={styles.etaText}>⏱ Ready in 45–60 minutes</Text>
        </View>
      </Animated.View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={goOrders}>
          <Text style={styles.primaryText}>Track Order →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={goHome}>
          <Text style={styles.ghostText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  checkCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  checkMark: { fontSize: 32, color: COLORS.white },
  heading: { fontFamily: FONTS.heading, fontSize: 32, color: COLORS.crimson, marginBottom: 6, textAlign: 'center' },
  orderNum: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, marginBottom: 14 },
  message: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.grey, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  etaChip: { backgroundColor: 'rgba(244,196,48,0.15)', borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 7, marginBottom: SPACING.xxxl },
  etaText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.deepGold },
  buttons: { width: '100%', gap: 10 },
  primaryBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.white },
  ghostBtn: { borderWidth: 1.5, borderColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 46, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.crimson },
});
