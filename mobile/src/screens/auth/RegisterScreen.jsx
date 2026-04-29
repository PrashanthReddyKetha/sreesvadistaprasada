import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { register, continueAsGuest } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert('', 'Please fill all fields.'); return; }
    if (password.length < 6) { Alert.alert('', 'Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Registration failed', err?.response?.data?.detail || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    Alert.alert('Coming soon', 'Google Sign-In will be enabled in the next update.', [{ text: 'OK' }]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>Sree Svadista Prasada</Text>
        <View style={styles.logoDivider} />

        <Text style={styles.heading}>Join the family</Text>
        <Text style={styles.sub}>Create your account</Text>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.85}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign up with email</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Prashanth" placeholderTextColor={COLORS.grey} autoCapitalize="words" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={COLORS.grey} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0 }]}
              value={password} onChangeText={setPassword}
              placeholder="At least 6 characters" placeholderTextColor={COLORS.grey}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.btnText}>Creating account...</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>
        {loading && (
          <Text style={[styles.sub, { textAlign: 'center', marginTop: -8 }]}>First request may take ~30s — the server was resting</Text>
        )}

        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={{ color: COLORS.crimson, fontFamily: FONTS.bodySemiBold }}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={continueAsGuest}>
          <Text style={styles.skipText}>Browse as guest →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  content: { paddingHorizontal: 24 },
  logo: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson, textAlign: 'center' },
  logoDivider: { width: 32, height: 2, backgroundColor: COLORS.gold, alignSelf: 'center', marginTop: 10, marginBottom: 32 },
  heading: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.brown, marginBottom: 4 },
  sub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, marginBottom: SPACING.xl },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 50, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white, marginBottom: SPACING.xl },
  googleIcon: { fontFamily: FONTS.bodyBold, fontSize: 17, color: '#4285F4' },
  googleText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  field: { marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.white },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.white, paddingLeft: 14 },
  eyeBtn: { padding: 12 },
  btn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 4 },
  btnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
  loginBtn: { alignItems: 'center', marginBottom: SPACING.xl },
  loginText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.deepGold },
});
