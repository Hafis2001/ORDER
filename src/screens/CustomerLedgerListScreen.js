import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChevronRight, FileText, User } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LedgerCard = React.memo(function LedgerCard({ item, onPress }) {
  const customerCode = item.customer_code;
  const entries = item.entries || [];
  const customerName = entries.length > 0 ? entries[0].customer_name : `Customer ${customerCode}`;
  const latestBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;

  return (
    <TouchableOpacity delayPressIn={0} activeOpacity={0.7}
      
      style={styles.card}
      onPress={() => onPress(item, customerName)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <User size={24} color="#8E24AA" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.customerName} numberOfLines={1}>{customerName}</Text>
          <Text style={styles.customerCode}>Code: {customerCode}</Text>
        </View>
        <ChevronRight size={20} color="#999" />
      </View>
      
      <View style={styles.cardDivider} />
      
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <FileText size={16} color="#666" />
          <Text style={styles.footerText}>{entries.length} Entries</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={[styles.balanceValue, { color: latestBalance < 0 ? '#E53935' : '#43A047' }]}>
            ₹{Math.abs(latestBalance).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            {latestBalance < 0 ? ' Cr' : ' Dr'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function CustomerLedgerListScreen() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('https://gold.imcbs.com/api/ledger/my/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ledger');
      }

      const data = await response.json();
      
      // Handle both Array and Object responses
      let ledgerArray = Array.isArray(data) ? data : [data];
      
      if (ledgerArray.length > 0) {
        const item = ledgerArray[0];
        const customerCode = item.customer_code;
        const entries = item.entries || [];
        const customerName = entries.length > 0 ? entries[0].customer_name : `Customer ${customerCode}`;
        
        // Directly navigate to the detail view and replace this screen
        navigation.replace('CustomerLedgerDetail', { ledgerData: item, customerName });
      } else {
        setLedgers([]);
      }
    } catch (error) {
      console.error('Ledger Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLedgers();
    }, [])
  );

  const handlePress = useCallback((item, customerName) => {
    navigation.navigate('CustomerLedgerDetail', { ledgerData: item, customerName });
  }, [navigation]);

  const renderCard = useCallback(({ item }) => (
    <LedgerCard item={item} onPress={handlePress} />
  ), [handlePress]);

  const keyExtractor = useCallback((item, index) => item.customer_code || index.toString(), []);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#8E24AA', '#5E35B1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerSubtitle}>View ledgers & transactions</Text>
      </LinearGradient>

      {/* List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8E24AA" />
        </View>
      ) : ledgers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={48} color="#CCC" />
          <Text style={styles.emptyText}>No customers found.</Text>
        </View>
      ) : (
        <FlatList
          data={ledgers}
          keyExtractor={keyExtractor}
          renderItem={renderCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for bottom tab
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  customerCode: {
    fontSize: 13,
    color: '#666',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
