import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photoUri, setPhotoUri] = useState(user?.photo_url || null);
  const [saving, setSaving] = useState(false);

  const handlePickPhoto = async () => {
    Alert.alert('Profile photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('', 'Camera permission is required.'); return; }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.45, base64: true,
          });
          if (!result.canceled && result.assets?.[0]) {
            setPhotoUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('', 'Photo library permission is required.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.45, base64: true,
          });
          if (!result.canceled && result.assets?.[0]) {
            setPhotoUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), phone: phone.trim() };
      if (photoUri) payload.photo_url = photoUri;
      const res = await api.put('/auth/me', payload);
      updateUser(res.data);
      Alert.alert('', 'Profile updated.');
    } catch {
      Alert.alert('', 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Edit Profile" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Photo picker */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.85}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}><Text style={styles.avatarBadgeText}>✎</Text></View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={COLORS.grey}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email}
              editable={false}
            />
            <Text style={styles.fieldHint}>Email cannot be changed.</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="07xxx xxxxxx"
              placeholderTextColor={COLORS.grey}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  content: { padding: SPACING.xl, gap: 0 },
  avatarWrap: { alignSelf: 'center', marginBottom: 6, position: 'relative' },
  avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: COLORS.deepGold },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.deepGold },
  avatarInitials: { fontFamily: FONTS.headingBold, fontSize: 32, color: COLORS.white },
  avatarBadge: { position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.deepGold, alignItems: 'center', justifyContent: 'center' },
  avatarBadgeText: { fontSize: 13, color: COLORS.white },
  avatarHint: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, textAlign: 'center', marginBottom: SPACING.xl },
  field: { marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.white },
  inputDisabled: { backgroundColor: COLORS.lightGrey, color: COLORS.grey },
  fieldHint: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 5 },
  saveBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
});
