import React, { useRef, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Animated,
  Easing,
  Alert,
  TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeft, Trash2, Plus, Minus, ShoppingBag, ClipboardCheck } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// --- Animated Components ---

function CartQtyInput({ item }) {
  const { updateItemQty, addToCart, removeFromCart } = useCart();
  const [localQty, setLocalQty] = useState(String(item.qty));

  // Sync if external changes happen
  useEffect(() => {
    setLocalQty(String(item.qty));
  }, [item.qty]);

  const handleEndEditing = () => {
    const val = localQty.trim();
    const parsed = parseFloat(val);
    if (val === '' || isNaN(parsed) || parsed <= 0) {
      // Revert or remove
      setLocalQty(String(item.qty));
    } else {
      // Pass the raw string val to preserve trailing zeros if any
      updateItemQty(item.id, item.unit, val);
    }
  };

  return (
    <View style={styles.quantityContainer}>
      <TouchableOpacity style={styles.qtyButton} onPress={() => removeFromCart(item.id, item.unit)}>
        <Minus size={16} color="#8E24AA" />
      </TouchableOpacity>
      <TextInput 
        style={styles.qtyTextInput}
        value={localQty}
        onChangeText={v => setLocalQty(v.replace(/[^0-9.]/g, ''))}
        onEndEditing={handleEndEditing}
        keyboardType="decimal-pad"
        maxLength={5}
        selectTextOnFocus
      />
      <TouchableOpacity style={styles.qtyButton} onPress={() => addToCart(item, item.unit, 1)}>
        <Plus size={16} color="#8E24AA" />
      </TouchableOpacity>
    </View>
  );
}

function TruckShape({ lightOpacity, doorTop, doorBottom }) {
  return (
    <View style={{ width: 100, height: 40 }}>
      {/* Cargo box body */}
      <View style={{ position: 'absolute', left: 0, top: 4, width: 62, height: 32, backgroundColor: '#F8F9FA', borderRadius: 3 }} />
      {/* Top shadow strip */}
      <View style={{ position: 'absolute', left: 0, top: 4, width: 62, height: 3, backgroundColor: 'rgba(0,0,0,0.05)', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
      {/* Bottom shadow strip */}
      <View style={{ position: 'absolute', left: 0, top: 33, width: 62, height: 3, backgroundColor: 'rgba(0,0,0,0.05)', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />

      {/* Door top half â€” slides UP on open */}
      <Animated.View style={{
        position: 'absolute', left: 0, top: 4,
        width: 14, height: 16,
        backgroundColor: '#E0E0E0', borderTopLeftRadius: 3,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
        transform: [{ translateY: doorTop }], zIndex: 2,
      }} />
      {/* Door bottom half â€” slides DOWN on open */}
      <Animated.View style={{
        position: 'absolute', left: 0, top: 20,
        width: 14, height: 16,
        backgroundColor: '#E0E0E0', borderBottomLeftRadius: 3,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
        transform: [{ translateY: doorBottom }], zIndex: 2,
      }} />
      {/* Door center seam */}
      <View style={{ position: 'absolute', left: 0, top: 19, width: 14, height: 2, backgroundColor: '#8E24AA', zIndex: 3 }} />

      {/* Cab */}
      <View style={{ position: 'absolute', left: 62, top: 6, width: 26, height: 28, backgroundColor: '#8E24AA', borderTopRightRadius: 8, borderBottomRightRadius: 8 }} />
      {/* Windshield */}
      <View style={{ position: 'absolute', left: 76, top: 8, width: 12, height: 24, backgroundColor: '#1A1A1A', borderTopRightRadius: 7, borderBottomRightRadius: 7, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 5, left: 2, width: 4, height: 14, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
      </View>
      {/* Cab-cargo divider */}
      <View style={{ position: 'absolute', left: 62, top: 6, width: 2, height: 28, backgroundColor: '#8E24AA' }} />

      {/* Headlights â€” animated opacity */}
      <Animated.View style={{ position: 'absolute', left: 92, top: 7,  width: 8, height: 5, backgroundColor: '#FFF59D', borderRadius: 2, opacity: lightOpacity }} />
      <Animated.View style={{ position: 'absolute', left: 92, top: 28, width: 8, height: 5, backgroundColor: '#FFF59D', borderRadius: 2, opacity: lightOpacity }} />

      {/* Wheels */}
      <View style={{ position: 'absolute', left: 8,  top: -1, width: 14, height: 6, backgroundColor: '#333', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 8,  top: 35, width: 14, height: 6, backgroundColor: '#333', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 66, top: -1, width: 12, height: 6, backgroundColor: '#333', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 66, top: 35, width: 12, height: 6, backgroundColor: '#333', borderRadius: 2 }} />
    </View>
  );
}

function TruckOrderButton({ onAnimationEnd }) {
  const [animating, setAnimating] = useState(false);
  const [done, setDone] = useState(false);

  // Animated values
  const truckX         = useRef(new Animated.Value(220)).current;   // truck starts off-screen right (hidden)
  const boxX           = useRef(new Animated.Value(0)).current;     // box starts at left edge
  const boxOpacity     = useRef(new Animated.Value(0)).current;
  const linesOpacity   = useRef(new Animated.Value(0)).current;
  const linesX         = useRef(new Animated.Value(0)).current;
  const defaultOpacity = useRef(new Animated.Value(1)).current;     // "Proceed to Checkout" label
  const successOpacity = useRef(new Animated.Value(0)).current;     // "Checkout âœ“" label
  const checkScale     = useRef(new Animated.Value(0)).current;
  const lightOpacity   = useRef(new Animated.Value(0)).current;
  const doorTop        = useRef(new Animated.Value(0)).current;
  const doorBottom     = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (animating || done) return;
    setAnimating(true);

    // Reset all values before starting
    truckX.setValue(-220);        // truck starts off-screen LEFT
    boxX.setValue(0);
    boxOpacity.setValue(0);
    linesX.setValue(0);
    linesOpacity.setValue(0);
    defaultOpacity.setValue(1);
    successOpacity.setValue(0);
    checkScale.setValue(0);
    lightOpacity.setValue(0);
    doorTop.setValue(0);
    doorBottom.setValue(0);

    Animated.sequence([
      // Step 1: Label fades out
      Animated.timing(defaultOpacity, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }),

      // Step 2: Truck drives in from left to center
      Animated.timing(truckX, {
        toValue: -10, duration: 700,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),

      // Step 3: Doors split open
      Animated.parallel([
        Animated.timing(doorTop,    { toValue: -12, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(doorBottom, { toValue:  12, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),

      // Step 4: Box slides into truck
      Animated.parallel([
        Animated.timing(boxOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(boxX, { toValue: 110, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),

      // Step 5: Box disappears, doors close, headlights on
      Animated.parallel([
        Animated.timing(boxOpacity,   { toValue: 0,   duration: 250, useNativeDriver: true }),
        Animated.timing(doorTop,      { toValue: 0,   duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(doorBottom,   { toValue: 0,   duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(lightOpacity, { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]),

      // Step 6: Truck drives off right with speed lines
      Animated.parallel([
        Animated.timing(linesOpacity, { toValue: 1,   duration: 150, useNativeDriver: true }),
        Animated.timing(truckX,       { toValue: 280, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(linesX,       { toValue: 200, duration: 900, easing: Easing.linear, useNativeDriver: true }),
      ]),

      // Step 7: Speed lines fade, success state appears
      Animated.parallel([
        Animated.timing(linesOpacity,   { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(checkScale,     { toValue: 1, friction: 5,   useNativeDriver: true }),
      ]),

    ]).start(() => {
      setDone(true);
      setAnimating(false);
      setTimeout(() => onAnimationEnd(), 700);
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={truckBtnStyles.btn}>
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#8E24AA' }]}
      />
      <View style={truckBtnStyles.inner}>
        {/* Speed lines (behind truck) */}
        <Animated.View style={[truckBtnStyles.line1, { opacity: linesOpacity, transform: [{ translateX: linesX }] }]} />
        <Animated.View style={[truckBtnStyles.line2, { opacity: linesOpacity, transform: [{ translateX: linesX }] }]} />
        <Animated.View style={[truckBtnStyles.line3, { opacity: linesOpacity, transform: [{ translateX: linesX }] }]} />

        {/* Cardboard box */}
        <Animated.View style={[truckBtnStyles.box, { opacity: boxOpacity, transform: [{ translateX: boxX }] }]}>
          <View style={truckBtnStyles.boxLineH} />
          <View style={truckBtnStyles.boxLineV} />
        </Animated.View>

        {/* Truck */}
        <Animated.View style={[truckBtnStyles.truckWrap, { transform: [{ translateX: truckX }] }]}>
          <TruckShape lightOpacity={lightOpacity} doorTop={doorTop} doorBottom={doorBottom} />
        </Animated.View>

        {/* Default label */}
        <Animated.Text style={[truckBtnStyles.label, { opacity: defaultOpacity }]}>
          PLACE ORDER
        </Animated.Text>

        {/* Success label */}
        <Animated.View style={[truckBtnStyles.successRow, { opacity: successOpacity }]}>
          <Text style={truckBtnStyles.successText}>Checkout  </Text>
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <MaterialIcons name="check-circle" size={20} color="#16BF78" />
          </Animated.View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const truckBtnStyles = StyleSheet.create({
  btn: {
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',           // clips truck/lines to button bounds
    elevation: 8,
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  successRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  truckWrap: { position: 'absolute', top: 12 },
  box: {
    position: 'absolute',
    left: -32,
    top: 20,
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#EDD9A9',
    borderWidth: 1,
    borderColor: '#DCB773',
  },
  boxLineH: {
    position: 'absolute', top: 10, left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(0,0,0,0.15)',
  },
  boxLineV: {
    position: 'absolute', left: 10, top: 0, bottom: 0,
    width: 1, backgroundColor: 'rgba(0,0,0,0.15)',
  },
  line1: { position: 'absolute', top: 22, right: 0,  width: 400, height: 2,   backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 },
  line2: { position: 'absolute', top: 30, right: 20, width: 360, height: 1.5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 },
  line3: { position: 'absolute', top: 38, right: 10, width: 380, height: 1,   backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
});

// --- Success Overlay ---

function SuccessOverlay({ onFinish, itemsDesc }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pop-in animation
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFFFFF', zIndex: 9999, opacity }]}>
      {/* Top Close Button */}
      <TouchableOpacity onPress={onFinish} style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
        <MaterialIcons name="close" size={28} color="#555" />
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -50 }}>
        {/* Animated Checkmark and Balloons */}
        <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
          
          {/* Faux Balloons (Decorations) */}
          <View style={{ position: 'absolute', top: -30, left: -40, width: 30, height: 40, borderRadius: 15, backgroundColor: '#8E24AA', opacity: 0.2, transform: [{ rotate: '-15deg' }] }} />
          <View style={{ position: 'absolute', top: 10, right: -40, width: 25, height: 35, borderRadius: 12, backgroundColor: '#8E24AA', opacity: 0.1, transform: [{ rotate: '15deg' }] }} />
          <View style={{ position: 'absolute', bottom: -10, right: -50, width: 35, height: 45, borderRadius: 17, backgroundColor: '#8E24AA', opacity: 0.15, transform: [{ rotate: '20deg' }] }} />
          <View style={{ position: 'absolute', top: 30, left: -50, width: 20, height: 20, borderRadius: 10, backgroundColor: '#8E24AA', opacity: 0.2 }} />
          <View style={{ position: 'absolute', top: -50, right: 10, width: 25, height: 25, borderRadius: 12, backgroundColor: '#8E24AA', opacity: 0.1 }} />
          
          {/* Main Checkmark Circle */}
          <View style={{
            width: 160, height: 160, borderRadius: 80, backgroundColor: '#F3E5F5', // Light purple outer ring
            justifyContent: 'center', alignItems: 'center',
          }}>
            <View style={{
              width: 130, height: 130, borderRadius: 65, backgroundColor: '#8E24AA', // Main primary color
              justifyContent: 'center', alignItems: 'center',
              shadowColor: '#8E24AA', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
            }}>
              <MaterialIcons name="check" size={80} color="#FFF" />
            </View>
          </View>
        </Animated.View>

        {/* Text Section */}
        <Animated.View style={{ alignItems: 'center', marginTop: 40, transform: [{ scale }] }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#8E24AA', marginBottom: 5 }}>
            Order Placed
          </Text>
          <Text style={{ fontSize: 18, color: '#8E24AA', fontWeight: '600', marginBottom: 20 }}>
            Sit back and Relax
          </Text>
          
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginHorizontal: 40, lineHeight: 22 }}>
            Your order ({itemsDesc || 'Fresh Groceries'}) has been confirmed successfully
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 25 }}>
            <View style={{ backgroundColor: '#333', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
              <MaterialIcons name="star" size={14} color="#FBBF24" />
            </View>
            <Text style={{ color: '#4B5563', fontSize: 14, fontWeight: '500' }}>
             
            </Text>
          </View>

          <TouchableOpacity onPress={onFinish} style={{ marginTop: 40 }}>
            <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>
              View order details <MaterialIcons name="chevron-right" size={16} />
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// --- Main Screen ---

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cartItems, addToCart, removeFromCart, deleteItem, clearCart, totalItems, totalPrice } = useCart();
  const { token } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    try {
      const payload = {
        items: cartItems.map(item => ({
          product_code: item.id,
          product_name: item.name,
          product_brand: item.brand || '',
          quantity: item.qty,
          unit: item.unit
        }))
      };

      const response = await fetch('https://gold.imcbs.com/api/orders/place-batch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('Failed to place order:', errText);
        throw new Error('Non-OK status');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'There was an issue placing your order. Please try again.');
      return;
    }

    setShowSuccess(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showSuccess && (
        <SuccessOverlay 
          onFinish={() => {
            clearCart();
            navigation.navigate('MainTabs', { screen: 'Orders' });
          }}
        />
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Review</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.orderStatusContainer}>
          <View style={styles.statusBadge}>
            <ClipboardCheck size={16} color="#8E24AA" />
            <Text style={styles.statusText}>READY TO PLACE</Text>
          </View>
          <Text style={styles.itemCountText}>{totalItems} Products Selected</Text>
        </View>

        {cartItems.length > 0 ? (
          cartItems.map(item => (
            <View key={item.cartKey} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.unitText}>{item.unit === 'kg' ? 'Kilogram (Kg)' : 'Box Pack'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteItem(item.cartKey)}>
                    <Trash2 size={18} color="#999" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.quantityRow}>
                  <CartQtyInput item={item} />
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCart}>
            <ShoppingBag size={80} color="#F0F0F0" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
          </View>
        )}

        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>Order Note</Text>
          <View style={styles.noteBox}>
            <Text style={styles.notePlaceholder}>Add special instructions for delivery...</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { bottom: insets.bottom + 20 }]}>
        {cartItems.length > 0 ? (
          <TruckOrderButton onAnimationEnd={handlePlaceOrder} />
        ) : (
          <TouchableOpacity style={styles.checkoutButton} onPress={handlePlaceOrder}>
            <View
              style={[styles.checkoutGradient, { backgroundColor: '#CCC' }]}
            >
              <Text style={styles.checkoutText}>CART EMPTY</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  orderStatusContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(214, 51, 132, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(214, 51, 132, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8E24AA',
    letterSpacing: 1,
  },
  itemCountText: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 15,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  unitText: {
    fontSize: 12,
    color: '#8E24AA',
    fontWeight: '600',
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  qtyButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  qtyTextInput: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#777',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#8E24AA',
  },
  noteContainer: {
    marginTop: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  noteBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    minHeight: 80,
  },
  notePlaceholder: {
    color: '#999',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  checkoutButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  checkoutGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 15,
  },
  checkoutText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
