import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';
import VegDot from './VegDot';
import SpiceFlames from './SpiceFlames';
import AllergenBadge from './AllergenBadge';

export default function DishCard({ item, onPress, onAddToCart, onRemoveFromCart, qty = 0, width = 220 }) {
  return (
    <TouchableOpacity
      style={[styles.card, { width }, SHADOW.card]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.vegDot}>
          <VegDot isVeg={item.is_veg} />
        </View>
        {item.tag && (
          <View style={[styles.tag, { backgroundColor: item.tag === 'New' ? '#1D4ED8' : COLORS.gold }]}>
            <Text style={[styles.tagText, { color: item.tag === 'New' ? COLORS.white : COLORS.brown }]}>
              {item.tag}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <SpiceFlames level={item.spice_level} />
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        {item.allergens?.length > 0 && item.allergens[0] !== 'none' && (
          <View style={styles.allergens}>
            {item.allergens.slice(0, 3).map((a) => <AllergenBadge key={a} label={a} />)}
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>£{item.price?.toFixed(2)}</Text>
          {qty > 0 ? (
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => onRemoveFromCart?.(item.id)} activeOpacity={0.8}>
                <Text style={styles.stepIcon}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepQty}>{qty}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => onAddToCart?.(item)} activeOpacity={0.8}>
                <Text style={styles.stepIcon}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => onAddToCart?.(item)} activeOpacity={0.8}>
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginRight: 12,
  },
  imageContainer: {
    height: 130,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  vegDot: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tag: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    fontFamily: FONTS.bodyBold,
    textTransform: 'uppercase',
  },
  body: {
    padding: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.brown,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.grey,
    lineHeight: 16,
    marginBottom: 4,
  },
  allergens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.crimson,
  },
  addBtn: {
    backgroundColor: COLORS.crimson,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.white,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    borderWidth: 1.5,
    borderColor: COLORS.crimson,
    borderRadius: 6,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.crimson,
  },
  stepIcon: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 16,
  },
  stepQty: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.crimson,
    minWidth: 22,
    textAlign: 'center',
  },
});
