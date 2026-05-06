import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeft, ShoppingCart, Plus, Minus, Star } from 'lucide-react-native';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

export default function ItemDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const { getItemQty, addToCart, removeFromCart, totalItems } = useCart();
  const [unit, setUnit] = useState('kg');
  const qty = getItemQty(item.id, unit);

  const isVeg = item.category === 'Vegetables';


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Detail</Text>
        <TouchableOpacity style={styles.cartHeaderBtn} onPress={() => navigation.navigate('Cart')}>
          <ShoppingCart size={20} color="#8E24AA" />
          {totalItems > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{totalItems}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image Hero */}
        <View style={[styles.hero, { backgroundColor: '#8E24AA' }]}>
          <Image source={{ uri: item.image }} style={styles.heroImg} />
          <View style={styles.catTag}>
            <Text style={styles.catTagText}>{item.category}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemWeight}>{item.weight}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={13} color={s <= 4 ? '#F7A800' : '#DDD'} fill={s <= 4 ? '#F7A800' : 'none'} />
            ))}
            <Text style={styles.ratingText}>4.0 (128 reviews)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceWhole}>${item.price.split('.')[0]}</Text>
            <Text style={styles.priceDec}>.{item.price.split('.')[1]}</Text>
            <Text style={styles.pricePer}>/ {unit}</Text>
          </View>

          {/* Description */}
          <Text style={styles.descTitle}>About this product</Text>
          <Text style={styles.descText}>{item.description}</Text>

          {/* Unit Toggle */}
          <Text style={styles.unitLabel}>Select unit</Text>
          <View style={styles.unitRow}>
            {['kg', 'box'].map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, unit === u && styles.unitChipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {qty > 0 ? (
          <View style={styles.qtyControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id, unit)}>
              <Minus size={18} color="#8E24AA" />
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyNum}>{qty}</Text>
              <Text style={styles.qtyUnit}>{unit}</Text>
            </View>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item, unit)}>
              <Plus size={18} color="#8E24AA" />
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item, unit)} activeOpacity={0.85}>
          <View style={[styles.addBtnGrad, { backgroundColor: '#8E24AA' }]}>
            <ShoppingCart size={18} color="#FFF" />
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#222' },
  cartHeaderBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#8E24AA', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 7, fontWeight: 'bold' },
  hero: { width, height: 240, justifyContent: 'center', alignItems: 'center' },
  heroImg: { width: 180, height: 180, resizeMode: 'contain' },
  catTag: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  catTagText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  details: { padding: 20 },
  itemName: { fontSize: 20, fontWeight: '900', color: '#1A2A3A' },
  itemWeight: { fontSize: 12, color: '#AAA', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  ratingText: { fontSize: 11, color: '#888', marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 14, marginBottom: 4 },
  priceWhole: { fontSize: 30, fontWeight: '900', color: '#1A2A3A' },
  priceDec: { fontSize: 16, fontWeight: '700', color: '#1A2A3A', marginBottom: 2 },
  pricePer: { fontSize: 13, color: '#AAA', marginLeft: 6, marginBottom: 4 },
  descTitle: { fontSize: 13, fontWeight: '800', color: '#1A2A3A', marginTop: 18 },
  descText: { fontSize: 12, color: '#666', lineHeight: 18, marginTop: 5 },
  unitLabel: { fontSize: 13, fontWeight: '800', color: '#1A2A3A', marginTop: 18, marginBottom: 8 },
  unitRow: { flexDirection: 'row', gap: 10 },
  unitChip: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: '#E0E0E0' },
  unitChipActive: { backgroundColor: 'rgba(214,51,132,0.08)', borderColor: '#8E24AA' },
  unitChipText: { fontSize: 12, fontWeight: '700', color: '#888' },
  unitChipTextActive: { color: '#8E24AA' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(214,51,132,0.07)', borderRadius: 22, paddingHorizontal: 6, height: 44, gap: 6 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyDisplay: { alignItems: 'center', minWidth: 30 },
  qtyNum: { fontSize: 15, fontWeight: '900', color: '#8E24AA' },
  qtyUnit: { fontSize: 8, fontWeight: '700', color: '#8E24AA', textTransform: 'uppercase', marginTop: -2 },
  addBtn: { flex: 1 },
  addBtnGrad: { borderRadius: 22, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
