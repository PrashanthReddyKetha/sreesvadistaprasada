import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';
import { useCart } from '../context/CartContext';

export default function CartBar({ onPress }) {
  const { cartCount, cartTotal } = useCart();
  const slideAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: cartCount > 0 ? 0 : 80,
      useNativeDriver: true,
    }).start();
  }, [cartCount]);

  if (cartCount === 0) return null;

  return (
    <Animated.View style={[styles.bar, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity style={styles.inner} onPress={onPress} activeOpacity={0.9}>
        <Text style={styles.count}>{cartCount} {cartCount === 1 ? 'item' : 'items'}</Text>
        <Text style={styles.total}>£{cartTotal.toFixed(2)}  View Cart →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  inner: {
    backgroundColor: COLORS.crimson,
    borderRadius: RADIUS.xl,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  count: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.white,
  },
  total: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.white,
  },
});
