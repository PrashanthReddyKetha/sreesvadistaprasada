import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

const EVENT_TYPES = ['Birthday', 'Wedding', 'Corporate', 'Pooja / Prayer', 'Naming ceremony', 'Other'];
const GUEST_RANGES = ['Up to 25', '25–50', '50–100', '100–200', '200+'];
const FOOD_PREFS = ['Vegetarian only', 'Non-vegetarian', 'Mixed (both)'];

export default function CateringScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [eventType, setEventType] = useState('');
  const [guestRange, setGuestRange] = useState('');
  const [foodPref, setFoodPref] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const successOpacity = useState(new Animated.Value(0))[0];

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !eventType || !guestRange) {
      Alert.alert('', 'Please fill in your details, event type, and expected guest count.'); return;
    }
    setSending(true);
    try {
      await api.post('/enquiries/catering', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        event_type: eventType,
        guest_count: guestRange,
        food_preference: foodPref || undefined,
        event_date: eventDate.trim() || undefined,
        venue: venue.trim() || undefined,
        message: notes.trim() || undefined,
        user_id: user?.id,
      });
      setDone(true);
      Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (err) {
      Alert.alert('', err?.response?.data?.detail || 'Could not send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Catering" />
        <Animated.View style={[styles.successWrap, { opacity: successOpacity }]}>
          <View style={styles.successCircle}>
            <Text style={styles.successTick}>✓</Text>
          </View>
          <Text style={styles.successHeading}>Enquiry sent!</Text>
          <Text style={styles.successBody}>
            We'll get back to you within 24 hours with a personalised quote. Big meals, made with love.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
            <Text style={styles.successBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Catering" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          <View style={styles.heroBanner}>
            <Text style={styles.heroTitle}>Cooking for a crowd?</Text>
            <Text style={styles.heroSub}>Weddings · Corporates · Poojas · Birthdays{'\n'}We cater for 10 to 500+ guests.</Text>
          </View>

          <Text style={styles.fieldLabel}>Your name</Text>
          <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={COLORS.grey} value={name} onChangeText={setName} autoCapitalize="words" />

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={COLORS.grey} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.fieldLabel}>Phone</Text>
          <TextInput style={styles.input} placeholder="07xxx xxxxxx" placeholderTextColor={COLORS.grey} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.fieldLabel}>Event type</Text>
          <View style={styles.chipGrid}>
            {EVENT_TYPES.map(t => (
              <TouchableOpacity key={t} style={[styles.chip, eventType === t && styles.chipActive]} onPress={() => setEventType(t)} activeOpacity={0.8}>
                <Text style={[styles.chipText, eventType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Expected guests</Text>
          <View style={styles.chipRow}>
            {GUEST_RANGES.map(r => (
              <TouchableOpacity key={r} style={[styles.chip, guestRange === r && styles.chipActive]} onPress={() => setGuestRange(r)} activeOpacity={0.8}>
                <Text style={[styles.chipText, guestRange === r && styles.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Food preference</Text>
          <View style={styles.chipRow}>
            {FOOD_PREFS.map(p => (
              <TouchableOpacity key={p} style={[styles.chip, foodPref === p && styles.chipActive]} onPress={() => setFoodPref(p)} activeOpacity={0.8}>
                <Text style={[styles.chipText, foodPref === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Event date (if known)</Text>
          <TextInput style={styles.input} placeholder="e.g. 15 August 2025" placeholderTextColor={COLORS.grey} value={eventDate} onChangeText={setEventDate} />

          <Text style={styles.fieldLabel}>Venue / Location</Text>
          <TextInput style={styles.input} placeholder="Address or area" placeholderTextColor={COLORS.grey} value={venue} onChangeText={setVenue} />

          <Text style={styles.fieldLabel}>Additional notes (optional)</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Any dietary needs, specific dishes, theme..." placeholderTextColor={COLORS.grey} value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" />

          <View style={styles.quoteNote}>
            <Text style={styles.quoteNoteText}>📋  We'll prepare a personalised quote and get back to you within 24 hours.</Text>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (sending || !name || !email || !phone || !eventType || !guestRange) && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={sending || !name.trim() || !email.trim() || !phone.trim() || !eventType || !guestRange}
            activeOpacity={0.9}
          >
            <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Request a Quote →'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  content: { padding: SPACING.xl, paddingBottom: 60 },
  heroBanner: { backgroundColor: `${COLORS.crimson}10`, borderRadius: RADIUS.xl, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: `${COLORS.crimson}22` },
  heroTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.crimson, marginBottom: 6 },
  heroSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.brown, lineHeight: 20 },
  fieldLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.white, marginBottom: SPACING.lg },
  textArea: { height: 100, paddingTop: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  chipText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  chipTextActive: { color: COLORS.white },
  quoteNote: { backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, padding: 12, marginBottom: 20 },
  quoteNoteText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.deepGold, lineHeight: 18 },
  sendBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 52, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTick: { fontSize: 34, color: COLORS.white },
  successHeading: { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.brown, textAlign: 'center', marginBottom: 10 },
  successBody: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.grey, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  successBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
  successBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
});
