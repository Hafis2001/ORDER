import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  TouchableOpacity, Image, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Search, ChevronLeft, Plus, Minus, ShoppingCart, X } from 'lucide-react-native';
import { useCart } from '../context/CartContext';

const VEGETABLES = [
  { id: '1', name: 'Premium Tomatoes', weight: '1 Kg / Box', image: 'https://images.unsplash.com/photo-1518977676601-b53f02ac10dd?q=80&w=400', stock: 'In Stock' },
  { id: '2', name: 'Fresh Carrots', weight: '500g / Box', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=400', stock: 'In Stock' },
  { id: '3', name: 'Green Broccoli', weight: '800g / Box', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=400', stock: 'In Stock' },
  { id: '4', name: 'Red Onions', weight: '1 Kg / Box', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=400', stock: 'Limited' },
  { id: '5', name: 'Fresh Spinach', weight: '250g / Box', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=400', stock: 'In Stock' },
  { id: '6', name: 'Bell Peppers', weight: '500g / Box', image: 'https://images.unsplash.com/photo-1563513128-f4174eb4d8ca?q=80&w=400', stock: 'In Stock' },
  { id: '7', name: 'Sweet Corn', weight: '300g / Box', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=400', stock: 'In Stock' },
  { id: '8', name: 'Cucumber', weight: '500g / Box', image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?q=80&w=400', stock: 'In Stock' },
];

function ItemRow({ item }) {
  const { setItemQty, getItemQty, isProductInCart, getProductTotalQty } = useCart();
  const [inputOpen, setInputOpen] = useState(false);
  const [unit, setUnit] = useState('Kg');
  const [qty, setQty] = useState('');
  const inputRef = useRef(null);

  const inCart = isProductInCart(item.id);
  const totalQtyInCart = getProductTotalQty(item.id);

  const openInput = () => {
    setInputOpen(true);
    // Pre-fill with existing quantity for this unit if any
    const existingQty = getItemQty(item.id, unit.toLowerCase());
    setQty(existingQty > 0 ? String(existingQty) : '');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const closeInput = () => {
    setInputOpen(false);
    setQty('');
  };

  const handleAdd = () => {
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Enter Quantity', 'Please type a valid quantity before adding.');
      return;
    }
    // Set the specific decimal amount
    setItemQty(item, unit.toLowerCase(), q);
    setQty('');
    setInputOpen(false);
  };

  return (
    <View style={[styles.card, inCart && styles.cardInCart]}>
      {/* Left: Product Image */}
      <View>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        {inCart && (
          <View style={styles.inCartBadge}>
            <ShoppingCart size={10} color="#FFF" />
            <Text style={styles.inCartText}>{totalQtyInCart}</Text>
          </View>
        )}
      </View>

      {/* Center: Product Info */}
      <View style={styles.cardBody}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemWeight}>{item.weight}</Text>
        <View style={[
          styles.stockBadge,
          { backgroundColor: item.stock === 'In Stock' ? '#E8F8EF' : '#FDECEA' }
        ]}>
          <Text style={[
            styles.stockText,
            { color: item.stock === 'In Stock' ? '#27AE60' : '#E74C3C' }
          ]}>
            {item.stock}
          </Text>
        </View>
      </View>

      {/* Right: + button OR inline input panel */}
      {inputOpen ? (
        <View style={styles.inputPanel}>
          {/* Unit chips: Kg / Box */}
          <View style={styles.unitRow}>
            <TouchableOpacity
              style={[styles.unitChip, unit === 'Kg' && styles.unitChipOn]}
              onPress={() => {
                setUnit('Kg');
                const existingQty = getItemQty(item.id, 'kg');
                setQty(existingQty > 0 ? String(existingQty) : '');
              }}
            >
              <Text style={[styles.unitChipTxt, unit === 'Kg' && styles.unitChipTxtOn]}>Kg</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitChip, unit === 'Box' && styles.unitChipOn]}
              onPress={() => {
                setUnit('Box');
                const existingQty = getItemQty(item.id, 'box');
                setQty(existingQty > 0 ? String(existingQty) : '');
              }}
            >
              <Text style={[styles.unitChipTxt, unit === 'Box' && styles.unitChipTxtOn]}>Box</Text>
            </TouchableOpacity>
          </View>

          {/* Quantity input */}
          <TextInput
            ref={inputRef}
            style={styles.qtyInput}
            value={qty}
            onChangeText={v => setQty(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="Qty"
            placeholderTextColor="#CCC"
            maxLength={6}
          />

          {/* Cancel + Add buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeInput}>
              <X size={16} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <ShoppingCart size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.plusBtn, inCart && styles.plusBtnInCart]} 
          onPress={openInput} 
          activeOpacity={0.85}
        >
          {inCart ? <Text style={styles.editBtnTxt}>Edit</Text> : <Plus size={20} color="#FFF" />}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function VegetablesListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = VEGETABLES.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: '#8E24AA' }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}> Products</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Cart')}>
          <ShoppingCart size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={16} color="#AAA" />
        <TextInput
          placeholder="Search products..."
          placeholderTextColor="#BBB"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ItemRow item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#FFF' },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: 14, backgroundColor: '#FFF', borderRadius: 14,
    paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: '#EEE',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },

  // List
  list: { paddingHorizontal: 14, paddingBottom: 30 },
  separator: { height: 12 },

  // Card â€” use flexDirection row, NO overflow hidden so input panel is visible
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 18,
    minHeight: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  cardInCart: {
    backgroundColor: '#F8F4FF', // slightly purple shade to indicate it's in cart
    borderColor: '#E8D5FA',
    borderWidth: 1,
  },
  cardImage: { width: 100, height: 100, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  inCartBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#8E24AA',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inCartText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    gap: 4,
  },
  itemName: { fontSize: 14, fontWeight: '800', color: '#1A2A3A', lineHeight: 20 },
  itemWeight: { fontSize: 11, color: '#AAA', fontWeight: '600' },
  stockBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  stockText: { fontSize: 9, fontWeight: '800' },

  // + button (default)
  plusBtn: {
    width: 52,
    backgroundColor: '#8E24AA',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  plusBtnInCart: {
    backgroundColor: '#8E24AA', // change color when in cart
  },
  editBtnTxt: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Inline input panel (replaces + button)
  inputPanel: {
    width: 120, // made longer
    backgroundColor: '#FAFAFA',
    borderLeftWidth: 1,
    borderLeftColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },

  // Kg / Box chips
  unitRow: { flexDirection: 'row', gap: 4, width: '100%' },
  unitChip: {
    flex: 1, paddingVertical: 5, borderRadius: 8,
    backgroundColor: '#F0F0F0', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  unitChipOn: { backgroundColor: '#FFF0F7', borderColor: '#8E24AA' },
  unitChipTxt: { fontSize: 11, fontWeight: '800', color: '#999' },
  unitChipTxtOn: { color: '#8E24AA' },

  // Quantity input
  qtyInput: {
    width: '100%', height: 44, // made higher
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#EEE',
    borderRadius: 10, textAlign: 'center',
    fontSize: 18, fontWeight: '900', color: '#1A2A3A',
  },

  // Cancel / Add
  actionRow: { flexDirection: 'row', gap: 6, width: '100%' },
  cancelBtn: {
    flex: 1, height: 32, borderRadius: 8, // made a bit bigger
    backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
  },
  addBtn: {
    flex: 1, height: 32, borderRadius: 8, // made a bit bigger
    backgroundColor: '#8E24AA', justifyContent: 'center', alignItems: 'center',
  },
});
