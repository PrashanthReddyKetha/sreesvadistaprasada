import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';

const STATUS_COLORS = { open: '#1D4ED8', contacted: COLORS.deepGold, resolved: COLORS.green };

function ThreadView({ enquiry, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 8000);
    return () => clearInterval(pollRef.current);
  }, [enquiry.id]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/enquiries/${enquiry.id}/messages`);
      setMessages(res.data || []);
    } catch {}
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/enquiries/${enquiry.id}/messages`, { message: reply.trim() });
      setReply('');
      loadMessages();
    } catch {
      Alert.alert('', 'Could not send message. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.threadHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.threadTitle} numberOfLines={1}>{enquiry.subject}</Text>
          <Text style={styles.threadSub}>{enquiry.status}</Text>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item, i) => `${item.id || i}`}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.headingItalic, fontSize: 14, color: COLORS.grey }}>
              Start the conversation
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUser = item.sender_role !== 'admin';
          return (
            <View style={[styles.messageWrap, isUser ? styles.messageRight : styles.messageLeft]}>
              {!isUser && <Text style={styles.adminLabel}>Sree Svadista Prasada</Text>}
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAdmin]}>
                <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAdmin]}>
                  {item.message}
                </Text>
              </View>
              <Text style={styles.messageTime}>
                {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Reply..."
          placeholderTextColor={COLORS.grey}
          value={reply}
          onChangeText={setReply}
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendReply} disabled={sending || !reply.trim()}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function EnquiriesScreen() {
  const insets = useSafeAreaInsets();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/enquiries')
      .then(r => setEnquiries(r.data || []))
      .catch(() => setEnquiries([]))
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ThreadView enquiry={selected} onBack={() => setSelected(null)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Enquiries" />
      {loading ? (
        <EmptyState emoji="💬" message="Loading your messages..." />
      ) : enquiries.length === 0 ? (
        <EmptyState emoji="💬" message="No messages yet. We're here when you need us." />
      ) : (
        <FlatList
          data={enquiries}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.enquiryRow, SHADOW.light]} onPress={() => setSelected(item)}>
              <View style={styles.enquiryAvatar}>
                <Text style={styles.enquiryAvatarText}>{item.subject?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.enquiryInfo}>
                <Text style={styles.enquirySubject} numberOfLines={1}>{item.subject}</Text>
                <Text style={styles.enquiryDate}>{new Date(item.created_at).toLocaleDateString('en-GB')}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[item.status] || COLORS.grey}18` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || COLORS.grey }]}>
                  {item.status}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  list: { padding: SPACING.xl, gap: 10, paddingBottom: 40 },
  enquiryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, gap: 12 },
  enquiryAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  enquiryAvatarText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.white },
  enquiryInfo: { flex: 1 },
  enquirySubject: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.brown },
  enquiryDate: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 2 },
  statusPill: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: FONTS.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  threadHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey, backgroundColor: COLORS.white },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: COLORS.crimson },
  threadTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown, flex: 1 },
  threadSub: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, textTransform: 'capitalize' },
  messageList: { padding: SPACING.lg, gap: 10, flexGrow: 1 },
  messageWrap: { maxWidth: '80%', marginBottom: 4 },
  messageLeft: { alignSelf: 'flex-start' },
  messageRight: { alignSelf: 'flex-end' },
  adminLabel: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey, marginBottom: 3 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: COLORS.crimson, borderBottomRightRadius: 4 },
  bubbleAdmin: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { fontSize: 13, lineHeight: 20 },
  bubbleTextUser: { fontFamily: FONTS.body, color: COLORS.white },
  bubbleTextAdmin: { fontFamily: FONTS.body, color: COLORS.brown },
  messageTime: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey, marginTop: 3 },
  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: SPACING.lg, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, backgroundColor: COLORS.white },
  replyInput: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontFamily: FONTS.body, fontSize: 13, color: COLORS.brown, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 16, color: COLORS.white },
});
