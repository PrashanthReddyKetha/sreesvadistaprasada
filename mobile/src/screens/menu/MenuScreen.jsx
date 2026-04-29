import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const MENUS = [
  {
    id: 'Svadista',
    title: 'Sree Svadista',
    badge: '🔥 Non-Vegetarian',
    badgeColor: '#FCA5A5',
    sub: 'Bold, rustic, village-style. The spicy heart of Telugu non-veg cooking.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    gradient: ['transparent', 'rgba(139,58,58,0.6)', 'rgba(139,58,58,0.93)'],
  },
  {
    id: 'Prasada',
    title: 'Sree Prasada',
    badge: '🌿 Pure Vegetarian',
    badgeColor: '#86EFAC',
    sub: 'Divine, sattvic, temple-style. Pure food prepared with complete devotion.',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    gradient: ['transparent', 'rgba(74,124,89,0.6)', 'rgba(74,124,89,0.93)'],
  },
];

const SMALL_MENUS = [
  {
    id: 'Breakfast',
    title: 'Breakfast',
    sub: 'Start your day the Telugu way',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
  },
  {
    id: 'Snacks',
    title: 'Snacks & Pickles',
    sub: 'Small jars · big memories',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
  },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {MENUS.map((menu) => (
          <TouchableOpacity
            key={menu.id}
            style={styles.heroCard}
            onPress={() => navigation.navigate('Category', { category: menu.id })}
            activeOpacity={0.92}
          >
            <Image source={{ uri: menu.image }} style={styles.heroImage} />
            <LinearGradient colors={menu.gradient} style={StyleSheet.absoluteFill} />
            <View style={styles.heroContent}>
              <Text style={[styles.heroBadge, { color: menu.badgeColor }]}>{menu.badge}</Text>
              <Text style={styles.heroTitle}>{menu.title}</Text>
              <Text style={styles.heroSub}>{menu.sub}</Text>
              <Text style={styles.heroExplore}>Explore →</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.smallRow}>
          {SMALL_MENUS.map((menu) => (
            <TouchableOpacity
              key={menu.id}
              style={styles.smallCard}
              onPress={() => navigation.navigate('Category', { category: menu.id })}
              activeOpacity={0.92}
            >
              <Image source={{ uri: menu.image }} style={styles.smallImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
              <View style={styles.smallContent}>
                <Text style={styles.smallTitle}>{menu.title}</Text>
                <Text style={styles.smallSub}>{menu.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { paddingHorizontal: SPACING.xl, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  title: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson },
  heroCard: { height: 200, marginHorizontal: 16, marginTop: 12, borderRadius: RADIUS.xl, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18 },
  heroBadge: { fontFamily: FONTS.bodySemiBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  heroTitle: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.white, marginBottom: 4 },
  heroSub: { fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 18, marginBottom: 6 },
  heroExplore: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.white },
  smallRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 10, marginBottom: 12 },
  smallCard: { flex: 1, height: 130, borderRadius: RADIUS.lg, overflow: 'hidden' },
  smallImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  smallContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  smallTitle: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.white, marginBottom: 2 },
  smallSub: { fontFamily: FONTS.body, fontSize: 10, color: 'rgba(255,255,255,0.8)' },
});
