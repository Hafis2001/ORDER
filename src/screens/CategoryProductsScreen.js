import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  TouchableOpacity, TextInput, Alert, ScrollView,
  ActivityIndicator, Image, Modal, KeyboardAvoidingView,
  Platform, Dimensions, PanResponder, InteractionManager, Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  Extrapolate
} from 'react-native-reanimated';

import { ChevronLeft, ShoppingCart, Search, Plus, X, ChevronDown } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { fetchAllProducts } from '../api/products';

const { width } = Dimensions.get('window');
const GRID_SPACING = 14;
const CARD_WIDTH = (width - (GRID_SPACING * 3)) / 2;

const ItemRow = React.memo(function ItemRow({ item, onPress }) {
  const { setItemQty, getItemQty, isProductInCart, getProductTotalQty, cartItems, globalUnits = [] } = useCart();
  const [inputOpen, setInputOpen] = useState(false);
  const [unit, setUnit] = useState(item.unit || (globalUnits?.length > 0 ? globalUnits[0] : ''));
  
  const uniqueUnits = useMemo(() => {
    return [...new Set(item.unit ? [item.unit, ...(globalUnits || [])] : (globalUnits || []))];
  }, [item.unit, globalUnits]);
  const [modalVisible, setModalVisible] = useState(false);
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
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(230,81,0,0.2)',
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
    zIndex: 10,
  }));

  const isOutOfStock = item.isInStock === false;

  return (
    <View style={[styles.card, inCart && styles.cardInCart, inputOpen && styles.cardInputOpen]}>
      {/* Tappable area: image */}
      <TouchableOpacity  activeOpacity={0.7}
        style={{ flex: 1, width: '100%', backgroundColor: '#FFF' }}
        onPress={onPress}
        
      >
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        {/* Animated Ghost / Pulse */}
        <Animated.View style={successAnimStyle} pointerEvents="none" />

        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <View style={[styles.cardImage, styles.outOfStockOverlay, { position: 'absolute', top: 0, left: 0 }]}>
            <Text style={styles.outOfStockOverlayText}>OUT OF{`\n`}STOCK</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Info & Button Row */}
      <View style={styles.cardBody}>
        <TouchableOpacity  activeOpacity={0.7} style={{ flex: 1 }} onPress={onPress}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>

        {isOutOfStock ? (
          <View style={styles.outOfStockBtnGrid}>
            <Text style={styles.outOfStockBtnText}>N/A</Text>
          </View>
        ) : (
            <TouchableOpacity 
              style={[styles.plusBtnGrid, inCart && styles.plusBtnInCartGrid]} 
              onPress={openInput} 
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
               activeOpacity={0.7}
            >
              {inCart ? (
                <Text style={styles.inCartQtyTxt}>{parseFloat(Number(totalQtyInCart || 0).toFixed(3))}</Text>
              ) : (
                <Plus pointerEvents="none" size={20} color="#8E24AA" />
              )}
            </TouchableOpacity>
        )}
      </View>

      {/* Add Item Modal */}
      <Modal visible={inputOpen} transparent={true} animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.addItemModalContent}>
            {/* Close Button */}
            <TouchableOpacity 
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 }} 
              onPress={closeInput}
              activeOpacity={0.7}
              
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <X pointerEvents="none" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.addItemModalTitle}>Add {item.name}</Text>
            
            {/* Unit Dropdown */}
            <TouchableOpacity  activeOpacity={0.7} 
              style={styles.unitDropdownBtnGrid} 
              onPress={() => {
                Keyboard.dismiss();
                setModalVisible(true);
              }}
              activeOpacity={0.7}
              
            >
              <Text style={styles.unitDropdownTxt}>Unit: {unit}</Text>
              <ChevronDown pointerEvents="none" size={14} color="#8E24AA" />
            </TouchableOpacity>

            {/* Quantity input */}
            <TextInput
              ref={inputRef}
              style={styles.qtyInputGrid}
              value={qty}
              onChangeText={v => setQty(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="Enter Quantity"
              placeholderTextColor="#CCC"
              maxLength={6}
            />

            {/* Remarks input */}
            <TextInput
              style={styles.remarksInputGrid}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Remarks (optional)"
              placeholderTextColor="#CCC"
              maxLength={30}
            />

            {/* Cancel + Add */}
            <View style={styles.actionRowGrid}>
              <TouchableOpacity 
                style={styles.cancelBtnGrid} 
                onPress={closeInput}
                activeOpacity={0.7}
                
              >
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addBtnGrid} 
                onPress={handleAdd}
                activeOpacity={0.7}
                
              >
                <Text style={styles.addBtnTxt}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Unit Selection Overlay - Now inside the same Modal to fix iOS restriction */}
          {modalVisible && (
            <TouchableOpacity 
              activeOpacity={1} 
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]} 
              onPress={() => setModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 }} 
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <X pointerEvents="none" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Unit</Text>
                {uniqueUnits.map(u => (
                  <TouchableOpacity  activeOpacity={0.7} 
                    key={u} 
                    style={styles.unitOption} 
                    onPress={() => {
                      setUnit(u);
                      const existingQty = getItemQty(item.id, u.toLowerCase());
                      setQty(existingQty > 0 ? String(existingQty) : '');
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[styles.unitOptionText, unit === u && styles.unitOptionTextSelected]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);

export default function CategoryProductsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialCategory = route.params?.category || 'All';
  const initialProducts = route.params?.products || [];
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [listCategory, setListCategory] = useState(initialCategory);
  
  const { productCount } = useCart();
  const { token } = useAuth();
  
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsTransitioning(false);
    });
  }, []);

  // Cart animation scale
  const cartScale = useSharedValue(1);

  // Trigger jump when totalItems changes
  useEffect(() => {
    if (productCount > 0) {
      cartScale.value = withSequence(
        withSpring(1.4, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }
  }, [productCount]);

  const cartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }]
  }));

  useEffect(() => {
    if (initialProducts.length > 0) return;
    
    const loadProducts = async () => {
      if (!token) return;
      setLoading(true);
      const results = await fetchAllProducts(token);
      if (results && results.length > 0) {
        const mapped = results.map(p => {
          let imageUrl = p.product_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400';
          const cat = (p.department_name || '').toUpperCase();
          const name = (p.name || '').toUpperCase();
          
          if (!p.product_image) {
            if (cat.includes('VEGETABLE') || name.includes('VEG')) {
              imageUrl = 'https://images.unsplash.com/photo-1566385101042-1a000c1268c4?q=80&w=400';
            } else if (cat.includes('FRUIT') || name.includes('FRUIT')) {
              imageUrl = 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=400';
            }
          }
          
          return {
            id: p.code,
            name: p.name,
            category: p.department_name,
            brand: p.brand,
            company: p.company,
            weight: '1 Unit',
            price: '0.00',
            image: imageUrl,
            isInStock: p.is_in_stock,
            unit: p.unit,
          };
        });
        
        mapped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setProducts(mapped);
      }
      setLoading(false);
    };

    loadProducts();
  }, [token]);

  // Extract unique categories and units
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const allUnits = [...new Set(products.map(p => p.unit).filter(Boolean))];

  // If initialCategory is not in the list, set back to 'All'
  useEffect(() => {
    if (products.length > 0 && activeCategory !== 'All' && !categories.includes(activeCategory)) {
      setActiveCategory('All');
      setListCategory('All');
    }
  }, [products]);

  const handleCategoryChange = useCallback((cat) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat); // instantly update the UI tab
    // defer the heavy list filtering to next tick
    setTimeout(() => {
      setListCategory(cat);
    }, 10);
  }, [activeCategory]);

  // PanResponder removed to fix iOS tap interference

  const data = listCategory === 'All'
    ? products
    : products.filter(p => p.category === listCategory);

  const filtered = data.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = useCallback(({ item }) => (
    <ItemRow item={item} onPress={() => navigation.navigate('ItemDetail', { item })} />
  ), [navigation]);

  const keyExtractor = useCallback(item => item.id.toString(), []);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gradient Header */}
      <View
        style={[styles.header, { backgroundColor: '#8E24AA' }]}
      >
        <TouchableOpacity  activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ChevronLeft pointerEvents="none" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Products</Text>
        
        <Animated.View style={cartAnimStyle}>
          <TouchableOpacity  activeOpacity={0.7} style={styles.headerBtn} onPress={() => navigation.navigate('Cart')}>
            <ShoppingCart pointerEvents="none" size={22} color="#FFF" />
            {productCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeTxt}>{productCount > 99 ? '99+' : productCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search pointerEvents="none" size={16} color="#AAA" />
        <TextInput
          placeholder="Search products..."
          placeholderTextColor="#BBB"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterWrap}>
        <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map(cat => (
            <TouchableOpacity  activeOpacity={0.7}
              key={cat}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive, { marginRight: 20 }]}
              onPress={() => handleCategoryChange(cat)}
              activeOpacity={0.7}
              
            >
              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product list */}
      {loading || isTransitioning ? (
        <ActivityIndicator size="large" color="#8E24AA" style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true}
          key="2-col-grid" // Add key to force re-render when changing numColumns if ever needed
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          // iOS: automatically scroll content above keyboard — far more reliable than KeyboardAvoidingView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No products found</Text>
          }
          ListFooterComponent={<View style={{ height: insets.bottom + 120 }} />}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
        </View>
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
  filterWrap: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterScroll: { paddingHorizontal: 14 },
  filterChip: {
    paddingHorizontal: 4, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  filterChipActive: { borderBottomColor: '#1A2A3A' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#999' },
  filterTextActive: { color: '#1A2A3A', fontWeight: '800' },

  // List
  list: { paddingHorizontal: GRID_SPACING, paddingBottom: 140 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: GRID_SPACING },

  // Card
  card: {
    width: CARD_WIDTH,
    flexDirection: 'column',
    backgroundColor: '#F7F7F7', // Match screenshot background for cards
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    height: 165, // Fixed height to standardize
  },
  cardInputOpen: {
    height: 'auto',
  },
  cardInCart: {
    borderColor: '#8E24AA',
    backgroundColor: '#F8F4FF',
  },
  cardImage: { 
    width: '100%', 
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    gap: 8,
  },
  itemName: { fontSize: 12, fontWeight: '700', color: '#1A2A3A', lineHeight: 16 },
  itemPrice: { fontSize: 12, fontWeight: '800', color: '#333' },

  // Plus Button inline
  plusBtnGrid: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plusBtnInCartGrid: {
    backgroundColor: '#8E24AA',
    borderColor: '#8E24AA',
  },
  inCartQtyTxt: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  outOfStockBtnGrid: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Out of Stock styles
  outOfStockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  outOfStockOverlayText: {
    color: '#FFF', fontSize: 10, fontWeight: '900',
    textAlign: 'center', letterSpacing: 0.5,
  },

  // Add Item Modal
  addItemModalContent: {
    width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 24, elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
    gap: 16,
  },
  addItemModalTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A2A3A', textAlign: 'center', marginBottom: 4,
  },
  unitDropdownBtnGrid: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#F8F4FF', borderWidth: 1, borderColor: '#8E24AA',
  },
  unitDropdownTxt: { fontSize: 14, fontWeight: '800', color: '#8E24AA' },
  
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '80%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
    zIndex: 100,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 15, textAlign: 'center',
  },
  unitOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  unitOptionText: { fontSize: 16, color: '#555', textAlign: 'center' },
  unitOptionTextSelected: { color: '#8E24AA', fontWeight: '800' },

  qtyInputGrid: {
    width: '100%', height: 48,
    backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE',
    borderRadius: 10, textAlign: 'center',
    fontSize: 18, fontWeight: '800', color: '#1A2A3A',
  },
  remarksInputGrid: {
    width: '100%', height: 48,
    backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE',
    borderRadius: 10, paddingHorizontal: 16,
    fontSize: 14, color: '#333',
  },
  actionRowGrid: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  cancelBtnGrid: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnTxt: { color: '#666', fontSize: 14, fontWeight: '700' },
  addBtnGrid: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: '#8E24AA', justifyContent: 'center', alignItems: 'center',
  },
  addBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});
