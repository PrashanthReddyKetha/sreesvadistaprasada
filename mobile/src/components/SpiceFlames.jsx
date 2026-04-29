import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function SpiceFlames({ level = 0 }) {
  if (!level || level === 0) {
    return <Text style={{ fontSize: 10, color: COLORS.grey, fontFamily: FONTS.body }}>Mild</Text>;
  }
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array(Math.min(level, 3)).fill(0).map((_, i) => (
        <Text key={i} style={{ fontSize: 11 }}>🔥</Text>
      ))}
    </View>
  );
}
