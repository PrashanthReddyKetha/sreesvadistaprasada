import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

function MenuRow({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && { color: COLORS.red }]}>{label}</Text>
      {!danger && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    api.get('/orders').then(r => setOrderCount(r.data?.length || 0)).catch(() => {});
  }, []);

  const loyaltyProgress = Math.min(orderCount, 5);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
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
            <Text style={styles.loyaltyTitle}>🎁 Loyalty Progress</Text>
            <Text style={styles.loyaltyCount}>{loyaltyProgress} of 5</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(loyaltyProgress / 5) * 100}%` }]} />
          </View>
          <Text style={styles.loyaltySub}>
            {loyaltyProgress >= 5
              ? '🎉 You\'ve earned a free dish! Contact us to claim.'
              : `${5 - loyaltyProgress} more order${5 - loyaltyProgress === 1 ? '' : 's'} for a free dish from our entire menu.`}
          </Text>
        </View>

        {/* Menu sections */}
        <View style={styles.menuSection}>
          <MenuRow icon="📦" label="Dabba Wala" onPress={() => navigation.navigate('DabbaWala')} />
          <MenuRow icon="💬" label="Enquiries" onPress={() => navigation.navigate('Enquiries')} />
          <MenuRow icon="📍" label="Delivery Areas" onPress={() => navigation.navigate('DeliveryAreas')} />
        </View>

        <View style={styles.menuSection}>
          <MenuRow icon="🍽" label="Our Story" onPress={() => navigation.navigate('About')} />
          <MenuRow icon="👤" label="Account Settings" onPress={() => navigation.navigate('EditProfile')} />
        </View>

        <View style={styles.menuSection}>
          <MenuRow icon="🚪" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { paddingHorizontal: SPACING.xl, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  title: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson },
  profileCard: { backgroundColor: COLORS.white, padding: SPACING.xxl, alignItems: 'center', marginBottom: 8 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.white },
  name: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.brown, marginBottom: 3 },
  email: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, marginBottom: 12 },
  editBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: 18, paddingVertical: 7 },
  editBtnText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  loyaltyCard: { backgroundColor: COLORS.cream, marginHorizontal: SPACING.xl, marginBottom: 16, borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: `${COLORS.gold}50` },
  loyaltyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loyaltyTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.brown },
  loyaltyCount: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.crimson },
  progressBar: { height: 8, backgroundColor: COLORS.lightGrey, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 4 },
  loyaltySub: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, lineHeight: 16 },
  menuSection: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginHorizontal: SPACING.xl, marginBottom: 10, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, height: 50, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  menuIcon: { fontSize: 18, marginRight: 14 },
  menuLabel: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.brown },
  chevron: { fontSize: 20, color: COLORS.grey },
});
