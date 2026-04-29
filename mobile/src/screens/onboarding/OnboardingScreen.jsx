import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800',
    heading: 'Two kitchens, one soul.',
    body: 'Svadista for the bold. Prasada for the pure.',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
    heading: 'A hot dabba, every day.',
    body: 'Weekly meal plans packed fresh and delivered to your door.',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    heading: 'Where shall we bring the warmth?',
    body: 'Tell us your postcode so we know what\'s on the way.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatRef = useRef(null);
  const [current, setCurrent] = useState(0);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      navigation.replace('Postcode');
    }
  };

  const skip = () => navigation.replace('Login');

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ width, height }}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.88)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
              <View style={styles.dots}>
                {SLIDES.map((_, i) => (
                  <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
                ))}
              </View>
              <Text style={styles.heading}>{item.heading}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      {current < SLIDES.length - 1 && (
        <TouchableOpacity style={[styles.skip, { top: insets.top + 12 }]} onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.nextBtn, { bottom: insets.bottom + 44 }]}
        onPress={goNext}
      >
        <Text style={styles.nextText}>{current === SLIDES.length - 1 ? "Let's Go →" : "Next →"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { ...StyleSheet.absoluteFillObject, width, height },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 18,
    backgroundColor: COLORS.gold,
  },
  heading: {
    fontFamily: FONTS.heading,
    fontSize: 30,
    color: COLORS.white,
    lineHeight: 38,
    marginBottom: 10,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 22,
  },
  skip: {
    position: 'absolute',
    right: 20,
    padding: 8,
  },
  skipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  nextBtn: {
    position: 'absolute',
    right: 32,
    backgroundColor: COLORS.crimson,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  nextText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.white,
  },
});
