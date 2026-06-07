import React, { useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

// Required so the browser closes and redirects back after OAuth
WebBrowser.maybeCompleteAuthSession();

// ── Google OAuth Client IDs ────────────────────────────────────────────────
// Set these in mobile/.env (or as Expo env vars on EAS)
// EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID      — Web OAuth 2.0 client (used in Expo Go)
// EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID      — iOS OAuth 2.0 client (used in standalone iOS)
// EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID  — Android OAuth 2.0 client (used in standalone Android)
//
// Get them from https://console.cloud.google.com/ → APIs & Services → Credentials
const WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export default function GoogleSignInButton({ style }) {
  const { loginWithGoogle } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (response?.type === 'success') {
      const accessToken = response.authentication?.accessToken;
      if (!accessToken) {
        Alert.alert('Sign-in failed', 'No access token received. Please try again.');
        return;
      }
      setLoading(true);
      loginWithGoogle(accessToken)
        .catch((err) => {
          const detail = err?.response?.data?.detail;
          Alert.alert('Google sign-in failed', detail || 'Please try again.');
        })
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      Alert.alert('Sign-in failed', response.error?.message || 'Please try again.');
    }
  }, [response]);

  const isReady = !!request && !!WEB_CLIENT_ID;

  return (
    <TouchableOpacity
      style={[styles.btn, (!isReady || loading) && styles.btnDisabled, style]}
      onPress={() => promptAsync()}
      disabled={!isReady || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.brown} />
      ) : (
        <>
          <Text style={styles.gLogo}>G</Text>
          <Text style={styles.label}>Continue with Google</Text>
        </>
      )}
      {!WEB_CLIENT_ID && !loading && (
        <Text style={styles.unconfigured}>  (not configured)</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    backgroundColor: COLORS.white,
    gap: 10,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  gLogo: {
    fontSize: 18,
    fontFamily: 'Georgia',
    color: '#4285F4',
    fontWeight: '700',
    lineHeight: 22,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#3C4043',
  },
  unconfigured: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.grey,
  },
});
