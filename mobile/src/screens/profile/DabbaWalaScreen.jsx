import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import LoadingScreen from '../../components/LoadingScreen';

// ─── Plans & boxes (spec-exact) ──────────────────────────────────────────────
const PLANS = [
  { id: 'weekly', name: 'Weekly trial', price: 45, perMeal: 9, meals: 5, badge: 'Start here', badgeColor: COLORS.crimson },
  { id: 'monthly', name: 'Monthly saver', price: 160, perMeal: 8, meals: 20, badge: 'Best value', badgeColor: '#059669' },
];

const BOXES = [
  { id: 'prasada', name: 'Prasada box', emoji: '🌿', desc: 'Vegetarian · temple-style · sattvic', mostChosen: false },
  { id: 'svadista', name: 'Svadista box', emoji: '🔥', desc: 'Non-veg · bold · village-style Telugu', mostChosen: true },
];

const PREFS = [
  { id: 'no_onion_garlic', label: 'No onion/garlic' },
  { id: 'less_spicy', label: 'Less spicy' },
  { id: 'extra_spicy', label: 'Extra spicy' },
  { id: 'no_egg', label: 'No egg' },
  { id: 'jain', label: 'Jain' },
  { id: 'no_mushroom', label: 'No mushroom' },
  { id: 'no_brinjal', label: 'No brinjal' },
  { id: 'gluten_free', label: 'Gluten-free' },
];

const DELIVERY_INSTRS = [
  { id: 'ring', label: 'Ring bell', emoji: '🔔' },
  { id: 'call', label: 'Call me', emoji: '📞' },
  { id: 'door', label: 'Leave at door', emoji: '🚪' },
  { id: 'neighbour', label: 'Leave with neighbour', emoji: '🏘' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// ─── Week helper ─────────────────────────────────────────────────────────────
function getRecommendedWeek() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const isSundayEvening = day === 0 && now.getHours() >= 17;
  // Next Monday
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday + (isSundayEvening ? 7 : 0));
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

function formatWeekLabel(date, recommended = false) {
  const mon = new Date(date);
  const fri = new Date(date);
  fri.setDate(mon.getDate() + 4);
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(mon)} – ${fmt(fri)}${recommended ? ' · Recommended' : ''}`;
}

function getWeekOptions() {
  const rec = getRecommendedWeek();
  return [0, 1, 2].map(offset => {
    const d = new Date(rec);
    d.setDate(rec.getDate() + offset * 7);
    return d;
  });
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step, total }) {
  return (
    <View style={sb.wrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[sb.seg, i < step && sb.segDone, i === step - 1 && sb.segActive]} />
      ))}
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 4, paddingHorizontal: SPACING.xl, paddingBottom: 12 },
  seg: { flex: 1, height: 3, backgroundColor: COLORS.lightGrey, borderRadius: 2 },
  segDone: { backgroundColor: `${COLORS.crimson}60` },
  segActive: { backgroundColor: COLORS.crimson },
});

// ─── Step 1: Plan ─────────────────────────────────────────────────────────────
function StepPlan({ value, onChange }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeading}>Choose your plan</Text>
      <Text style={styles.stepSub}>Both plans run Mon–Fri. No card needed — we contact you for payment.</Text>
      {PLANS.map(plan => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.optionCard, value === plan.id && styles.optionCardSelected]}
          onPress={() => onChange(plan.id)}
          activeOpacity={0.85}
        >
          <View style={styles.optionTop}>
            <View style={styles.optionRadio}>
              {value === plan.id && <View style={styles.optionRadioDot} />}
            </View>
            <View style={styles.optionBody}>
              <Text style={styles.optionName}>{plan.name}</Text>
              <Text style={styles.optionDesc}>{plan.meals} meals · £{plan.perMeal}/meal</Text>
            </View>
            <View>
              <Text style={styles.optionPrice}>£{plan.price}</Text>
              <Text style={styles.optionPriceSub}>{plan.id === 'weekly' ? '/week' : '/month'}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: plan.badgeColor }]}>
            <Text style={styles.badgeText}>{plan.badge}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Step 2: Box ──────────────────────────────────────────────────────────────
function StepBox({ value, onChange }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeading}>Choose your box</Text>
      <Text style={styles.stepSub}>Your box shapes every meal in your plan.</Text>
      {BOXES.map(box => (
        <TouchableOpacity
          key={box.id}
          style={[styles.optionCard, value === box.id && styles.optionCardSelected]}
          onPress={() => onChange(box.id)}
          activeOpacity={0.85}
        >
          <View style={styles.optionTop}>
            <View style={styles.optionRadio}>
              {value === box.id && <View style={styles.optionRadioDot} />}
            </View>
            <Text style={styles.boxEmoji}>{box.emoji}</Text>
            <View style={styles.optionBody}>
              <Text style={styles.optionName}>{box.name}</Text>
              <Text style={styles.optionDesc}>{box.desc}</Text>
            </View>
          </View>
          {box.mostChosen && (
            <View style={[styles.badge, { backgroundColor: '#D97706' }]}>
              <Text style={styles.badgeText}>Most chosen</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Step 3: Menu preview ─────────────────────────────────────────────────────
function StepMenuPreview({ boxType }) {
  const weeks = getWeekOptions();
  const [weekIdx, setWeekIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [preview, setPreview] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!boxType) return;
    setLoading(true);
    const weekDate = weeks[weekIdx];
    const isoDate = weekDate.toISOString().split('T')[0];
    api.get('/menu/weekly-preview', { params: { week: isoDate, box_type: boxType } })
      .then(r => setPreview(r.data || {}))
      .catch(() => setPreview({}))
      .finally(() => setLoading(false));
  }, [weekIdx, boxType]);

  const dayItems = preview[DAYS[dayIdx]] || [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
        <Text style={styles.stepHeading}>Menu preview</Text>
        <Text style={styles.stepSub}>See what's cooking. Menus rotate weekly.</Text>

        {/* Week selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekScroll}>
          {weeks.map((w, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.weekChip, weekIdx === i && styles.weekChipActive]}
              onPress={() => { setWeekIdx(i); setDayIdx(0); }}
            >
              <Text style={[styles.weekChipText, weekIdx === i && styles.weekChipTextActive]}>
                {formatWeekLabel(w, i === 0)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Day tabs */}
        <View style={styles.dayTabs}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayTab, dayIdx === i && styles.dayTabActive]}
              onPress={() => setDayIdx(i)}
            >
              <Text style={[styles.dayTabText, dayIdx === i && styles.dayTabTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Text style={styles.previewLoading}>Loading menu...</Text>
        ) : dayItems.length > 0 ? (
          dayItems.map((item, i) => (
            <View key={i} style={styles.previewItem}>
              {item.image && <Image source={{ uri: item.image }} style={styles.previewImage} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName}>{item.name}</Text>
                {item.description && <Text style={styles.previewDesc} numberOfLines={2}>{item.description}</Text>}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.previewEmpty}>
            <Text style={styles.previewEmptyEmoji}>🍱</Text>
            <Text style={styles.previewEmptyText}>Menu for this week will be announced soon.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Step 4: Prefs ────────────────────────────────────────────────────────────
function StepPrefs({ selected, onChange, custom, onCustomChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(p => p !== id));
    else onChange([...selected, id]);
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeading}>Dietary preferences</Text>
      <Text style={styles.stepSub}>We'll apply these to every meal in your plan.</Text>
      <View style={styles.prefsGrid}>
        {PREFS.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.prefChip, selected.includes(p.id) && styles.prefChipActive]}
            onPress={() => toggle(p.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.prefText, selected.includes(p.id) && styles.prefTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.fieldLabel}>Anything else?</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Free-text request (e.g. no tomatoes, extra gravy...)"
        placeholderTextColor={COLORS.grey}
        value={custom}
        onChangeText={onCustomChange}
        multiline
        numberOfLines={3}
      />
    </ScrollView>
  );
}

// ─── Step 5: Details ──────────────────────────────────────────────────────────
function StepDetails({ data, onChange }) {
  const [postcodeStatus, setPostcodeStatus] = useState(null);

  useEffect(() => {
    if (data.postcode.trim().length < 5) { setPostcodeStatus(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.post('/delivery/check', { postcode: data.postcode.trim().toUpperCase() });
        const ok = res.data.service_type === 'full';
        setPostcodeStatus({ ok, city: res.data.city });
        if (ok && res.data.city && !data.city) onChange({ ...data, city: res.data.city });
      } catch { setPostcodeStatus(null); }
    }, 600);
    return () => clearTimeout(t);
  }, [data.postcode]);

  const f = (key) => (val) => onChange({ ...data, [key]: val });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
        <Text style={styles.stepHeading}>Your details</Text>
        <Text style={styles.stepSub}>Where shall we deliver your Dabba?</Text>

        <Text style={styles.fieldLabel}>Full name</Text>
        <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={COLORS.grey} value={data.name} onChangeText={f('name')} />

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor={COLORS.grey} value={data.email} onChangeText={f('email')} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput style={styles.input} placeholder="07xxx xxxxxx" placeholderTextColor={COLORS.grey} value={data.phone} onChangeText={f('phone')} keyboardType="phone-pad" />

        <Text style={styles.fieldLabel}>Address line 1</Text>
        <TextInput style={styles.input} placeholder="House / flat number and street" placeholderTextColor={COLORS.grey} value={data.line1} onChangeText={f('line1')} />

        <Text style={styles.fieldLabel}>Address line 2 (optional)</Text>
        <TextInput style={styles.input} placeholder="Apartment, building, etc." placeholderTextColor={COLORS.grey} value={data.line2} onChangeText={f('line2')} />

        <Text style={styles.fieldLabel}>City</Text>
        <TextInput style={styles.input} placeholder="e.g. Milton Keynes" placeholderTextColor={COLORS.grey} value={data.city} onChangeText={f('city')} />

        <Text style={styles.fieldLabel}>Postcode</Text>
        <TextInput
          style={[styles.input, postcodeStatus && { borderColor: postcodeStatus.ok ? '#059669' : '#DC2626' }]}
          placeholder="e.g. MK9 2FP"
          placeholderTextColor={COLORS.grey}
          value={data.postcode}
          onChangeText={f('postcode')}
          autoCapitalize="characters"
        />
        {postcodeStatus && (
          <Text style={[styles.postcodeMsg, { color: postcodeStatus.ok ? '#059669' : '#DC2626' }]}>
            {postcodeStatus.ok ? `✓ We deliver to ${postcodeStatus.city}` : '✗ Outside our delivery area — contact us to check'}
          </Text>
        )}

        <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>Delivery instruction</Text>
        <View style={styles.doorGrid}>
          {DELIVERY_INSTRS.map(d => (
            <TouchableOpacity
              key={d.id}
              style={[styles.doorChip, data.delivery_instruction === d.id && styles.doorChipActive]}
              onPress={() => f('delivery_instruction')(d.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.doorEmoji}>{d.emoji}</Text>
              <Text style={[styles.doorLabel, data.delivery_instruction === d.id && { color: COLORS.crimson }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 6: Confirm ──────────────────────────────────────────────────────────
function StepConfirm({ plan, box, prefs, customPref, details, agreed, onAgreed }) {
  const planObj = PLANS.find(p => p.id === plan);
  const boxObj = BOXES.find(b => b.id === box);
  const weeks = getWeekOptions();
  const startDate = weeks[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeading}>Confirm your Dabba</Text>
      <Text style={styles.stepSub}>Review and submit — we'll call you to confirm and take payment.</Text>

      <View style={styles.confirmCard}>
        <Row label="Plan" value={planObj?.name} />
        <Row label="Price" value={`£${planObj?.price}/${plan === 'weekly' ? 'week' : 'month'}`} />
        <Row label="Box" value={`${boxObj?.emoji} ${boxObj?.name}`} />
        <Row label="Meals" value={`${planObj?.meals} meals · Mon–Fri`} />
        <Row label="Starts" value={startDate} />
        {prefs.length > 0 && (
          <Row label="Prefs" value={prefs.map(id => PREFS.find(p => p.id === id)?.label).join(', ')} />
        )}
        {customPref?.trim() && <Row label="Notes" value={customPref.trim()} />}
        <View style={styles.confirmDivider} />
        <Row label="Name" value={details.name} />
        <Row label="Address" value={[details.line1, details.line2, details.city, details.postcode].filter(Boolean).join(', ')} />
        <Row label="Phone" value={details.phone} />
      </View>

      <View style={styles.noCardNote}>
        <Text style={styles.noCardText}>💳  No card needed — we'll contact you within 2 hours to confirm and arrange payment.</Text>
      </View>

      <TouchableOpacity style={styles.termsRow} onPress={() => onAgreed(!agreed)} activeOpacity={0.8}>
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.termsText}>I agree to the subscription terms. I understand I can pause or cancel anytime.</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.confirmRow}>
      <Text style={styles.confirmKey}>{label}</Text>
      <Text style={styles.confirmVal} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ─── Active subscription view ─────────────────────────────────────────────────
function ActiveView({ subscription, onCancel, onPause }) {
  const planObj = PLANS.find(p => p.id === subscription.plan_type);
  const boxObj = BOXES.find(b => b.id === subscription.box_type);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 80 }}>
      <LinearGradient colors={[COLORS.crimson, '#5a0016']} style={styles.activeGrad}>
        <Text style={styles.activeChip}>📦  Active Dabba</Text>
        <Text style={styles.activePlanName}>{planObj?.name || subscription.plan_type}</Text>
        <Text style={styles.activeBox}>{boxObj?.emoji} {boxObj?.name || subscription.box_type}</Text>
        <View style={styles.activeDivider} />
        <Text style={styles.activeMeta}>
          {planObj?.meals || 5} meals · Mon–Fri
          {subscription.city ? ` · ${subscription.city}` : ''}
        </Text>
        {subscription.next_delivery && (
          <Text style={styles.activeNext}>
            Next delivery: {new Date(subscription.next_delivery).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        )}
        <Text style={styles.activePrice}>£{planObj?.price || subscription.price}<Text style={{ fontSize: 13, opacity: 0.8 }}>/{subscription.plan_type === 'weekly' ? 'week' : 'month'}</Text></Text>
      </LinearGradient>

      <TouchableOpacity style={styles.pauseBtn} onPress={onPause} activeOpacity={0.85}>
        <Text style={styles.pauseText}>Pause Deliveries</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ alignItems: 'center', marginTop: 14 }} onPress={onCancel}>
        <Text style={styles.cancelLink}>Cancel Subscription</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────
function SuccessView({ onDone }) {
  return (
    <View style={styles.successWrap}>
      <View style={styles.successCircle}>
        <Text style={styles.successTick}>✓</Text>
      </View>
      <Text style={styles.successHeading}>Your Dabba is booked!</Text>
      <Text style={styles.successBody}>We'll reach out within 2 hours to confirm your first delivery and sort payment. Sit tight.</Text>
      <TouchableOpacity style={styles.successBtn} onPress={onDone} activeOpacity={0.9}>
        <Text style={styles.successBtnText}>Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
const TOTAL_STEPS = 6;

export default function DabbaWalaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [screenState, setScreenState] = useState('loading'); // loading | wizard | active | success
  const [subscription, setSubscription] = useState(null);
  const [step, setStep] = useState(1);

  // Wizard state
  const [plan, setPlan] = useState('weekly');
  const [box, setBox] = useState('prasada');
  const [prefs, setPrefs] = useState([]);
  const [customPref, setCustomPref] = useState('');
  const [details, setDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    line1: '', line2: '', city: '', postcode: '',
    delivery_instruction: 'ring',
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('ssp_postcode').then(pc => {
      if (pc) setDetails(d => ({ ...d, postcode: pc }));
    });
    api.get('/subscriptions')
      .then(r => {
        const active = (r.data || []).find(s => ['active', 'paused'].includes(s.status));
        if (active) { setSubscription(active); setScreenState('active'); }
        else setScreenState('wizard');
      })
      .catch(() => setScreenState('wizard'));
  }, []);

  const handleNext = () => {
    if (step === 1 && !plan) { Alert.alert('', 'Please choose a plan.'); return; }
    if (step === 2 && !box) { Alert.alert('', 'Please choose a box.'); return; }
    if (step === 5) {
      const { name, email, phone, line1, city, postcode } = details;
      if (!name.trim() || !email.trim() || !phone.trim() || !line1.trim() || !postcode.trim()) {
        Alert.alert('', 'Please fill in all required fields.'); return;
      }
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!agreed) { Alert.alert('', 'Please agree to the subscription terms.'); return; }
    setSubmitting(true);
    try {
      const weeks = getWeekOptions();
      await api.post('/subscriptions', {
        plan_type: plan,
        box_type: box,
        preferences: prefs,
        custom_preference: customPref.trim() || undefined,
        delivery_address: {
          line1: details.line1,
          line2: details.line2 || undefined,
          city: details.city,
          postcode: details.postcode.trim().toUpperCase(),
        },
        customer_name: details.name,
        customer_email: details.email,
        customer_phone: details.phone,
        delivery_instruction: details.delivery_instruction,
        start_date: weeks[0].toISOString().split('T')[0],
        price: PLANS.find(p => p.id === plan)?.price,
      });
      setScreenState('success');
    } catch (err) {
      Alert.alert('', err?.response?.data?.detail || 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
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
              await api.put(`/subscriptions/${subscription.id}/status`, { status: 'cancelled' });
              setSubscription(null);
              setScreenState('wizard');
            } catch { Alert.alert('', 'Could not cancel. Please contact us.'); }
          }
        },
      ]
    );
  };

  const handlePause = () => {
    Alert.alert('Pause Deliveries', 'This will pause your Dabba for the next week. Resume anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pause', onPress: async () => {
          try {
            await api.put(`/subscriptions/${subscription.id}/status`, { status: 'paused' });
            Alert.alert('', 'Deliveries paused. We\'ll see you next week!');
          } catch { Alert.alert('', 'Could not pause. Please contact us.'); }
        }
      }
    ]);
  };

  if (screenState === 'loading') return <LoadingScreen />;

  if (screenState === 'success') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SuccessView onDone={() => navigation.goBack()} />
      </View>
    );
  }

  if (screenState === 'active') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dabba Wala</Text>
          <View style={{ width: 36 }} />
        </View>
        <ActiveView subscription={subscription} onCancel={handleCancel} onPause={handlePause} />
      </View>
    );
  }

  // Wizard
  const STEP_TITLES = ['Choose plan', 'Choose box', 'Menu preview', 'Preferences', 'Your details', 'Confirm'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          onPress={() => { if (step > 1) setStep(step - 1); else navigation.goBack(); }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dabba Wala</Text>
          <Text style={styles.headerSub}>{STEP_TITLES[step - 1]}</Text>
        </View>
        <Text style={styles.headerStep}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <StepBar step={step} total={TOTAL_STEPS} />

      {/* Step content */}
      <View style={{ flex: 1 }}>
        {step === 1 && <StepPlan value={plan} onChange={setPlan} />}
        {step === 2 && <StepBox value={box} onChange={setBox} />}
        {step === 3 && <StepMenuPreview boxType={box} />}
        {step === 4 && <StepPrefs selected={prefs} onChange={setPrefs} custom={customPref} onCustomChange={setCustomPref} />}
        {step === 5 && <StepDetails data={details} onChange={setDetails} />}
        {step === 6 && <StepConfirm plan={plan} box={box} prefs={prefs} customPref={customPref} details={details} agreed={agreed} onAgreed={setAgreed} />}
      </View>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
            <Text style={styles.nextBtnText}>{step === 3 ? 'Looks good →' : 'Continue →'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, (!agreed || submitting) && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={!agreed || submitting}
            activeOpacity={0.9}
          >
            <Text style={styles.nextBtnText}>{submitting ? 'Submitting...' : 'Start My Dabba 🍱'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },

  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: COLORS.crimson },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.crimson },
  headerSub: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, marginTop: 1 },
  headerStep: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.grey, width: 36, textAlign: 'right' },

  stepContent: { padding: SPACING.xl, paddingBottom: 100 },
  stepHeading: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.brown, marginBottom: 6 },
  stepSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, lineHeight: 20, marginBottom: 20 },

  // Option card (plans/boxes)
  optionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: COLORS.border, ...SHADOW.light },
  optionCardSelected: { borderColor: COLORS.crimson, backgroundColor: `${COLORS.crimson}05` },
  optionTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center' },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.crimson },
  optionBody: { flex: 1 },
  optionName: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.brown },
  optionDesc: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, marginTop: 2 },
  optionPrice: { fontFamily: FONTS.bodyBold, fontSize: 22, color: COLORS.crimson, textAlign: 'right' },
  optionPriceSub: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.grey, textAlign: 'right' },
  badge: { alignSelf: 'flex-end', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  badgeText: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.white, textTransform: 'uppercase', letterSpacing: 0.8 },
  boxEmoji: { fontSize: 28 },

  // Menu preview
  weekScroll: { gap: 8, marginBottom: 14 },
  weekChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  weekChipActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  weekChipText: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.grey },
  weekChipTextActive: { color: COLORS.white },
  dayTabs: { flexDirection: 'row', gap: 4, marginBottom: 14 },
  dayTab: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: COLORS.lightGrey, alignItems: 'center' },
  dayTabActive: { backgroundColor: COLORS.crimson },
  dayTabText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  dayTabTextActive: { color: COLORS.white },
  previewItem: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey, alignItems: 'center' },
  previewImage: { width: 50, height: 50, borderRadius: RADIUS.md, resizeMode: 'cover' },
  previewName: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.brown, marginBottom: 2 },
  previewDesc: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.grey, lineHeight: 16 },
  previewLoading: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, textAlign: 'center', marginTop: 20 },
  previewEmpty: { alignItems: 'center', marginTop: 30 },
  previewEmptyEmoji: { fontSize: 36, marginBottom: 10 },
  previewEmptyText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, textAlign: 'center', lineHeight: 20 },

  // Prefs
  prefsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  prefChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  prefChipActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  prefText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  prefTextActive: { color: COLORS.white },

  // Inputs
  fieldLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.body, fontSize: 14, color: COLORS.brown, backgroundColor: COLORS.white, marginBottom: SPACING.md },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  postcodeMsg: { fontFamily: FONTS.bodyMedium, fontSize: 12, marginTop: -8, marginBottom: 8 },

  // Door instruction
  doorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  doorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  doorChipActive: { borderColor: COLORS.crimson, backgroundColor: `${COLORS.crimson}08` },
  doorEmoji: { fontSize: 14 },
  doorLabel: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },

  // Confirm
  confirmCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, marginBottom: 14, ...SHADOW.light },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  confirmKey: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.grey, flex: 0.35 },
  confirmVal: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.brown, flex: 0.65, textAlign: 'right' },
  confirmDivider: { height: 1, backgroundColor: COLORS.lightGrey, marginVertical: 8 },
  noCardNote: { backgroundColor: '#FFF8E7', borderRadius: RADIUS.lg, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: `${COLORS.gold}60` },
  noCardText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: '#92400E', lineHeight: 18 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingBottom: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: COLORS.crimson, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: COLORS.crimson },
  checkboxTick: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.white },
  termsText: { flex: 1, fontFamily: FONTS.body, fontSize: 12, color: COLORS.grey, lineHeight: 18 },

  // Active
  activeGrad: { borderRadius: RADIUS.xl, padding: 22, marginBottom: 16 },
  activeChip: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  activePlanName: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.white, marginBottom: 4 },
  activeBox: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.gold },
  activeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  activeMeta: { fontFamily: FONTS.body, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  activeNext: { fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  activePrice: { fontFamily: FONTS.bodyBold, fontSize: 28, color: COLORS.white },
  pauseBtn: { borderWidth: 1.5, borderColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 46, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pauseText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.crimson },
  cancelLink: { fontFamily: FONTS.body, fontSize: 12, color: '#DC2626', textDecorationLine: 'underline' },

  // Success
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTick: { fontSize: 38, color: COLORS.white },
  successHeading: { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.brown, textAlign: 'center', marginBottom: 12 },
  successBody: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.grey, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  successBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 50, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
  successBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.white },

  // Footer
  footer: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGrey, paddingHorizontal: SPACING.xl, paddingTop: 12 },
  nextBtn: { backgroundColor: COLORS.crimson, borderRadius: RADIUS.sm, height: 52, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.white },
});
