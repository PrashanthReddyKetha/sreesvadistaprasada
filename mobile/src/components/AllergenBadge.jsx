import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function AllergenBadge({ label }) {
  if (!label || label === 'none') return null;
  return (
    <View style={{
      backgroundColor: 'rgba(128,0,32,0.08)',
      borderRadius: 3,
      paddingHorizontal: 5,
      paddingVertical: 2,
      marginRight: 4,
      marginBottom: 2,
    }}>
      <Text style={{ fontSize: 8, fontFamily: FONTS.bodyBold, color: COLORS.crimson, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}
