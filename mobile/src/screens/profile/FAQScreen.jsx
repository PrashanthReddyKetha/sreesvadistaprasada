import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    section: 'Ordering',
    items: [
      { q: 'How do I place an order?', a: 'Browse our menu, add dishes to your cart, and tap "Place Order". You can pay on delivery or collection.' },
      { q: 'What is the minimum order?', a: 'Minimum order for delivery is £12. There\'s no minimum for collection.' },
      { q: 'Can I customise my order?', a: 'Yes! Use the notes field at checkout to let us know about preferences, allergies, or spice levels.' },
      { q: 'How long does delivery take?', a: 'Typically 45–60 minutes, depending on your location and our current order volume. You\'ll see an ETA after placing your order.' },
    ],
  },
  {
    section: 'The Dabba Wala',
    items: [
      { q: 'What is the Dabba Wala?', a: 'The Dabba Wala is our weekly meal plan — a hot dabba delivered to your door Monday to Friday. Choose between our Weekly trial (£45, 5 meals) or Monthly saver (£160, 20 meals).' },
      { q: 'What\'s the difference between Prasada and Svadista boxes?', a: 'Prasada is 100% vegetarian, cooked in the sattvic temple tradition. Svadista is non-vegetarian — bold, rustic Telugu flavours with meat and egg dishes.' },
      { q: 'When does my Dabba start?', a: 'Subscriptions start on the next available Monday. If you subscribe on a Sunday after 5 PM, we\'ll start the following week.' },
      { q: 'Can I pause or cancel?', a: 'Yes — you can pause for a week or cancel anytime from your profile, with no fees or penalties.' },
      { q: 'How does payment work for the Dabba?', a: 'We contact you directly after you subscribe to arrange payment. No card is taken online.' },
    ],
  },
  {
    section: 'Delivery & Collection',
    items: [
      { q: 'Where do you deliver?', a: 'We currently deliver to Milton Keynes, Edinburgh, and Glasgow. Check the Delivery Areas screen for a full postcode list.' },
      { q: 'Is delivery free?', a: 'Delivery is free on orders over £30 for MK, Edinburgh, and Glasgow. A small delivery fee applies below that threshold, which may vary by area.' },
      { q: 'Can I collect instead?', a: 'Yes! Choose Collection at checkout for 10% off your order. We\'ll confirm the collection address when your order is ready.' },
      { q: 'How do I track my order?', a: 'Go to the Orders tab after placing your order to see a live status tracker.' },
    ],
  },
  {
    section: 'Food & Allergies',
    items: [
      { q: 'Do you cater for vegetarians and vegans?', a: 'The entire Prasada menu is vegetarian. Many dishes are also vegan — look for the vegan tag or ask us.' },
      { q: 'Do you use nuts?', a: 'Some dishes may contain nuts or be prepared in a kitchen that handles nuts. Please check allergen labels on each dish or contact us before ordering.' },
      { q: 'How spicy is the food?', a: 'We use a 🌶 flame system on each dish. One flame is mild, three flames is bold Telugu heat. You can always ask for milder spice in your order notes.' },
      { q: 'Is the food halal?', a: 'We use halal meat in all our Svadista dishes. Please contact us if you have specific requirements.' },
    ],
  },
  {
    section: 'Catering',
    items: [
      { q: 'Do you cater for events?', a: 'Yes — weddings, corporate events, poojas, birthdays, and more. We cater for 10 to 500+ guests. Use the Catering screen to get a quote.' },
      { q: 'How far in advance should I book?', a: 'We recommend at least 2 weeks for smaller events, and 4–6 weeks for large or formal occasions.' },
      { q: 'Can you do bespoke menus?', a: 'Absolutely. We\'ll work with you to create a menu that fits your event, dietary needs, and budget.' },
    ],
  },
];

function FAQItem({ item, expanded, onToggle }) {
  return (
    <TouchableOpacity style={styles.faqItem} onPress={onToggle} activeOpacity={0.75}>
      <View style={styles.faqTop}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Text style={[styles.faqToggle, expanded && { color: COLORS.crimson }]}>{expanded ? '−' : '+'}</Text>
      </View>
      {expanded && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(null); // 'section-idx'

  const toggle = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => prev === key ? null : key);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="FAQ" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Everything you need to know about our food, delivery, and meal plans.</Text>

        {FAQ_DATA.map((section, si) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                return (
                  <FAQItem
                    key={key}
                    item={item}
                    expanded={expanded === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.contactNote}>
          <Text style={styles.contactNoteText}>
            Still have a question?
          </Text>
          <Text style={styles.contactNoteBody}>
            Use the Contact Us screen to send us a message — we reply to every one personally.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  content: { padding: SPACING.xl, paddingBottom: 60 },
  intro: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.grey, lineHeight: 22, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.deepGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.light },
  faqItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.lightGrey },
  faqTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  faqQ: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.brown, flex: 1, paddingRight: 16, lineHeight: 21 },
  faqToggle: { fontFamily: FONTS.bodyBold, fontSize: 20, color: COLORS.grey, lineHeight: 24, marginTop: -1 },
  faqA: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, lineHeight: 21, marginTop: 10 },
  contactNote: { backgroundColor: COLORS.cream, borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: `${COLORS.gold}40` },
  contactNoteText: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.brown, marginBottom: 6 },
  contactNoteBody: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.grey, lineHeight: 20 },
});
