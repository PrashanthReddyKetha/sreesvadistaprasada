import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';

const STEPS = [
  { num: '01', icon: '📦', title: 'Pick Your Dabba', desc: 'Prasada, Svadista, or a bit of both.' },
  { num: '02', icon: '📅', title: 'Tell Us Your Days', desc: 'Choose days and times. Pause anytime.' },
  { num: '03', icon: '🛵', title: 'Open It Warm', desc: 'Packed fresh, sealed hot, at your door.' },
];

const PLANS = [
  { id: 'prasada', icon: '🌿', name: 'Prasada Only', sub: 'Pure vegetarian · temple-style', price: 49, type: 'veg' },
  { id: 'svadista', icon: '🍖', name: 'Svadista Only', sub: 'Non-veg · bold Telugu flavours', price: 54, type: 'non-veg' },
  { id: 'mixed', icon: '🍱', name: 'Mixed Dabba', sub: 'Best of both kitchens', price: 59, type: 'mixed' },
];

export default function DabbaWalaScreen() {
  const insets = useSafeAreaInsets();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState('weekly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    api.get('/subscriptions')
      .then(r => setSubscription(r.data))
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan) { Alert.alert('', 'Please select a plan.'); return; }
    setSubscribing(true);
    try {
      const res = await api.post('/subscriptions', {
        plan_type: selectedPlan,
        billing_cycle: billing,
        price: (PLANS.find(p => p.id === selectedPlan)?.price || 49) * (billing === 'monthly' ? 4 * 0.9 : 1),
      });
      setSubscription(res.data);
      Alert.alert('🎉', 'Your Dabba is set! First delivery coming soon.');
    } catch (err) {
      Alert.alert('', err?.response?.data?.detail || 'Could not set up subscription. Try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Dabba?',
      "We'll miss cooking for you. Are you sure?",
      [
        { text: 'Keep My Dabba', style: 'cancel' },
        {
          text: 'Cancel', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/subscriptions/${subscription.id}`);
              setSubscription(null);
            } catch { Alert.alert('', 'Could not cancel. Please contact us.'); }
          }
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Dabba Wala" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Active subscription */}
        {subscription ? (
          <View style={styles.activeSection}>
            <LinearGradient colors={[COLORS.crimson, '#5a0016']} style={styles.activeCard}>
              <Text style={styles.activeTitle}>📦 Your Dabba is Active</Text>
              <Text style={styles.activePlan}>{subscription.plan_type} · {subscription.billing_cycle}</Text>
              {subscription.next_delivery && (
                <Text style={styles.activeNext}>
                  Next delivery: {new Date(subscription.next_delivery).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              )}
              <Text style={styles.activePrice}>£{subscription.price?.toFixed(2)}/week</Text>
            </LinearGradient>

            <View style={styles.activeActions}>
              <TouchableOpacity style={styles.pauseBtn}>
                <Text style={styles.pauseText}>Pause Deliveries</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel Subscription</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Explainer header */}
            <LinearGradient colors={[COLORS.crimson, '#5a0016']} style={styles.explainerHeader}>
              <Text style={styles.explainerTagline}>A hot dabba, every day, like clockwork</Text>
              <Text style={styles.explainerTitle}>The Dabba Wala</Text>
              <View style={styles.goldLine} />
              <View style={styles.steps}>
                {STEPS.map(step => (
                  <View key={step.num} style={styles.step}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepEmoji}>{step.icon}</Text>
                      <View style={styles.stepNumBadge}>
                        <Text style={styles.stepNum}>{step.num}</Text>
                      </View>
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Plan selection */}
            <View style={styles.planSection}>
              <Text style={styles.planHeading}>Choose Your Plan</Text>

              {/* Billing toggle */}
              <View style={styles.billingToggle}>
                {['weekly', 'monthly'].map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.billingBtn, billing === b && styles.billingActive]}
                    onPress={() => setBilling(b)}
                  >
                    <Text style={[styles.billingText, billing === b && styles.billingActiveText]}>
                      {b === 'weekly' ? 'Weekly' : 'Monthly (save 10%)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Plans */}
              {PLANS.map(plan => {
                const price = billing === 'monthly' ? (plan.price * 4 * 0.9).toFixed(0) : plan.price;
                const period = billing === 'monthly' ? '/month' : '/week';
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected, SHADOW.light]}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    <View style={styles.planLeft}>
                      <Text style={styles.planIcon}>{plan.icon}</Text>
                      <View>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planSub}>{plan.sub}</Text>
                      </View>
                    </View>
                    <View style={styles.planRight}>
                      <Text style={styles.planPrice}>£{price}</Text>
                      <Text style={styles.planPeriod}>{period}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Promo */}
              <View style={styles.promoBanner}>
                <Text style={styles.promoText}>🎁 15% off your first month — use code <Text style={{ fontFamily: FONTS.bodyBold }}>HOME15</Text></Text>
              </View>

              <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe} disabled={subscribing}>
                <Text style={styles.subscribeBtnText}>{subscribing ? 'Setting up...' : 'Start My Dabba →'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  activeSection: { padding: SPACING.xl },
  activeCard: { borderRadius: RADIUS.xl, padding: 20, marginBottom: 14 },
  activeTitle: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.white, marginBottom: 6 },
  activePlan: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.gold, textTransform: 'capitalize', marginBottom: 4 },
  activeNext: { fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  activePrice: { fontFamily: FONTS.bodyBold, fontSize: 20, color: COLORS.white },
  activeActions: { gap: 12, alignItems: 'center' },
  pauseBtn: { borderWidth: 1.5, borderColor: COLORS.crimson, borderRadius: RADIUS.sm, paddingHorizontal: 24, paddingVertical: 10, alignSelf: 'stretch', alignItems: 'center' },
  pauseText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.crimson },
  cancelText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.red, textDecorationLine: 'underline' },
  explainerHeader: { padding: 24, paddingTop: 28 },
  explainerTagline: { fontFamily: FONTS.bodyMedium, fontSize: 10, color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' },
  explainerTitle: { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.white, textAlign: 'center', marginTop: 6 },
  goldLine: { width: 32, height: 2, backgroundColor: COLORS.gold, alignSelf: 'center', marginTop: 10, marginBottom: 20 },
  steps: { flexDirection: 'row', justifyContent: 'space-around' },
  step: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' },
  stepEmoji: { fontSize: 20 },
  stepNumBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.gold, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  stepNum: { fontFamily: FONTS.bodyBold, fontSize: 8, color: COLORS.brown },
  stepTitle: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.white, textAlign: 'center', lineHeight: 14 },
  stepDesc: { fontFamily: FONTS.body, fontSize: 9, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 13, marginTop: 4 },
  planSection: { padding: SPACING.xl },
  planHeading: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.brown, marginBottom: 14 },
  billingToggle: { flexDirection: 'row', backgroundColor: COLORS.lightGrey, borderRadius: RADIUS.md, padding: 3, marginBottom: 16 },
  billingBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: RADIUS.sm },
  billingActive: { backgroundColor: COLORS.white, ...SHADOW.light },
  billingText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  billingActiveText: { color: COLORS.brown, fontFamily: FONTS.bodySemiBold },
  planCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.border },
  planCardSelected: { borderColor: COLORS.crimson, backgroundColor: `${COLORS.crimson}05` },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  planIcon: { fontSize: 22 },
  planName: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.brown },
  planSub: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 2 },
  planRight: { alignItems: 'flex-end' },
  planPrice: { fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.crimson },
  planPeriod: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey },
  promoBanner: { backgroundColor: `${COLORS.gold}22`, borderWidth: 1, borderColor: `${COLORS.gold}60`, borderRadius: RADIUS.lg, padding: 12, marginBottom: 16, alignItems: 'center' },
  promoText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.deepGold, textAlign: 'center' },
  subscribeBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, alignItems: 'center', justifyContent: 'center' },
  subscribeBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },
});
