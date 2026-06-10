import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Dimensions,
  TextInput, Alert, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeft, ShoppingCart, Plus, Minus, Star, ChevronDown } from 'lucide-react-native';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

const UNITS = ['CTN', 'KG', 'BAG', 'TRY', 'PC', 'BOX', 'BDL', 'PKT'];

export default function ItemDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const { getItemQty, setItemQty, productCount } = useCart();
  const [unit, setUnit] = useState('KG');
  const [qtyText, setQtyText] = useState('');
  const [remarks, setRemarks] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const qty = getItemQty(item.id, unit.toLowerCase());
  const scrollViewRef = useRef(null);

  const handleAddToCart = () => {
    const q = parseFloat(qtyText);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Enter Quantity', 'Please type a valid quantity before adding.');
      return;
    }
    setItemQty(item, unit.toLowerCase(), q, remarks.trim());
    setQtyText('');
    setRemarks('');
    navigation.goBack();
  };

  const isVeg = item.category === 'Vegetables';
  const isOutOfStock = item.isInStock === false;
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Detail</Text>
        <TouchableOpacity style={styles.cartHeaderBtn} onPress={() => navigation.navigate('Cart')}>
          <ShoppingCart size={20} color="#8E24AA" />
          {productCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{productCount > 99 ? '99+' : productCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Image Hero */}
        <View style={[styles.hero, { backgroundColor: '#8E24AA' }]}>
          <Image source={{ uri: item.image }} style={styles.heroImg} />
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemWeight}>{item.weight}</Text>
          {isOutOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={13} color={s <= 4 ? '#F7A800' : '#DDD'} fill={s <= 4 ? '#F7A800' : 'none'} />
            ))}
            <Text style={styles.ratingText}>4.0 (128 reviews)</Text>
          </View>



          {/* Description */}
          <Text style={styles.descTitle}>About this product</Text>
          <Text style={styles.descText}>{item.description}</Text>

          {/* Unit Toggle */}
          <Text style={styles.unitLabel}>Select unit</Text>
          <TouchableOpacity 
            style={styles.unitDropdownBtn} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.unitDropdownTxt}>{unit}</Text>
            <ChevronDown size={20} color="#8E24AA" />
          </TouchableOpacity>

          <Modal visible={modalVisible} transparent={true} animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Unit</Text>
                {UNITS.map(u => (
                  <TouchableOpacity 
                    key={u} 
                    style={styles.unitOption} 
                    onPress={() => {
                      setUnit(u);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[styles.unitOptionText, unit === u && styles.unitOptionTextSelected]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Quantity Input */}
          <Text style={styles.unitLabel}>Quantity</Text>
          <View style={styles.qtyInputRow}>
            <TouchableOpacity
              style={styles.qtyStepBtn}
              onPress={() => {
                const cur = parseFloat(qtyText) || 0;
                if (cur > 0) setQtyText(String(parseFloat((cur - 1).toFixed(3))));
              }}
            >
              <Minus size={18} color="#8E24AA" />
            </TouchableOpacity>
            <TextInput
              style={styles.qtyTypeInput}
              value={qtyText}
              onChangeText={v => setQtyText(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder={qty > 0 ? String(qty) : '0'}
              placeholderTextColor="#BBB"
              maxLength={8}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 200);
              }}
            />
            <TouchableOpacity
              style={styles.qtyStepBtn}
              onPress={() => {
                const cur = parseFloat(qtyText) || 0;
                setQtyText(String(parseFloat((cur + 1).toFixed(3))));
              }}
            >
              <Plus size={18} color="#8E24AA" />
            </TouchableOpacity>
          </View>
          {qty > 0 && (
            <Text style={styles.inCartNote}>Currently in cart: {Number(qty).toFixed(3)} {unit}</Text>
          )}

          {/* Per-item Remark */}
          <Text style={styles.unitLabel}>Item Remark</Text>
          <TextInput
            style={styles.remarkInput}
            placeholder="Add a note for this item (optional)..."
            placeholderTextColor="#BBBBBB"
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="done"
            maxLength={200}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 200);
            }}
          />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {isOutOfStock ? (
          <View style={[styles.addBtn, { opacity: 0.6 }]}>
            <View style={[styles.addBtnGrad, { backgroundColor: '#888' }]}>
              <Text style={styles.addBtnText}>Out of Stock</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} activeOpacity={0.85}>
            <View style={[styles.addBtnGrad, { backgroundColor: '#8E24AA' }]}>
              <ShoppingCart size={18} color="#FFF" />
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
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
  heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  catTag: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  catTagText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  details: { padding: 20 },
  itemName: { fontSize: 20, fontWeight: '900', color: '#1A2A3A' },
  itemWeight: { fontSize: 12, color: '#AAA', marginTop: 4 },
  outOfStockBadge: { alignSelf: 'flex-start', backgroundColor: '#FDECEA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  outOfStockBadgeText: { fontSize: 11, fontWeight: '800', color: '#E74C3C' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  ratingText: { fontSize: 11, color: '#888', marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 14, marginBottom: 4 },
  priceWhole: { fontSize: 30, fontWeight: '900', color: '#1A2A3A' },
  priceDec: { fontSize: 16, fontWeight: '700', color: '#1A2A3A', marginBottom: 2 },
  pricePer: { fontSize: 13, color: '#AAA', marginLeft: 6, marginBottom: 4 },
  descTitle: { fontSize: 13, fontWeight: '800', color: '#1A2A3A', marginTop: 18 },
  descText: { fontSize: 12, color: '#666', lineHeight: 18, marginTop: 5 },
  unitLabel: { fontSize: 13, fontWeight: '800', color: '#1A2A3A', marginTop: 18, marginBottom: 8 },
  unitDropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#FFF0F7', borderWidth: 1, borderColor: '#8E24AA',
  },
  unitDropdownTxt: { fontSize: 14, fontWeight: '800', color: '#8E24AA' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '80%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 15, textAlign: 'center',
  },
  unitOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  unitOptionText: { fontSize: 16, color: '#555', textAlign: 'center' },
  unitOptionTextSelected: { color: '#8E24AA', fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8 },
  qtyInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  qtyStepBtn: { width: 44, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0FF' },
  qtyTypeInput: { flex: 1, height: 48, textAlign: 'center', fontSize: 22, fontWeight: '900', color: '#1A2A3A' },
  inCartNote: { fontSize: 11, color: '#8E24AA', fontWeight: '700', marginTop: 6 },
  remarkInput: {
    marginTop: 4,
    backgroundColor: '#F9F4FC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE0F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  addBtn: { flex: 1 },
  addBtnGrad: { borderRadius: 22, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
