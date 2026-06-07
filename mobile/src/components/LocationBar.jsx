import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { usePostcode } from '../context/PostcodeContext';

/**
 * Persistent "Delivering to …" bar. Tap anywhere to open the postcode bottom sheet.
 * Used on HomeScreen, CartScreen, and optionally CategoryScreen.
 */
export default function LocationBar({ style }) {
  const { postcode, city, openSheet } = usePostcode();

  return (
    <TouchableOpacity style={[styles.bar, style]} onPress={openSheet} activeOpacity={0.75}>
      <Text style={styles.pin}>📍</Text>

      <View style={styles.textBlock}>
        <Text style={styles.label}>Delivering to</Text>
        {postcode ? (
          <Text style={styles.value} numberOfLines={1}>
            {city ? `${city}  ·  ${postcode}` : postcode}
          </Text>
        ) : (
          <Text style={styles.prompt}>Add your delivery location</Text>
        )}
      </View>

      <View style={styles.chevronWrap}>
        <Text style={styles.chevron}>▾</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.xl,
    marginBottom: 4,
  },
  pin: { fontSize: 15 },
  textBlock: { flex: 1, gap: 1 },
  label: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.grey,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.brown,
  },
  prompt: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.crimson,
  },
  chevronWrap: {
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.warmWhite,
    alignItems: 'center', justifyContent: 'center',
  },
  chevron: { fontSize: 11, color: COLORS.grey },
});
