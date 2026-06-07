import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TextInput,
  TouchableOpacity, Animated, Keyboard, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const PostcodeContext = createContext(null);

// ── PostcodeSheet (defined here to avoid circular import) ──────────────────

const SERVED_CITIES = ['Milton Keynes', 'Edinburgh', 'Glasgow'];

function PostcodeSheet({ visible, onClose, currentPostcode, onConfirm }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(520)).current;
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null); // null | 'checking' | { ok, city, fee }
  const [saving, setSaving] = useState(false);
  const checkTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      setInput(currentPostcode || '');
      setStatus(null);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true,
        damping: 26, stiffness: 260, mass: 0.85,
      }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 520, duration: 220, useNativeDriver: true }).start();
    }
    return () => clearTimeout(checkTimer.current);
  }, [visible]);

  const handleInput = (val) => {
    const cleaned = val.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
    setInput(cleaned);
    setStatus(null);
    clearTimeout(checkTimer.current);
    if (cleaned.trim().length >= 3) {
      setStatus('checking');
      checkTimer.current = setTimeout(() => doCheck(cleaned), 650);
    }
  };

  const doCheck = async (pc) => {
    try {
      const res = await api.post('/delivery/check', { postcode: pc.trim().toUpperCase() });
      const ok = !!(res.data.serviceable ?? (res.data.service_type === 'full'));
      setStatus({ ok, city: res.data.city, fee: res.data.delivery_fee });
    } catch {
      setStatus({ ok: false, city: null, fee: null });
    }
  };

  const handleConfirm = async () => {
    if (!status?.ok || saving) return;
    setSaving(true);
    try { await onConfirm(input.trim().toUpperCase()); } catch {}
    setSaving(false);
  };

  const handleClose = () => { Keyboard.dismiss(); onClose(); };

  const isChecking = status === 'checking';
  const confirmed = status?.ok === true;
  const denied = status?.ok === false;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={sheetStyles.root}>
        <Pressable style={sheetStyles.overlay} onPress={handleClose} />
        <Animated.View
          style={[sheetStyles.sheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={sheetStyles.handle} />

          <View style={sheetStyles.header}>
            <Text style={sheetStyles.title}>Delivery location</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={sheetStyles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={sheetStyles.serveLabel}>We deliver to</Text>
          <View style={sheetStyles.citiesRow}>
            {SERVED_CITIES.map(c => (
              <View key={c} style={sheetStyles.cityChip}>
                <Text style={sheetStyles.cityChipText}>✓  {c}</Text>
              </View>
            ))}
          </View>

          <Text style={sheetStyles.inputLabel}>Your postcode</Text>
          <View style={[
            sheetStyles.inputWrap,
            confirmed && sheetStyles.inputWrapOk,
            denied && sheetStyles.inputWrapErr,
          ]}>
            <Text style={sheetStyles.pin}>📍</Text>
            <TextInput
              style={sheetStyles.input}
              placeholder="e.g. MK9 2FP"
              placeholderTextColor={COLORS.grey}
              value={input}
              onChangeText={handleInput}
              autoCapitalize="characters"
              autoFocus
              maxLength={8}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
            {isChecking && <Text style={sheetStyles.spin}>↻</Text>}
            {confirmed && <Text style={[sheetStyles.spin, { color: '#059669' }]}>✓</Text>}
            {denied   && <Text style={[sheetStyles.spin, { color: '#DC2626' }]}>✗</Text>}
          </View>

          {(confirmed || denied) && (
            <Text style={[sheetStyles.feedback, { color: confirmed ? '#059669' : '#DC2626' }]}>
              {confirmed
                ? `We deliver to ${status.city}!${status.fee != null ? `  Delivery from £${status.fee.toFixed(2)}` : ''}`
                : "Sorry, we don't deliver to this postcode yet"}
            </Text>
          )}

          <TouchableOpacity
            style={[sheetStyles.confirmBtn, (!confirmed || saving) && sheetStyles.confirmBtnOff]}
            onPress={handleConfirm}
            disabled={!confirmed || saving}
            activeOpacity={0.85}
          >
            <Text style={sheetStyles.confirmText}>{saving ? 'Saving…' : 'Confirm location'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: SPACING.xl, paddingTop: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  title: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.brown },
  closeBtn: { fontSize: 17, color: COLORS.grey, fontFamily: FONTS.bodyMedium },
  serveLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.grey, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  citiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 26 },
  cityChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: 'rgba(5,150,105,0.08)', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'rgba(5,150,105,0.28)',
  },
  cityChipText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: '#059669' },
  inputLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.grey, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: COLORS.warmWhite,
  },
  inputWrapOk: { borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.05)' },
  inputWrapErr: { borderColor: '#DC2626', backgroundColor: 'rgba(220,38,38,0.05)' },
  pin: { fontSize: 18 },
  input: { flex: 1, fontFamily: FONTS.bodySemiBold, fontSize: 17, color: COLORS.brown, letterSpacing: 1.5 },
  spin: { fontSize: 18, fontFamily: FONTS.bodyBold, color: COLORS.grey },
  feedback: { fontFamily: FONTS.bodyMedium, fontSize: 13, marginTop: 10, lineHeight: 19 },
  confirmBtn: {
    marginTop: 22, height: 54, borderRadius: RADIUS.md,
    backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnOff: { backgroundColor: COLORS.lightGrey },
  confirmText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.white },
});

// ── Provider ───────────────────────────────────────────────────────────────

export function PostcodeProvider({ children }) {
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [zoneData, setZoneData] = useState({ delivery_fee: 3.99, free_over: 30.0, serviceable: false });
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('ssp_postcode').then(async (pc) => {
      if (!pc) return;
      const upper = pc.trim().toUpperCase();
      setPostcode(upper);
      try {
        const res = await api.post('/delivery/check', { postcode: upper });
        setCity(res.data.city || '');
        setZoneData({
          delivery_fee: res.data.delivery_fee ?? 3.99,
          free_over: res.data.free_over ?? 30.0,
          serviceable: res.data.serviceable ?? (res.data.service_type === 'full') ?? true,
        });
      } catch {}
    });
  }, []);

  const updatePostcode = useCallback(async (pc) => {
    const upper = pc.trim().toUpperCase();
    const res = await api.post('/delivery/check', { postcode: upper });
    await AsyncStorage.setItem('ssp_postcode', upper);
    setPostcode(upper);
    setCity(res.data.city || '');
    setZoneData({
      delivery_fee: res.data.delivery_fee ?? 3.99,
      free_over: res.data.free_over ?? 30.0,
      serviceable: res.data.serviceable ?? (res.data.service_type === 'full') ?? true,
    });
    return res.data;
  }, []);

  const openSheet = useCallback(() => setSheetVisible(true), []);

  return (
    <PostcodeContext.Provider value={{ postcode, city, zoneData, openSheet }}>
      {children}
      <PostcodeSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        currentPostcode={postcode}
        onConfirm={async (pc) => {
          await updatePostcode(pc);
          setSheetVisible(false);
        }}
      />
    </PostcodeContext.Provider>
  );
}

export const usePostcode = () => useContext(PostcodeContext);
