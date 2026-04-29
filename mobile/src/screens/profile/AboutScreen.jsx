import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

const VALUES = [
  { icon: '🌿', title: 'Pure Ingredients', body: 'No shortcuts. No additives. Just the same ingredients your grandmother used.' },
  { icon: '🔥', title: 'Cooked to Order', body: 'Every dabba packed fresh. Every order made with the care of a home kitchen.' },
  { icon: '🫶', title: 'Community First', body: 'A portion of every Prasada order supports local food banks in Milton Keynes.' },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Our Story" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800' }}
            style={styles.heroImage}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroContent}>
            <View style={styles.goldLine} />
            <Text style={styles.heroTitle}>Sree Svadista Prasada</Text>
            <Text style={styles.heroSub}>taste for your heart</Text>
          </View>
        </View>

        {/* Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where it began</Text>
          <Text style={styles.body}>
            It started with a steel dabba packed in Tirupati and opened in Milton Keynes. That smell — curry leaves hitting ghee, mustard seeds popping — is the smell of home.
          </Text>
          <Text style={styles.body}>
            Sree Svadista Prasada carries two kitchens inside it. Svadista — meaning "delicious" in Sanskrit — is bold, rustic, village-style Telugu cooking. Prasada — meaning "divine offering" — is pure vegetarian food prepared with complete devotion, as served in temples.
          </Text>
          <Text style={styles.body}>
            We cook for families who miss the real thing. For people who never had it and are about to find their new favourite. For anyone who wants food made with actual care.
          </Text>
        </View>

        {/* Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What we stand for</Text>
          {VALUES.map(v => (
            <View key={v.title} style={styles.valueRow}>
              <Text style={styles.valueIcon}>{v.icon}</Text>
              <View style={styles.valueText}>
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueBody}>{v.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Get in touch</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:+447700000000')}>
            <Text style={styles.contactLink}>📞 +44 7700 000 000</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:hello@sreesvadistaprasada.co.uk')}>
            <Text style={styles.contactLink}>✉️ hello@sreesvadistaprasada.co.uk</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://sreesvadistaprasada.vercel.app')}>
            <Text style={styles.contactLink}>🌐 sreesvadistaprasada.vercel.app</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  heroWrap: { height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, alignItems: 'center' },
  goldLine: { width: 32, height: 2, backgroundColor: COLORS.gold, marginBottom: 10 },
  heroTitle: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.white, textAlign: 'center' },
  heroSub: { fontFamily: FONTS.headingItalic, fontSize: 13, color: COLORS.gold, marginTop: 4 },
  section: { padding: SPACING.xl, paddingBottom: 0 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.brown, marginBottom: 12 },
  body: { fontFamily: FONTS.body, fontSize: 14, color: '#6B7280', lineHeight: 23, marginBottom: 12 },
  valueRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  valueIcon: { fontSize: 24, marginTop: 2 },
  valueText: { flex: 1 },
  valueTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown, marginBottom: 4 },
  valueBody: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, lineHeight: 20 },
  contactCard: { backgroundColor: COLORS.cream, borderRadius: RADIUS.xl, margin: SPACING.xl, padding: 16, gap: 10 },
  contactTitle: { fontFamily: FONTS.heading, fontSize: 17, color: COLORS.brown, marginBottom: 2 },
  contactLink: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.crimson },
});
