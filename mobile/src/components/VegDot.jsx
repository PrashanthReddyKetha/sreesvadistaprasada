import React from 'react';
import { View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function VegDot({ isVeg, size = 18 }) {
  const color = isVeg ? COLORS.green : COLORS.red;
  const dotSize = size * 0.44;
  return (
    <View style={{
      width: size, height: size,
      borderWidth: 2, borderColor: color,
      borderRadius: 3,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: COLORS.white,
    }}>
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize, backgroundColor: color }} />
    </View>
  );
}
