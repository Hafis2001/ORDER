import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Dimensions, TextInput, FlatList, Animated as RNAnimated,
  ActivityIndicator, Alert, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';

import { Search, ShoppingCart, User, Filter, X } from 'lucide-react-native';
import ReAnimated, {
  useSharedValue, useAnimatedStyle, interpolate,
} from 'react-native-reanimated';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { fetchProducts } from '../api/products';

const { width } = Dimensions.get('window');
const GRID_SPACING = 12;
const GRID_ITEM_WIDTH = (width - 32 - GRID_SPACING) / 2;

// Fallback BANNERS for visual appeal
const BANNERS = [
  { key: 'bev', label: 'Refreshments', sub: 'Cool & refreshing drinks', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=400', cat: 'SOFT DRINKS' },
  { key: 'snack', label: 'Snacks & More', sub: 'Daily essentials', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=400', cat: 'SNACKS' },
];

const BANNER_API_URL = 'https://gold.imcbs.com/api/banners/';
const BANNER_IMAGE_BASE_URL = 'https://gold.imcbs.com';

const SLIDE_WIDTH = width - 32;

function BannerSlider({ banners, navigation }) {
  const scrollRef = useRef(null);
  const curIdx = useRef(0);
  const slides = banners && banners.length > 0 ? banners : BANNERS;
  const { token } = useAuth();
  
  const [dotAnims, setDotAnims] = useState([]);

  useEffect(() => {
    const anims = slides.map((_, i) => new RNAnimated.Value(i === 0 ? 1 : 0));
    setDotAnims(anims);
    curIdx.current = 0;
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || dotAnims.length === 0) return;
    const timer = setInterval(() => {
      const next = (curIdx.current + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true });
      
      if (dotAnims[curIdx.current] && dotAnims[next]) {
        RNAnimated.timing(dotAnims[curIdx.current], { toValue: 0, duration: 250, useNativeDriver: false }).start();
        RNAnimated.timing(dotAnims[next], { toValue: 1, duration: 250, useNativeDriver: false }).start();
      }
      curIdx.current = next;
    }, 2800);
    return () => clearInterval(timer);
  }, [slides, dotAnims]);

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
        {slides.map((b, index) => (
          <BannerItem key={b.key || b.id || index} banner={b} index={index} token={token} navigation={navigation} />
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <RNAnimated.View key={i} style={[styles.dot, {
            width: dotAnims[i]?.interpolate({ inputRange: [0, 1], outputRange: [6, 18] }) || 6,
            backgroundColor: dotAnims[i]?.interpolate({ inputRange: [0, 1], outputRange: ['#CCC', '#8E24AA'] }) || '#CCC',
          }]} />
        ))}
      </View>
    </View>
  );
}

// Placeholder colors cycling for each slide
const SLIDE_BG_COLORS = ['#8E24AA', '#D81B60', '#1565C0', '#2E7D32', '#E65100'];

const BannerItem = React.memo(function BannerItem({ banner, token, navigation, index }) {
  const [error, setError] = useState(false);
  const uri = banner.image || banner.image_url || null;
  const bgColor = SLIDE_BG_COLORS[index % SLIDE_BG_COLORS.length];
  const showImage = uri && !error;
  
  return (
    <View style={[styles.slide, { backgroundColor: bgColor }]}>
      {showImage ? (
        <Image 
          source={{ 
            uri,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }} 
          style={styles.slideImg}
          resizeMode="cover"
          onError={() => setError(true)}
        />
      ) : (
        <View style={styles.slideImgPlaceholder}>
          <Text style={styles.slideImgPlaceholderIcon}>🛍️</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.slideCTA} onPress={() => navigation.navigate('CategoryProducts', { category: banner.cat || 'All' })}>
        <Text style={styles.slideCTAText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => prevProps.banner.id === nextProps.banner.id && prevProps.index === nextProps.index);

const ProductCard = React.memo(function ProductCard({ item, onPress }) {
  const isOutOfStock = item.isInStock === false;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.cardTouch}>
        <View style={styles.imgContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.cardImg}
            resizeMode="cover"
          />
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockOverlayText}>OUT OF{`\n`}STOCK</Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);

const HeaderInteractive = React.memo(function HeaderInteractive({
  insets, user, productCount, searchQuery, setSearchQuery,
  showFilters, setShowFilters, activeCategory, setActiveCategory,
  categories, banners, loading, navigation, products
}) {
  return (
    <View>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#8E24AA' }]}>
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
              {productCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{productCount > 99 ? '99+' : productCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.navigate('Profile')}>
              <User size={20} color="#FFF" />
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
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterIconBtn}>
              {showFilters ? <X size={18} color="#AAA" /> : <Filter size={18} color="#8E24AA" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filters */}
        {showFilters && (
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
        )}
      </View>

      {/* Banner Slider */}
      <View style={styles.sliderWrap}>
        <BannerSlider banners={banners} navigation={navigation} />
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
  );
});

export default function NewOrderScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { productCount } = useCart();
  const { token, user, logout } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const flatListRef = useRef(null);
  useScrollToTop(flatListRef);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      setLoading(true);

      try {
        // Fetch Banners
        const bannerRes = await fetch(BANNER_API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (bannerRes.ok) {
          const bannerData = await bannerRes.json();
          const mappedBanners = (Array.isArray(bannerData) ? bannerData : bannerData.results || [])
            .filter(b => b.is_active !== false)
            .map(b => ({
              id: b.id,
              label: b.title,
              sub: b.subtitle,
              image: b.image_url?.startsWith('http') ? b.image_url : `${BANNER_IMAGE_BASE_URL}${b.image_url}`,
              cat: 'All'
            }));
          setBanners(mappedBanners);
        }

        // Fetch Products
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
            image: p.product_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400',
            isInStock: p.is_in_stock,
          }));
          
          mapped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setProducts(mapped);
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const categories = useMemo(
    () => ['All', ...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  }), [products, searchQuery, activeCategory]);

  const renderItem = useCallback(({ item }) => (
    <ProductCard
      item={item}
      onPress={() => navigation.navigate('ItemDetail', { item })}
    />
  ), [navigation]);

  const ListHeader = (
    <HeaderInteractive
      insets={insets}
      user={user}
      productCount={productCount}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      categories={categories}
      banners={banners}
      loading={loading}
      navigation={navigation}
      products={products}
    />
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={filteredProducts}
        numColumns={2}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        ListFooterComponent={<View style={{ height: insets.bottom + 100 }} />}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={true}
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
  filterIconBtn: { padding: 4 },
  filterWrap: { marginTop: 12, marginBottom: 4 },
  filterScroll: { paddingHorizontal: 4, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  filterChipActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  filterTextActive: { color: '#8E24AA' },
  cartBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF6B6B', width: 15, height: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 7, fontWeight: 'bold' },
  listContent: { paddingBottom: 0 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sliderWrap: { paddingHorizontal: 16, marginTop: 14 },
  slide: { width: SLIDE_WIDTH, height: 160, borderRadius: 18, overflow: 'hidden' },
  slideText: { flex: 1 },
  slideLabel: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  slideSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  slideCTA: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  slideCTAText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  slideImg: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  slideImgPlaceholder: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  slideImgPlaceholderIcon: { fontSize: 36 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 7, gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 14, marginBottom: 8 },
  secTitle: { fontSize: 14, fontWeight: '900', color: '#1A2A3A', letterSpacing: 0.5 },
  card: { width: GRID_ITEM_WIDTH, height: 160, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardTouch: { width: '100%', height: '100%' },
  imgContainer: { width: '100%', flex: 1, backgroundColor: '#F8F9FA' },
  cardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  badgeTag: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  badgeTagText: { fontSize: 8, fontWeight: '800', color: '#333' },
  cardContent: { padding: 8, alignItems: 'center' },
  cardName: { fontSize: 11, fontWeight: '800', color: '#1A2A3A', textAlign: 'center', width: '100%' },
  
  // Out of Stock styles
  outOfStockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  outOfStockOverlayText: {
    color: '#FFF', fontSize: 9, fontWeight: '900',
    textAlign: 'center', letterSpacing: 0.5,
  },
  outOfStockBadge: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginTop: 4,
  },
  outOfStockBadgeText: { fontSize: 9, fontWeight: '800', color: '#E74C3C' },
  cardWeight: { fontSize: 9, color: '#999', marginTop: 1, fontWeight: '600' },
  cardAction: { paddingBottom: 10, alignItems: 'center', paddingHorizontal: 10 },
  premiumAdd: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#8E24AA', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, gap: 4 },
  addTxt: { fontSize: 11, fontWeight: '800', color: '#8E24AA' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8E24AA', borderRadius: 16, paddingHorizontal: 4, height: 28, gap: 8 },
  qtyBtn: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 12, fontWeight: '900', color: '#FFF', minWidth: 16, textAlign: 'center' },
});
