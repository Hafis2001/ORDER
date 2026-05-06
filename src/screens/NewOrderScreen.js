import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Image, Dimensions, TextInput, FlatList, Animated as RNAnimated,
  ActivityIndicator, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Search, ShoppingCart, LogOut } from 'lucide-react-native';
import ReAnimated, {
  useSharedValue, useAnimatedStyle, interpolate,
} from 'react-native-reanimated';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { fetchProducts } from '../api/products';

const { width } = Dimensions.get('window');
const GRID_SPACING = 12;
const GRID_ITEM_WIDTH = (width - 32 - GRID_SPACING) / 2;

// Keep BANNERS for visual appeal
const BANNERS = [
  { key: 'bev', label: 'Refreshments', sub: 'Cool & refreshing drinks', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=400', cat: 'SOFT DRINKS' },
  { key: 'snack', label: 'Snacks & More', sub: 'Daily essentials', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=400', cat: 'SNACKS' },
];

const SLIDE_WIDTH = width - 32;

function BannerSlider({ navigation }) {
  const scrollRef = useRef(null);
  const curIdx = useRef(0);
  const dotAnims = useRef(BANNERS.map((_, i) => new RNAnimated.Value(i === 0 ? 1 : 0))).current;

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (curIdx.current + 1) % BANNERS.length;
      scrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true });
      RNAnimated.timing(dotAnims[curIdx.current], { toValue: 0, duration: 250, useNativeDriver: false }).start();
      RNAnimated.timing(dotAnims[next], { toValue: 1, duration: 250, useNativeDriver: false }).start();
      curIdx.current = next;
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        scrollEnabled
        snapToInterval={SLIDE_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        style={{ borderRadius: 18, overflow: 'hidden' }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
          if (idx !== curIdx.current) {
            RNAnimated.timing(dotAnims[curIdx.current], { toValue: 0, duration: 200, useNativeDriver: false }).start();
            RNAnimated.timing(dotAnims[idx], { toValue: 1, duration: 200, useNativeDriver: false }).start();
            curIdx.current = idx;
          }
        }}
      >
        {BANNERS.map((b) => (
          <View key={b.key} style={[styles.slide, { backgroundColor: '#8E24AA' }]}>
            <View style={styles.slideText}>
              <Text style={styles.slideLabel}>{b.label}</Text>
              <Text style={styles.slideSub}>{b.sub}</Text>
              <TouchableOpacity style={styles.slideCTA} onPress={() => navigation.navigate('CategoryProducts', { category: b.cat })}>
                <Text style={styles.slideCTAText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: b.image }} style={styles.slideImg} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {BANNERS.map((_, i) => (
          <RNAnimated.View key={i} style={[styles.dot, {
            width: dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [6, 18] }),
            backgroundColor: dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['#CCC', '#8E24AA'] }),
          }]} />
        ))}
      </View>
    </View>
  );
}

function ProductCard({ item, onPress }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.cardTouch}>
        <View style={styles.imgContainer}>
          <Image source={{ uri: item.image }} style={styles.cardImg} />
          <View style={styles.badgeTag}>
            <Text style={styles.badgeTagText}>{item.category || 'Product'}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardWeight}>{item.weight}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function NewOrderScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();
  const { token, user, logout } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      if (!token) return;
      setLoading(true);
      const data = await fetchProducts(token, 1);
      if (data && data.results) {
        // Map API response to local format
        const mapped = data.results.map(p => ({
          id: p.code,
          name: p.name,
          category: p.product,
          brand: p.brand,
          company: p.company,
          weight: '1 Unit', // Placeholder since API lacks weight
          price: '0.00',    // Placeholder since API lacks price
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400', // Generic placeholder
        }));
        setProducts(mapped);
      }
      setLoading(false);
    };

    loadProducts();
  }, [token]);

  return (
    <View style={styles.container}>
      <FlatList
        data={products.slice(0, 8)}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View>
            {/* Header â€“ taller, curvy, with logo */}
            <View
              style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#8E24AA' }]}
            >
              {/* Logo row */}
              <View style={styles.logoRow}>
                <Image
                  source={require('../../assets/image.jpeg')}
                  style={styles.logoImg}
                />
                <View style={styles.greetCol}>
                  <Text style={styles.greetHi}>Good day, {user?.name?.split(' ')[0] || 'User'}</Text>
                  <Text style={styles.greetSub}>What are you looking for today?</Text>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
                    <ShoppingCart size={18} color="#8E24AA" />
                    {totalItems > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                    Alert.alert(
                      "Logout",
                      "Are you sure you want to log out?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Logout", style: "destructive", onPress: () => {
                            logout();
                            navigation.replace('Login');
                          }
                        }
                      ]
                    );
                  }}>
                    <LogOut size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search row */}
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Search size={14} color="#AAA" />
                  <TextInput
                    placeholder="Search groceries"
                    placeholderTextColor="#BBB"
                    style={styles.searchInput}
                  />
                </View>
              </View>
            </View>

            {/* Banner Slider */}
            <View style={styles.sliderWrap}>
              <BannerSlider navigation={navigation} />
            </View>

            {/* Title Section */}
            <View style={styles.secRow}>
              <Text style={styles.secTitle}>Fresh Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { category: 'All', products })}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E24AA' }}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {loading && (
              <ActivityIndicator size="large" color="#8E24AA" style={{ marginTop: 20 }} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => navigation.navigate('CategoryProducts', { category: item.category || 'All', products })}
          />
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 12,
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    marginBottom: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  logoImg: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.6)', 
    backgroundColor: '#FFF' 
  },
  greetCol: { flex: 1 },
  greetHi: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  greetSub: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 22, paddingHorizontal: 12, height: 38 },
  searchInput: { flex: 1, marginLeft: 7, fontSize: 12, color: '#333' },
  cartBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF6B6B', width: 15, height: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 7, fontWeight: 'bold' },
  listContent: { paddingBottom: 20 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sliderWrap: { paddingHorizontal: 16, marginTop: 14 },
  slide: { width: SLIDE_WIDTH, height: 160, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, overflow: 'hidden' },
  slideText: { flex: 1 },
  slideLabel: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  slideSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  slideCTA: { marginTop: 9, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  slideCTAText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  slideImg: { width: 100, height: 100, resizeMode: 'cover', borderRadius: 12 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 7, gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 14, marginBottom: 8 },
  secTitle: { fontSize: 14, fontWeight: '900', color: '#1A2A3A', letterSpacing: 0.5 },
  card: { width: GRID_ITEM_WIDTH, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardTouch: { width: '100%' },
  imgContainer: { width: '100%', height: 90, backgroundColor: '#F8F9FA' },
  cardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  badgeTag: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  badgeTagText: { fontSize: 8, fontWeight: '800', color: '#333' },
  cardContent: { padding: 8, alignItems: 'center' },
  cardName: { fontSize: 11, fontWeight: '800', color: '#1A2A3A', textAlign: 'center', width: '100%' },
  cardWeight: { fontSize: 9, color: '#999', marginTop: 1, fontWeight: '600' },
  cardAction: { paddingBottom: 10, alignItems: 'center', paddingHorizontal: 10 },
  premiumAdd: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#8E24AA', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, gap: 4 },
  addTxt: { fontSize: 11, fontWeight: '800', color: '#8E24AA' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8E24AA', borderRadius: 16, paddingHorizontal: 4, height: 28, gap: 8 },
  qtyBtn: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 12, fontWeight: '900', color: '#FFF', minWidth: 16, textAlign: 'center' },
});
