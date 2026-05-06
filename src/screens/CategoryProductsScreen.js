import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  TouchableOpacity, Image, TextInput, Alert, ScrollView,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeft, ShoppingCart, Search, Plus, X } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { fetchProducts } from '../api/products';

function ItemRow({ item }) {
  const { setItemQty, getItemQty, isProductInCart, getProductTotalQty, cartItems } = useCart();
  const [inputOpen, setInputOpen] = useState(false);
  const [unit, setUnit] = useState('Kg');
  const [qty, setQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const inputRef = useRef(null);

  const inCart = isProductInCart(item.id);
  const totalQtyInCart = getProductTotalQty(item.id);

  // Success animation shared value
  const successScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);

  const openInput = () => {
    setInputOpen(true);
    const existingQty = getItemQty(item.id, unit.toLowerCase());
    setQty(existingQty > 0 ? String(existingQty) : '');
    
    // Find existing remarks
    const cartKey = `${item.id}-${unit.toLowerCase()}`;
    const existingItem = cartItems?.find(i => i.cartKey === cartKey);
    setRemarks(existingItem?.remarks || '');
    
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const closeInput = () => {
    setInputOpen(false);
    setQty('');
    setRemarks('');
  };

  const handleAdd = () => {
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Enter Quantity', 'Please type a valid quantity before adding.');
      return;
    }
    
    // Trigger success animation
    successScale.value = 1;
    successOpacity.value = 1;
    successScale.value = withSpring(1.5, { damping: 12, stiffness: 90 });
    successOpacity.value = withSpring(0, { damping: 12, stiffness: 90 });

    setItemQty(item, unit.toLowerCase(), q, remarks);
    setQty('');
    setRemarks('');
    setInputOpen(false);
  };

  const successAnimStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0, left: 0, width: 100, height: 100,
    borderRadius: 18,
    backgroundColor: 'rgba(142,36,170,0.3)',
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
    zIndex: 10,
  }));

  return (
    <View style={[styles.card, inCart && styles.cardInCart]}>
      {/* Left: image */}
      <View>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        {/* Animated Ghost / Pulse */}
        <Animated.View style={successAnimStyle} pointerEvents="none" />
        
        {inCart && (
          <View style={styles.inCartBadge}>
            <ShoppingCart size={10} color="#FFF" />
            <Text style={styles.inCartText}>{totalQtyInCart}</Text>
          </View>
        )}
      </View>

      {/* Center: info */}
      <View style={styles.cardBody}>
        <Text style={styles.categoryLabel}>{item.category?.toUpperCase()}</Text>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemWeight}>{item.weight}</Text>
      </View>

      {/* Right: + button OR input panel */}
      {inputOpen ? (
        <View style={styles.inputPanel}>
          {/* Kg / Box chips */}
          <View style={styles.unitRow}>
            <TouchableOpacity
              style={[styles.unitChip, unit === 'Kg' && styles.unitChipOn]}
              onPress={() => setUnit('Kg')}
            >
              <Text style={[styles.unitChipTxt, unit === 'Kg' && styles.unitChipTxtOn]}>Kg</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitChip, unit === 'Box' && styles.unitChipOn]}
              onPress={() => setUnit('Box')}
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

          {/* Remarks input */}
          <TextInput
            style={styles.remarksInput}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Remarks (opt)"
            placeholderTextColor="#CCC"
            maxLength={30}
          />

          {/* Cancel + Add */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={closeInput}
              activeOpacity={0.7}
            >
              <X size={20} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addBtn} 
              onPress={handleAdd}
              activeOpacity={0.7}
            >
              <Text style={styles.addBtnTxt}>ADD TO CART</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.plusBtn, inCart && styles.plusBtnInCart]} 
          onPress={openInput} 
          activeOpacity={0.85}
        >
          {inCart ? <Text style={styles.editBtnTxt}>Edit</Text> : <Plus size={28} color="#FFF" />}
        </TouchableOpacity>
      )}
    </View>
  );
}

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

// ... (other components)

export default function CategoryProductsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialCategory = route.params?.category || 'All';
  const initialProducts = route.params?.products || [];
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const { totalItems } = useCart();
  const { token } = useAuth();
  
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  // Cart animation scale
  const cartScale = useSharedValue(1);

  // Trigger jump when totalItems changes
  useEffect(() => {
    if (totalItems > 0) {
      cartScale.value = withSequence(
        withSpring(1.4, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }
  }, [totalItems]);

  const cartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }]
  }));

  useEffect(() => {
    if (initialProducts.length > 0) return;
    
    const loadProducts = async () => {
      if (!token) return;
      setLoading(true);
      const data = await fetchProducts(token, 1);
      if (data && data.results) {
        const mapped = data.results.map(p => ({
          id: p.code,
          name: p.name,
          category: p.product,
          brand: p.brand,
          company: p.company,
          weight: '1 Unit',
          price: '0.00',
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400',
        }));
        setProducts(mapped);
      }
      setLoading(false);
    };

    loadProducts();
  }, [token]);

  // Extract unique categories
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // If initialCategory is not in the list, set back to 'All'
  useEffect(() => {
    if (products.length > 0 && activeCategory !== 'All' && !categories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [products]);

  const data = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  const filtered = data.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gradient Header */}
      <View
        style={[styles.header, { backgroundColor: '#8E24AA' }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Products</Text>
        
        <Animated.View style={cartAnimStyle}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Cart')}>
            <ShoppingCart size={22} color="#FFF" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeTxt}>{totalItems > 99 ? '99+' : totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
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

      {/* Category Filter Chips */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product list */}
      {loading ? (
        <ActivityIndicator size="large" color="#8E24AA" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ItemRow item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No products found</Text>
          }
        />
      )}
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
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#FF4D4D', width: 16, height: 16,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },
  cartBadgeTxt: { color: '#FFF', fontSize: 8, fontWeight: '900' },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginTop: 14, marginBottom: 10,
    backgroundColor: '#FFF', borderRadius: 14,
    paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: '#EEE',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },

  // Filters
  filterWrap: { marginBottom: 14 },
  filterScroll: { paddingHorizontal: 14, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#FFF', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#EEE',
  },
  filterChipActive: { backgroundColor: '#8E24AA', borderColor: '#8E24AA' },
  filterText: { fontSize: 13, fontWeight: '700', color: '#888' },
  filterTextActive: { color: '#FFF' },

  // List
  list: { paddingHorizontal: 14, paddingBottom: 40 },

  // Card
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
    backgroundColor: '#F8F4FF',
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
    gap: 3,
  },
  categoryLabel: { fontSize: 9, fontWeight: '900', color: '#27AE60', letterSpacing: 1 },
  itemName: { fontSize: 14, fontWeight: '800', color: '#1A2A3A', lineHeight: 20 },
  itemWeight: { fontSize: 11, color: '#AAA', fontWeight: '600' },

  // + button (default right side)
  plusBtn: {
    width: 85,
    backgroundColor: '#8E24AA',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  plusBtnInCart: {
    backgroundColor: '#8E24AA',
  },
  editBtnTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Inline input panel (replaces + button on tap)
  inputPanel: {
    width: 160,
    backgroundColor: '#FAFAFA',
    borderLeftWidth: 1,
    borderLeftColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },

  // Unit chips
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
    width: '100%', height: 48,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#EEE',
    borderRadius: 10, textAlign: 'center',
    fontSize: 18, fontWeight: '900', color: '#1A2A3A',
  },

  // Remarks input
  remarksInput: {
    width: '100%', height: 38,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE',
    borderRadius: 8, textAlign: 'center',
    fontSize: 12, color: '#333',
  },

  // Cancel / Add buttons
  actionRow: { flexDirection: 'row', gap: 6, width: '100%' },
  cancelBtn: {
    flex: 1, height: 40, borderRadius: 8,
    backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
  },
  addBtn: {
    flex: 2, height: 40, borderRadius: 8,
    backgroundColor: '#8E24AA', justifyContent: 'center', alignItems: 'center',
  },
  addBtnTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' }
});
