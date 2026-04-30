import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

const SUBJECTS = [
  'General enquiry',
  'Order issue',
  'Delivery question',
  'Dabba Wala',
  'Feedback',
  'Other',
];

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const successOpacity = useState(new Animated.Value(0))[0];

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('', 'Please fill in your name, email, and message.'); return;
    }
    setSending(true);
    try {
      await api.post('/enquiries/contact', {
        name: name.trim(),
        email: email.trim(),
        subject: subject || 'General enquiry',
        message: message.trim(),
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
        <ScreenHeader title="Contact Us" />
        <Animated.View style={[styles.successWrap, { opacity: successOpacity }]}>
          <View style={styles.successCircle}>
            <Text style={styles.successTick}>✓</Text>
          </View>
          <Text style={styles.successHeading}>Message sent!</Text>
          <Text style={styles.successBody}>
            We'll get back to you within a few hours. Check your Enquiries tab for our reply.
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
        <ScreenHeader title="Contact Us" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          <Text style={styles.intro}>
            Got a question, feedback, or need help with an order? We're real people — we'll reply personally.
          </Text>

          <Text style={styles.fieldLabel}>Your name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={COLORS.grey}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.grey}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
            {SUBJECTS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.subjectChip, subject === s && styles.subjectChipActive]}
                onPress={() => setSubject(s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.subjectText, subject === s && styles.subjectTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us what's on your mind..."
            placeholderTextColor={COLORS.grey}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <View style={styles.replyNote}>
            <Text style={styles.replyNoteText}>💬  We reply to all messages via your Enquiries tab — usually within a few hours.</Text>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (sending || !name || !email || !message) && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={sending || !name.trim() || !email.trim() || !message.trim()}
            activeOpacity={0.9}
          >
            <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send Message →'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  content: { padding: SPACING.xl, paddingBottom: 60 },
  intro: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.grey, lineHeight: 22, marginBottom: 20 },
  fieldLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 7 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.white, marginBottom: SPACING.lg },
  textArea: { height: 120, paddingTop: 12, marginBottom: SPACING.lg },
  subjectRow: { gap: 8, marginBottom: SPACING.lg },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  subjectChipActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  subjectText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  subjectTextActive: { color: COLORS.white },
  replyNote: { backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, padding: 12, marginBottom: 20 },
  replyNoteText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.deepGold, lineHeight: 18 },
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
