import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

function MenuRow({ icon, label, sub, onPress, danger, badge }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuRowBody}>
        <Text style={[styles.menuLabel, danger && { color: '#DC2626' }]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {badge ? (
        <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
      ) : !danger ? (
        <Text style={styles.chevron}>›</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, isGuest, logout } = useAuth();

  // Always call hooks before any early return
  const [loyaltyStatus, setLoyaltyStatus] = useState({ loyalty_order_count: 0, pending_reward: false, orders_until_next: 5 });
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);

  useEffect(() => {
    if (isGuest) return;
    api.get('/loyalty/status').then(r => setLoyaltyStatus(r.data || {})).catch(() => {});
    api.get('/enquiries').then(r => {
      const unread = (r.data || []).filter(e => e.has_unread_admin_reply).length;
      setUnreadEnquiries(unread);
    }).catch(() => {});
  }, [isGuest]);

  if (isGuest) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>You</Text></View>
        <View style={styles.guestBody}>
          <Text style={styles.guestEmoji}>👤</Text>
          <Text style={styles.guestHeading}>Sign in to your account</Text>
          <Text style={styles.guestSub}>Track orders, manage your Dabba, earn loyalty rewards.</Text>
          <TouchableOpacity style={styles.guestBtn} onPress={logout}>
            <Text style={styles.guestBtnText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guestGhostBtn} onPress={logout}>
            <Text style={styles.guestGhostText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const cycleCount = loyaltyStatus.loyalty_order_count % 5 || (loyaltyStatus.pending_reward ? 5 : 0);
  const pendingReward = loyaltyStatus.pending_reward || false;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleLogout = () => {
    Alert.alert(
      'Leaving already?',
      'Your cart will be waiting.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>You</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Loyalty progress */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyRow}>
            <Text style={styles.loyaltyTitle}>🎁 Loyalty</Text>
            <Text style={styles.loyaltyCount}>{cycleCount} / 5 orders</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(cycleCount / 5) * 100}%` }]} />
          </View>
          <Text style={styles.loyaltySub}>
            {pendingReward
              ? '🎉 Free dish ready! Add any item to cart — it will be free on your next order.'
              : `${5 - cycleCount} more order${5 - cycleCount === 1 ? '' : 's'} to earn a free dish from our entire menu.`}
          </Text>
        </View>

        {/* Orders + Dabba */}
        <SectionTitle title="Your Orders" />
        <View style={styles.menuSection}>
          <MenuRow icon="📦" label="My Orders" sub="Track, reorder, cancel" onPress={() => navigation.navigate('OrdersTab')} />
          <MenuRow icon="🍱" label="Dabba Wala" sub="Your weekly meal plan" onPress={() => navigation.navigate('DabbaWala')} />
        </View>

        {/* Help + contact */}
        <SectionTitle title="Help & Support" />
        <View style={styles.menuSection}>
          <MenuRow
            icon="💬"
            label="Enquiries"
            sub="Messages from us"
            onPress={() => navigation.navigate('Enquiries')}
            badge={unreadEnquiries > 0 ? `${unreadEnquiries}` : null}
          />
          <MenuRow icon="📞" label="Contact Us" sub="Get in touch" onPress={() => navigation.navigate('Contact')} />
          <MenuRow icon="🍽" label="Catering" sub="Events & bulk orders" onPress={() => navigation.navigate('Catering')} />
          <MenuRow icon="❓" label="FAQ" sub="Common questions" onPress={() => navigation.navigate('FAQ')} />
        </View>

        {/* Explore */}
        <SectionTitle title="Explore" />
        <View style={styles.menuSection}>
          <MenuRow icon="📍" label="Delivery Areas" onPress={() => navigation.navigate('DeliveryAreas')} />
          <MenuRow icon="🖼" label="Gallery" onPress={() => navigation.navigate('Gallery')} />
          <MenuRow icon="🌿" label="Our Story" onPress={() => navigation.navigate('About')} />
        </View>

        {/* Account */}
        <SectionTitle title="Account" />
        <View style={styles.menuSection}>
          <MenuRow icon="👤" label="Account Settings" onPress={() => navigation.navigate('EditProfile')} />
          <MenuRow icon="🚪" label="Sign Out" onPress={handleLogout} danger />
        </View>

        {/* App version */}
        <Text style={styles.version}>Sree Svadista Prasada · v1.0.0</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { paddingHorizontal: SPACING.xl, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  title: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson },

  // Guest
  guestBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  guestEmoji: { fontSize: 48, marginBottom: 20 },
  guestHeading: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.brown, textAlign: 'center', marginBottom: 8 },
  guestSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  guestBtn: { width: '100%', backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  guestBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
  guestGhostBtn: { width: '100%', borderWidth: 1.5, borderColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 46, alignItems: 'center', justifyContent: 'center' },
  guestGhostText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.crimson },

  // Profile card
  profileCard: { backgroundColor: COLORS.white, padding: SPACING.xxl, alignItems: 'center', marginBottom: 8 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.white },
  name: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.brown, marginBottom: 3 },
  email: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, marginBottom: 12 },
  editBtn: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: 20, paddingVertical: 7 },
  editBtnText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },

  // Loyalty
  loyaltyCard: { backgroundColor: COLORS.cream, marginHorizontal: SPACING.xl, marginBottom: 8, borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: `${COLORS.gold}50` },
  loyaltyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loyaltyTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.brown },
  loyaltyCount: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.crimson },
  progressBar: { height: 7, backgroundColor: COLORS.lightGrey, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 4 },
  loyaltySub: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, lineHeight: 16 },

  // Section title
  sectionTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginHorizontal: SPACING.xl, marginTop: 16, marginBottom: 6 },

  // Menu rows
  menuSection: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginHorizontal: SPACING.xl, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  menuIcon: { fontSize: 18, marginRight: 14, width: 26, textAlign: 'center' },
  menuRowBody: { flex: 1 },
  menuLabel: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.brown },
  menuSub: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 1 },
  chevron: { fontSize: 20, color: COLORS.grey },
  badge: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.white },

  version: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, textAlign: 'center', marginTop: 20, marginBottom: 8 },
});
