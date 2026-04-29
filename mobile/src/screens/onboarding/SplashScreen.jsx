import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../../constants/theme';

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(12);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      const seen = await AsyncStorage.getItem('ssp_onboarded');
      navigation.replace(seen ? 'Login' : 'Onboarding');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ opacity, transform: [{ translateY }], alignItems: 'center' }}>
        <Text style={styles.logo}>Sree Svadista Prasada</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>taste for your heart</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: FONTS.heading,
    fontSize: 26,
    color: COLORS.crimson,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.gold,
    marginVertical: 14,
  },
  tagline: {
    fontFamily: FONTS.headingItalic,
    fontSize: 14,
    color: COLORS.deepGold,
    letterSpacing: 1,
  },
});
