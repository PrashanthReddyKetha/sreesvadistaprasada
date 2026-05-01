import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);
  const passwordRef = useRef(null);
  const slowTimer = useRef(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();
    if (!trimmedEmail || !trimmedPass) {
      Alert.alert('', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    setSlowWarning(false);
    // Warn user if backend is waking up (Render free tier)
    slowTimer.current = setTimeout(() => setSlowWarning(true), 6000);
    try {
      await login(trimmedEmail, trimmedPass);
      // Navigation is handled automatically by RootNavigator when user state updates
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const isNetwork = !err?.response;
      if (isNetwork) {
        Alert.alert(
          'Connection issue',
          'Could not reach the server. Check your internet and try again. If this persists, the kitchen may be waking up — try in 30 seconds.',
          [{ text: 'OK' }],
        );
      } else if (detail?.includes('Google sign-in')) {
        Alert.alert(
          'Use Google to sign in',
          'This account was created with Google. Please use the "Continue with Google" option.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Sign in failed', detail || 'Please check your email and password.');
      }
    } finally {
      clearTimeout(slowTimer.current);
      setLoading(false);
      setSlowWarning(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>Sree Svadista Prasada</Text>
        <View style={styles.logoDivider} />

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your account</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.grey}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, { flex: 1, borderWidth: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.grey}
              secureTextEntry={!showPass}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.75 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.btnText}>
                {slowWarning ? 'Waking the kitchen…' : 'Signing in…'}
              </Text>
            </View>
          ) : (
            <Text style={styles.btnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {slowWarning && (
          <Text style={styles.wakeNote}>
            Our server was resting — it wakes up in ~30 seconds. Hang tight.
          </Text>
        )}

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={styles.registerText}>
            New here?{' '}
            <Text style={{ color: COLORS.crimson, fontFamily: FONTS.bodySemiBold }}>
              Create an account
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={continueAsGuest} activeOpacity={0.7}>
          <Text style={styles.skipText}>Browse as guest →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  content: { paddingHorizontal: 24 },
  logo: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson, textAlign: 'center', letterSpacing: 0.5 },
  logoDivider: { width: 32, height: 2, backgroundColor: COLORS.gold, alignSelf: 'center', marginTop: 10, marginBottom: 32 },
  heading: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.brown, marginBottom: 4 },
  sub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, marginBottom: SPACING.xl },
  field: { marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.white },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.white, paddingLeft: 14 },
  eyeBtn: { padding: 12 },
  btn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginTop: 4 },
  btnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
  wakeNote: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  forgotBtn: { alignItems: 'center', marginBottom: SPACING.xl },
  forgotText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  registerBtn: { alignItems: 'center', marginBottom: SPACING.xl },
  registerText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.deepGold },
});
