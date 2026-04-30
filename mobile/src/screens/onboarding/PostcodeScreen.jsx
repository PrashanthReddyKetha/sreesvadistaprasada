import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';
import { COLORS, FONTS } from '../../constants/theme';

export default function PostcodeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [postcode, setPostcode] = useState('');
  const [status, setStatus] = useState(null); // null | 'checking' | { ok, city, msg }
  const [loading, setLoading] = useState(false);
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const checkTimer = useRef(null);

  const showResult = () => {
    Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const handlePostcodeChange = (val) => {
    const cleaned = val.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
    setPostcode(cleaned);
    setStatus(null);
    resultOpacity.setValue(0);
    clearTimeout(checkTimer.current);
    if (cleaned.trim().length >= 3) {
      checkTimer.current = setTimeout(() => checkPostcode(cleaned), 700);
    }
  };

  const checkPostcode = async (pc) => {
    setStatus('checking');
    try {
      const res = await api.post('/delivery/check', { postcode: pc.trim().toUpperCase() });
      const ok = res.data.service_type === 'full';
      setStatus({
        ok,
        city: res.data.city,
        msg: ok
          ? `We deliver to ${res.data.city} 🎉`
          : "We don't deliver here yet — we serve Milton Keynes, Edinburgh & Glasgow",
      });
      showResult();
    } catch {
      setStatus({ ok: false, msg: "Couldn't verify postcode. You can still continue." });
      showResult();
    }
  };

  const handleContinue = async () => {
    const cleaned = postcode.trim().toUpperCase();
    if (!cleaned) { Alert.alert('', 'Please enter your postcode.'); return; }
    setLoading(true);
    try {
      await AsyncStorage.setItem('ssp_postcode', cleaned);
      await AsyncStorage.setItem('ssp_onboarded', 'true');
    } catch {}
    setLoading(false);
    navigation.replace('Login');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('ssp_onboarded', 'true').catch(() => {});
    navigation.replace('Login');
  };

  const canContinue = postcode.trim().length >= 3;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.content, { paddingBottom: insets.bottom + 40, paddingTop: insets.top + 20 }]}>
          {/* Tag */}
          <View style={styles.tagChip}>
            <Text style={styles.tagText}>Delivery check</Text>
          </View>

          <Text style={styles.heading}>Where shall we{'\n'}bring the warmth?</Text>
          <Text style={styles.body}>
            Drop your postcode and we'll show you{'\n'}what's on the way.
          </Text>

          {/* Input */}
          <View style={[styles.inputRow, status && status !== 'checking' && {
            borderColor: status.ok ? COLORS.gold : 'rgba(255,255,255,0.4)',
          }]}>
            <Text style={styles.pin}>📍</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MK9 2FP"
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={postcode}
              onChangeText={handlePostcodeChange}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            {status === 'checking' && (
              <Text style={styles.checking}>...</Text>
            )}
          </View>

          {/* Inline result */}
          {status && status !== 'checking' && (
            <Animated.View style={[styles.resultRow, { opacity: resultOpacity }]}>
              <Text style={[styles.resultText, { color: status.ok ? COLORS.gold : 'rgba(255,255,255,0.6)' }]}>
                {status.ok ? '✓' : '✗'}{'  '}{status.msg}
              </Text>
            </Animated.View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, !canContinue && { opacity: 0.5 }]}
            onPress={handleContinue}
            disabled={!canContinue || loading}
            activeOpacity={0.88}
          >
            <Text style={styles.btnText}>{loading ? 'Saving...' : "Let's Go →"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skip}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
  },
  tagChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
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
    fontSize: 32,
    color: COLORS.white,
    lineHeight: 40,
    marginBottom: 12,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  pin: { fontSize: 17, marginRight: 10 },
  input: {
    flex: 1,
    height: 52,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 2,
  },
  checking: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 8,
  },
  resultRow: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: COLORS.crimson,
    borderRadius: 8,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.white,
  },
  skip: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 4,
  },
});
