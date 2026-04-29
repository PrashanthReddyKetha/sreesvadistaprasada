import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function EmptyState({ emoji = '🍽', message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  message: {
    fontFamily: FONTS.headingItalic,
    fontSize: 16,
    color: COLORS.brown,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  btn: {
    backgroundColor: COLORS.crimson,
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.white,
  },
});
