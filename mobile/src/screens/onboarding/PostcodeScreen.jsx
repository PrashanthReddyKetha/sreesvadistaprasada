import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';
import { COLORS, FONTS } from '../../constants/theme';

export default function PostcodeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    const cleaned = postcode.trim().toUpperCase();
    if (!cleaned) { Alert.alert('', 'Please enter your postcode.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/delivery/check', { postcode: cleaned });
      await AsyncStorage.setItem('ssp_postcode', cleaned);
      await AsyncStorage.setItem('ssp_delivery_info', JSON.stringify(res.data));
      await AsyncStorage.setItem('ssp_onboarded', 'true');
      navigation.replace('Login');
    } catch {
      await AsyncStorage.setItem('ssp_postcode', cleaned);
      await AsyncStorage.setItem('ssp_onboarded', 'true');
      navigation.replace('Login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
          <Text style={styles.heading}>Where shall we{'\n'}bring the warmth?</Text>
          <Text style={styles.body}>Drop your postcode and we'll show you what's on the way.</Text>
          <View style={styles.inputRow}>
            <Text style={styles.pin}>📍</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MK9 2FP"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={postcode}
              onChangeText={setPostcode}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleCheck}
            />
          </View>
          <TouchableOpacity style={styles.btn} onPress={handleCheck} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Checking...' : "Let's Go →"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { AsyncStorage.setItem('ssp_onboarded', 'true'); navigation.replace('Login'); }}>
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
  },
  heading: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 36,
    marginBottom: 10,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  pin: { fontSize: 16, marginRight: 8 },
  input: {
    flex: 1,
    height: 48,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 1,
  },
  btn: {
    backgroundColor: COLORS.crimson,
    borderRadius: 6,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  btnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.white,
  },
  skip: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
