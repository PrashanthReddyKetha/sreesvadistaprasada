import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../../constants/theme';

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const dividerWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // stagger: logo fades up, then divider grows, then tagline fades in
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(translateY, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
      Animated.timing(dividerWidth, { toValue: 40, duration: 400, useNativeDriver: false }),
    ]).start();

    const timer = setTimeout(async () => {
      const seen = await AsyncStorage.getItem('ssp_onboarded');
      navigation.replace(seen ? 'Login' : 'Onboarding');
    }, 2600);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LinearGradient
      colors={['#5a0016', COLORS.crimson, '#a0002a', '#FDFBF7']}
      locations={[0, 0.35, 0.65, 1]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.logo}>Sree Svadista Prasada</Text>
        <Animated.View style={[styles.divider, { width: dividerWidth }]} />
        <Text style={styles.tagline}>taste for your heart</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 36,
    marginBottom: 20,
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.gold,
    marginBottom: 16,
  },
  tagline: {
    fontFamily: FONTS.headingItalic,
    fontSize: 15,
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 1.5,
  },
});
