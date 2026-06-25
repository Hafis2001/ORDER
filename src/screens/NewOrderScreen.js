import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Dimensions, TextInput, FlatList, Animated as RNAnimated,
  ActivityIndicator, Alert, Image, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';

import { Search, ShoppingCart, User, Filter, X } from 'lucide-react-native';
import ReAnimated, {
  useSharedValue, useAnimatedStyle, interpolate,
} from 'react-native-reanimated';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { fetchAllProducts } from '../api/products';

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
      
      <TouchableOpacity delayPressIn={0} activeOpacity={0.7} style={styles.slideCTA} onPress={() => navigation.navigate('CategoryProducts', { category: banner.cat || 'All' })} activeOpacity={0.7} delayPressIn={0}>
        <Text style={styles.slideCTAText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => prevProps.banner.id === nextProps.banner.id && prevProps.index === nextProps.index);

const ProductCard = React.memo(function ProductCard({ item, onPress }) {
  const isOutOfStock = item.isInStock === false;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} delayPressIn={0} style={styles.cardTouch}>
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
  categories, categoryCards, banners, loading, navigation, products
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
            <TouchableOpacity delayPressIn={0} activeOpacity={0.7} style={styles.cartBtn} onPress={() => navigation.navigate('Cart')} activeOpacity={0.7} delayPressIn={0}>
              <ShoppingCart size={18} color="#8E24AA" />
              {productCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{productCount > 99 ? '99+' : productCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity delayPressIn={0} activeOpacity={0.7} style={styles.logoutBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7} delayPressIn={0}>
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
            <TouchableOpacity delayPressIn={0} activeOpacity={0.7} onPress={() => setShowFilters(!showFilters)} style={styles.filterIconBtn} activeOpacity={0.7} delayPressIn={0}>
              {showFilters ? <X size={18} color="#AAA" /> : <Filter size={18} color="#8E24AA" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filters */}
        {showFilters && (
          <View style={styles.filterWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {categories.map(cat => (
                <TouchableOpacity delayPressIn={0} activeOpacity={0.7}
                  key={cat}
                  style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.7}
                  delayPressIn={0}
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

      {/* Category Horizontal Section */}
      <View style={styles.categorySection}>
        <Text style={[styles.secTitle, { paddingHorizontal: 16, marginBottom: 10 }]}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categoryCards?.map(cat => (
            <TouchableOpacity delayPressIn={0} activeOpacity={0.7}
              key={cat.name}
              style={styles.categoryCardRow}
              
              onPress={() => navigation.navigate('CategoryProducts', { category: cat.name, products })}
            >
              <Image source={{ uri: cat.image }} style={styles.categoryCardImgRow} resizeMode="cover" />
              <View style={styles.categoryCardOverlayRow}>
                <Text style={styles.categoryCardTextRow} numberOfLines={2}>{cat.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Title Section */}
      <View style={styles.secRow}>
        <Text style={styles.secTitle}>Latest Purchases</Text>
        <TouchableOpacity delayPressIn={0} activeOpacity={0.7} onPress={() => navigation.navigate('CategoryProducts', { category: 'All', products })} activeOpacity={0.7} delayPressIn={0}>
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
  const [latestPurchases, setLatestPurchases] = useState([]);
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

        // Fetch Products — all pages
        const results = await fetchAllProducts(token);
        if (results && results.length > 0) {
          const mapped = results.map(p => ({
            id: p.code,
            name: p.name,
            category: p.department_name,
            brand: p.brand,
            company: p.company,
            weight: '1 Unit',
            price: '0.00',
            image: p.product_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400',
            isInStock: p.is_in_stock,
          }));
          
          mapped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setProducts(mapped);
          
          // Fetch Orders to get latest purchases
          let purchasedNames = [];
          try {
            const ordersRes = await fetch('https://gold.imcbs.com/api/orders/my/', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              // Customer filtering is handled implicitly by the API / sorting
              ordersData.forEach(order => {
                (order.items || []).forEach(item => {
                  if (item.product_name) purchasedNames.push(item.product_name);
                });
              });
            }
          } catch(e) {
            console.error("Error fetching orders for home:", e);
          }

          const uniquePurchased = [...new Set(purchasedNames)];
          const recentProducts = mapped.filter(p => uniquePurchased.includes(p.name)).slice(0, 10);
          
          // If no history, fallback to first 10 products
          setLatestPurchases(recentProducts.length > 0 ? recentProducts : mapped.slice(0, 10));
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const getCategoryImage = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('fruit') || name.includes('veg')) return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=400';
    if (name.includes('meat') || name.includes('beef') || name.includes('chicken')) return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=400';
    if (name.includes('fish') || name.includes('seafood')) return 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400';
    if (name.includes('dairy') || name.includes('milk') || name.includes('cheese')) return 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=400';
    if (name.includes('bakery') || name.includes('bread')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400';
    if (name.includes('drink') || name.includes('beverage') || name.includes('water')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400';
    if (name.includes('snack') || name.includes('chip') || name.includes('biscuit')) return 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=400';
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400'; // Default mixed groceries
  };

  const categories = useMemo(
    () => ['All', ...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  );

  const categoryCards = useMemo(() => {
    const cats = [];
    const seen = new Set();
    products.forEach(p => {
      if (p.category && !seen.has(p.category)) {
        seen.add(p.category);
        cats.push({ name: p.category, image: getCategoryImage(p.category) });
      }
    });
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    // If the user searches or uses a category filter, search ALL products.
    // Otherwise, show only the Latest Purchases (max 10).
    if (searchQuery || activeCategory !== 'All') {
      return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
      });
    }
    return latestPurchases;
  }, [products, latestPurchases, searchQuery, activeCategory]);

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
      categoryCards={categoryCards}
      banners={banners}
      loading={loading}
      navigation={navigation}
      products={products}
    />
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      <FlatList initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true}
        ref={flatListRef}
        data={filteredProducts}
        numColumns={2}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        // iOS: automatically scroll content above keyboard when searching
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        ListFooterComponent={<View style={{ height: insets.bottom + 140 }} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
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
  
  categorySection: { marginTop: 18 },
  categoryScroll: { paddingHorizontal: 16, gap: 12 },
  categoryCardRow: { width: 105, height: 105, borderRadius: 16, overflow: 'hidden', backgroundColor: '#EEE' },
  categoryCardImgRow: { width: '100%', height: '100%' },
  categoryCardOverlayRow: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6, paddingHorizontal: 4 },
  categoryCardTextRow: { color: '#FFF', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  
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
