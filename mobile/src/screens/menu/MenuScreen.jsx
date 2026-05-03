import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const HERO_MENUS = [
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

const MICRO_MENUS = [
  {
    id: 'StreetFood',
    title: 'Street Food',
    sub: 'Roadside bites',
    emoji: '🌮',
    color: '#F97316',
    image: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=400',
  },
  {
    id: 'RagiSpecials',
    title: 'Ragi Specials',
    sub: 'Ancient grain, bold taste',
    emoji: '🌾',
    color: '#92400E',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400',
  },
  {
    id: 'Drinks',
    title: 'Drinks',
    sub: 'Cool down or warm up',
    emoji: '🥤',
    color: '#0284C7',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
  },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.subtitle}>What are you craving today?</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero menus */}
        {HERO_MENUS.map((menu) => (
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

        {/* Small menus row */}
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

        {/* Section label */}
        <Text style={styles.sectionLabel}>More from our kitchen</Text>

        {/* Micro menus row */}
        <View style={styles.microRow}>
          {MICRO_MENUS.map((menu) => (
            <TouchableOpacity
              key={menu.id}
              style={styles.microCard}
              onPress={() => navigation.navigate('Category', { category: menu.id })}
              activeOpacity={0.9}
            >
              <Image source={{ uri: menu.image }} style={styles.microImage} />
              <LinearGradient
                colors={['transparent', `${menu.color}cc`, `${menu.color}ee`]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.microContent}>
                <Text style={styles.microEmoji}>{menu.emoji}</Text>
                <Text style={styles.microTitle}>{menu.title}</Text>
                <Text style={styles.microSub}>{menu.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dabba Wala CTA */}
        <TouchableOpacity
          style={styles.dabbaCta}
          onPress={() => navigation.navigate('YouTab', { screen: 'DabbaWala' })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.crimson, '#a0002a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dabbaGradient}
          >
            <View style={styles.dabbaLeft}>
              <Text style={styles.dabbaTag}>📦 Meal Plans</Text>
              <Text style={styles.dabbaTitle}>The Dabba Wala</Text>
              <Text style={styles.dabbaSub}>Weekly · Mon–Fri · From £9/meal</Text>
            </View>
            <Text style={styles.dabbaArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  title: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson },
  subtitle: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brown + '99', marginTop: 2 },

  heroCard: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18 },
  heroBadge: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.white, marginBottom: 4 },
  heroSub: { fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 18, marginBottom: 6 },
  heroExplore: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.white },

  smallRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 10 },
  smallCard: { flex: 1, height: 130, borderRadius: RADIUS.lg, overflow: 'hidden' },
  smallImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  smallContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  smallTitle: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.white, marginBottom: 2 },
  smallSub: { fontFamily: FONTS.body, fontSize: 10, color: 'rgba(255,255,255,0.8)' },

  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.brown + '99',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  microRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16 },
  microCard: {
    flex: 1,
    height: 110,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  microImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  microContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    alignItems: 'center',
  },
  microEmoji: { fontSize: 18, marginBottom: 2 },
  microTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.white, textAlign: 'center' },
  microSub: { fontFamily: FONTS.body, fontSize: 9, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 1 },

  dabbaCta: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  dabbaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  dabbaLeft: { flex: 1 },
  dabbaTag: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  dabbaTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.white, marginBottom: 3 },
  dabbaSub: { fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  dabbaArrow: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.gold },
});
