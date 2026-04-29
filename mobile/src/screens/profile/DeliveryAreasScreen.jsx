import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

const AREAS = [
  { city: 'Milton Keynes', postcodes: ['MK1', 'MK2', 'MK3', 'MK4', 'MK5', 'MK6', 'MK7', 'MK8', 'MK9', 'MK10', 'MK11', 'MK12', 'MK13', 'MK14', 'MK15', 'MK16', 'MK17', 'MK19'] },
  { city: 'Edinburgh', postcodes: ['EH1', 'EH2', 'EH3', 'EH4', 'EH5', 'EH6', 'EH7', 'EH8', 'EH9', 'EH10', 'EH11', 'EH12', 'EH13', 'EH14', 'EH15', 'EH16'] },
  { city: 'Glasgow', postcodes: ['G1', 'G2', 'G3', 'G4', 'G5', 'G11', 'G12', 'G13', 'G14', 'G20', 'G21', 'G22', 'G31', 'G40', 'G41', 'G42', 'G43', 'G44', 'G51', 'G52'] },
];

export default function DeliveryAreasScreen() {
  const insets = useSafeAreaInsets();
  const [postcode, setPostcode] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    const cleaned = postcode.trim().toUpperCase();
    if (!cleaned) return;
    setChecking(true);
    try {
      const res = await api.post('/delivery/check', { postcode: cleaned });
      setResult({ available: true, data: res.data });
    } catch {
      setResult({ available: false });
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Delivery Areas" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Postcode check */}
        <View style={styles.checkCard}>
          <Text style={styles.checkTitle}>Check Your Postcode</Text>
          <View style={styles.checkRow}>
            <TextInput
              style={styles.checkInput}
              placeholder="e.g. MK9 2FP"
              placeholderTextColor={COLORS.grey}
              value={postcode}
              onChangeText={setPostcode}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={check}
            />
            <TouchableOpacity style={styles.checkBtn} onPress={check} disabled={checking}>
              <Text style={styles.checkBtnText}>{checking ? '...' : 'Check'}</Text>
            </TouchableOpacity>
          </View>
          {result && (
            <View style={[styles.resultChip, { backgroundColor: result.available ? 'rgba(74,124,89,0.12)' : 'rgba(220,38,38,0.1)' }]}>
              <Text style={[styles.resultText, { color: result.available ? COLORS.green : COLORS.red }]}>
                {result.available
                  ? `✓ We deliver to ${postcode}${result.data?.city ? ` — ${result.data.city}` : ''}`
                  : `✗ Sorry, we don't deliver to ${postcode} yet.`}
              </Text>
            </View>
          )}
        </View>

        {/* Areas by city */}
        {AREAS.map(area => (
          <View key={area.city} style={styles.areaCard}>
            <Text style={styles.areaCity}>📍 {area.city}</Text>
            <View style={styles.postcodeWrap}>
              {area.postcodes.map(pc => (
                <View key={pc} style={styles.postcodePill}>
                  <Text style={styles.postcodeText}>{pc}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Don't see your postcode? We're expanding every month.{' '}
            <Text style={{ color: COLORS.crimson }}>Contact us</Text> — we may be able to sort something.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  content: { padding: SPACING.xl, gap: 16, paddingBottom: 40 },
  checkCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, ...SHADOW.light },
  checkTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.brown, marginBottom: 12 },
  checkRow: { flexDirection: 'row', gap: 10 },
  checkInput: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.warmWhite },
  checkBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.md, paddingHorizontal: 18, justifyContent: 'center' },
  checkBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.white },
  resultChip: { marginTop: 10, borderRadius: RADIUS.md, padding: 10 },
  resultText: { fontFamily: FONTS.bodyMedium, fontSize: 12 },
  areaCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, ...SHADOW.light },
  areaCity: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown, marginBottom: 10 },
  postcodeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  postcodePill: { backgroundColor: COLORS.lightGrey, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  postcodeText: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.grey },
  note: { backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, padding: 14 },
  noteText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, lineHeight: 18 },
});
