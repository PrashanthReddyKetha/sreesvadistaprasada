import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&q=80',
    tag: 'Two kitchens',
    heading: 'Two kitchens,\none soul.',
    body: 'Svadista for the bold. Prasada for the pure.\nAuthentic South Indian food, made from the heart.',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
    tag: 'The Dabba Wala',
    heading: 'A hot dabba,\nevery day.',
    body: 'Weekly meal plans packed fresh and delivered\nto your door — Mon to Fri, like clockwork.',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    tag: 'Order anytime',
    heading: 'Real food.\nReal people.',
    body: 'Order à la carte, subscribe to a Dabba, or\ncater your next event. We cook it all with love.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
      setCurrent(current + 1);
    } else {
      navigation.replace('Postcode');
    }
  };

  const skip = () => navigation.replace('Login');

  const onMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrent(idx);
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.82)']}
              locations={[0.35, 0.65, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
              <View style={styles.tagRow}>
                <View style={styles.tagChip}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
              </View>
              <Text style={styles.heading}>{item.heading}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      {/* Skip button */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity
          style={[styles.skip, { top: insets.top + 14 }]}
          onPress={skip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 28 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 20, 6],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.88}>
          <Text style={styles.nextText}>
            {current === SLIDES.length - 1 ? "Let's Go →" : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { ...StyleSheet.absoluteFillObject, width, height, resizeMode: 'cover' },

  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  tagRow: { marginBottom: 14 },
  tagChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heading: {
    fontFamily: FONTS.heading,
    fontSize: 34,
    color: COLORS.white,
    lineHeight: 42,
    marginBottom: 12,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 22,
  },

  skip: {
    position: 'absolute',
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  skipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  nextBtn: {
    backgroundColor: COLORS.crimson,
    borderRadius: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  nextText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.white,
  },
});
