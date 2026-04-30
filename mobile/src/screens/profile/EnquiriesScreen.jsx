import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';

const STATUS_COLORS = {
  open: '#1D4ED8',
  contacted: COLORS.deepGold,
  resolved: '#059669',
};
const STATUS_LABELS = { open: 'Open', contacted: 'In progress', resolved: 'Resolved' };

// ─── Thread view ──────────────────────────────────────────────────────────────
function ThreadView({ enquiry, onBack }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef(null);
  const pollRef = useRef(null);
  const enqType = enquiry.enq_type || 'contact';

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 8000);
    return () => clearInterval(pollRef.current);
  }, [enquiry.id]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/enquiries/${enqType}/${enquiry.id}/messages`);
      setMessages(res.data || []);
      // Scroll to bottom
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {}
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/enquiries/${enqType}/${enquiry.id}/reply`, { message: reply.trim() });
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
      {/* Thread header */}
      <View style={styles.threadHeader}>
        <TouchableOpacity onPress={onBack} style={styles.threadBackBtn}>
          <Text style={styles.threadBackText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.threadTitle} numberOfLines={1}>{enquiry.subject || enquiry.name}</Text>
          <Text style={[styles.threadStatus, { color: STATUS_COLORS[enquiry.status] || COLORS.grey }]}>
            {STATUS_LABELS[enquiry.status] || enquiry.status}
          </Text>
        </View>
      </View>

      {/* Context card — original enquiry */}
      <View style={styles.contextCard}>
        <Text style={styles.contextLabel}>{enqType === 'catering' ? '🍽  Catering request' : '📞  Contact enquiry'}</Text>
        {enquiry.message && (
          <Text style={styles.contextMessage} numberOfLines={3}>{enquiry.message}</Text>
        )}
        <Text style={styles.contextDate}>
          {new Date(enquiry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item, i) => `${item.id || i}`}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.noMessages}>
            <Text style={styles.noMessagesText}>We'll reply here soon. Usually within a few hours.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUser = item.sender === 'customer';
          return (
            <View style={[styles.messageWrap, isUser ? styles.messageRight : styles.messageLeft]}>
              {!isUser && <Text style={styles.adminLabel}>Sree Svadista Prasada</Text>}
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAdmin]}>
                <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAdmin]}>
                  {item.message}
                </Text>
              </View>
              <Text style={[styles.messageTime, isUser && { textAlign: 'right' }]}>
                {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          );
        }}
      />

      {/* Reply bar */}
      <View style={[styles.replyBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.replyInput}
          placeholder="Reply..."
          placeholderTextColor={COLORS.grey}
          value={reply}
          onChangeText={setReply}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !reply.trim() && { opacity: 0.4 }]}
          onPress={sendReply}
          disabled={sending || !reply.trim()}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────
export default function EnquiriesScreen() {
  const insets = useSafeAreaInsets();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchEnquiries = useCallback(async () => {
    try {
      const res = await api.get('/enquiries/my');
      const contact = (res.data?.contact || []).map(e => ({ ...e, enq_type: 'contact' }));
      const catering = (res.data?.catering || []).map(e => ({ ...e, enq_type: 'catering' }));
      const all = [...contact, ...catering].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setEnquiries(all);
    } catch {
      setEnquiries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchEnquiries();
  }, [fetchEnquiries]));

  const totalUnread = enquiries.reduce((s, e) => s + (e.unread || 0), 0);

  if (selected) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ThreadView enquiry={selected} onBack={() => { setSelected(null); fetchEnquiries(); }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enquiries</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread} unread</Text>
          </View>
        )}
      </View>

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchEnquiries(); }}
              tintColor={COLORS.crimson}
            />
          }
          renderItem={({ item }) => {
            const hasUnread = (item.unread || 0) > 0;
            return (
              <TouchableOpacity
                style={[styles.enquiryRow, SHADOW.light, hasUnread && styles.enquiryRowUnread]}
                onPress={() => setSelected(item)}
                activeOpacity={0.88}
              >
                <View style={[styles.enquiryAvatar, { backgroundColor: item.enq_type === 'catering' ? '#92400E' : COLORS.crimson }]}>
                  <Text style={styles.enquiryAvatarText}>
                    {item.enq_type === 'catering' ? '🍽' : '💬'}
                  </Text>
                </View>
                <View style={styles.enquiryInfo}>
                  <Text style={[styles.enquirySubject, hasUnread && { fontFamily: FONTS.bodyBold }]} numberOfLines={1}>
                    {item.subject || item.name}
                  </Text>
                  <Text style={styles.enquiryDate}>
                    {item.enq_type === 'catering' ? 'Catering · ' : 'Contact · '}
                    {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.enquiryRight}>
                  <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[item.status] || COLORS.grey}18` }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || COLORS.grey }]}>
                      {STATUS_LABELS[item.status] || item.status}
                    </Text>
                  </View>
                  {hasUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.xl, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  headerTitle: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.crimson, flex: 1 },
  headerBadge: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.white },

  list: { padding: SPACING.xl, gap: 10, paddingBottom: 60 },
  enquiryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, gap: 12 },
  enquiryRowUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.crimson },
  enquiryAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  enquiryAvatarText: { fontSize: 18 },
  enquiryInfo: { flex: 1 },
  enquirySubject: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.brown, marginBottom: 2 },
  enquiryDate: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey },
  enquiryRight: { alignItems: 'flex-end', gap: 5 },
  statusPill: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: FONTS.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  unreadBadge: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.white },

  // Thread
  threadHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey, backgroundColor: COLORS.white },
  threadBackBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  threadBackText: { fontSize: 22, color: COLORS.crimson },
  threadTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown },
  threadStatus: { fontFamily: FONTS.bodyMedium, fontSize: 11, textTransform: 'capitalize', marginTop: 1 },

  contextCard: { backgroundColor: COLORS.cream, marginHorizontal: SPACING.lg, marginTop: 10, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  contextLabel: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  contextMessage: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.brown, lineHeight: 18, marginBottom: 5 },
  contextDate: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey },

  messageList: { padding: SPACING.lg, gap: 6, flexGrow: 1, paddingBottom: 16 },
  noMessages: { alignItems: 'center', paddingTop: 24 },
  noMessagesText: { fontFamily: FONTS.headingItalic, fontSize: 13, color: COLORS.grey, textAlign: 'center', lineHeight: 20 },

  messageWrap: { maxWidth: '80%', marginBottom: 8 },
  messageLeft: { alignSelf: 'flex-start' },
  messageRight: { alignSelf: 'flex-end' },
  adminLabel: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey, marginBottom: 3 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: COLORS.crimson, borderBottomRightRadius: 4 },
  bubbleAdmin: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { fontSize: 13, lineHeight: 20 },
  bubbleTextUser: { fontFamily: FONTS.body, color: COLORS.white },
  bubbleTextAdmin: { fontFamily: FONTS.body, color: COLORS.brown },
  messageTime: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey, marginTop: 4 },

  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: SPACING.lg, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, backgroundColor: COLORS.white },
  replyInput: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontFamily: FONTS.body, fontSize: 13, color: COLORS.brown, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 16, color: COLORS.white },
});
