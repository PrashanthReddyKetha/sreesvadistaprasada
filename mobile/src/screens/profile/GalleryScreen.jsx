import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Modal, Dimensions, TouchableWithoutFeedback,
  StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

const { width, height } = Dimensions.get('window');
const COL_WIDTH = (width - SPACING.xl * 2 - 10) / 2;

const GALLERY = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', caption: 'Chicken Biryani', tag: 'Svadista' },
  { id: '2', uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', caption: 'Sambar Rice', tag: 'Prasada' },
  { id: '3', uri: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800', caption: 'Masala Dosa', tag: 'Breakfast' },
  { id: '4', uri: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800', caption: 'Prawn Curry', tag: 'Svadista' },
  { id: '5', uri: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800', caption: 'Rasam & Rice', tag: 'Prasada' },
  { id: '6', uri: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800', caption: 'Mango Pickle', tag: 'Snacks' },
  { id: '7', uri: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800', caption: 'Ragi Mudde', tag: 'Ragi Specials' },
  { id: '8', uri: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800', caption: 'Lassi', tag: 'Drinks' },
  { id: '9', uri: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800', caption: 'Mirchi Bajji', tag: 'Street Food' },
  { id: '10', uri: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=90', caption: 'The Dabba', tag: 'Dabba Wala' },
  { id: '11', uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200', caption: 'Poori Masala', tag: 'Breakfast' },
  { id: '12', uri: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1200', caption: 'Gongura Mutton', tag: 'Svadista' },
];

const TAGS = ['All', 'Svadista', 'Prasada', 'Breakfast', 'Snacks', 'Street Food', 'Ragi Specials', 'Drinks', 'Dabba Wala'];

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const [activeTag, setActiveTag] = useState('All');
  const [lightbox, setLightbox] = useState(null); // index into filtered

  const filtered = activeTag === 'All' ? GALLERY : GALLERY.filter(g => g.tag === activeTag);

  const openLightbox = (idx) => setLightbox(idx);
  const closeLightbox = () => setLightbox(null);
  const prev = () => setLightbox(i => (i > 0 ? i - 1 : filtered.length - 1));
  const next = () => setLightbox(i => (i < filtered.length - 1 ? i + 1 : 0));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Gallery" />

      {/* Tag filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagScroll}
      >
        {TAGS.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagChip, activeTag === tag && styles.tagChipActive]}
            onPress={() => { setActiveTag(tag); setLightbox(null); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tagText, activeTag === tag && styles.tagTextActive]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.cell, { width: COL_WIDTH }]}
            onPress={() => openLightbox(index)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item.uri }} style={styles.cellImage} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.cellGrad} />
            <View style={styles.cellBottom}>
              <Text style={styles.cellCaption} numberOfLines={1}>{item.caption}</Text>
              <View style={styles.cellTag}>
                <Text style={styles.cellTagText}>{item.tag}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Lightbox modal */}
      <Modal visible={lightbox !== null} transparent animationType="fade" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={closeLightbox}>
          <View style={styles.lightboxBg}>
            <TouchableWithoutFeedback>
              <View style={styles.lightboxInner}>
                {lightbox !== null && (
                  <>
                    <Image
                      source={{ uri: filtered[lightbox]?.uri }}
                      style={styles.lightboxImage}
                      resizeMode="contain"
                    />
                    <View style={styles.lightboxCaption}>
                      <Text style={styles.lightboxCaptionText}>{filtered[lightbox]?.caption}</Text>
                      <Text style={styles.lightboxTag}>{filtered[lightbox]?.tag}</Text>
                    </View>

                    {/* Nav arrows */}
                    <TouchableOpacity style={[styles.navBtn, styles.navLeft]} onPress={prev}>
                      <Text style={styles.navIcon}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.navBtn, styles.navRight]} onPress={next}>
                      <Text style={styles.navIcon}>›</Text>
                    </TouchableOpacity>

                    {/* Close */}
                    <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 12 }]} onPress={closeLightbox}>
                      <Text style={styles.closeIcon}>✕</Text>
                    </TouchableOpacity>

                    {/* Counter */}
                    <Text style={[styles.counter, { bottom: insets.bottom + 20 }]}>
                      {lightbox + 1} / {filtered.length}
                    </Text>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },

  tagScroll: { paddingHorizontal: SPACING.xl, paddingVertical: 10, gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  tagChipActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  tagText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.grey },
  tagTextActive: { color: COLORS.white },

  grid: { paddingHorizontal: SPACING.xl, paddingBottom: 80 },
  row: { justifyContent: 'space-between', marginBottom: 10 },
  cell: { height: COL_WIDTH * 1.15, borderRadius: RADIUS.lg, overflow: 'hidden' },
  cellImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cellGrad: StyleSheet.absoluteFillObject,
  cellBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 },
  cellCaption: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.white, marginBottom: 3 },
  cellTag: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  cellTagText: { fontFamily: FONTS.body, fontSize: 9, color: 'rgba(255,255,255,0.8)' },

  // Lightbox
  lightboxBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  lightboxInner: { width, height, alignItems: 'center', justifyContent: 'center' },
  lightboxImage: { width: width, height: height * 0.72 },
  lightboxCaption: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center' },
  lightboxCaptionText: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.white, textAlign: 'center' },
  lightboxTag: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.gold, marginTop: 4 },
  navBtn: { position: 'absolute', top: '50%', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, marginTop: -22 },
  navLeft: { left: 16 },
  navRight: { right: 16 },
  navIcon: { fontSize: 28, color: COLORS.white, lineHeight: 34 },
  closeBtn: { position: 'absolute', right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeIcon: { fontSize: 14, color: COLORS.white },
  counter: { position: 'absolute', fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
});
