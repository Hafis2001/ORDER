import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, ScrollView } from 'react-native';

import { ChevronLeft, Package, Clock, CheckCircle2, ChevronRight, Truck, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getStatusColor = (status) => {
  const s = status ? status.toLowerCase() : '';
  if (s.includes('deliver')) return '#27AE60';
  if (s.includes('process')) return '#F2994A';
  return '#8E24AA';
};

const getStatusIcon = (status, color) => {
  const s = status ? status.toLowerCase() : '';
  if (s.includes('deliver')) return <CheckCircle2 pointerEvents="none" size={14} color={color} />;
  if (s.includes('process')) return <Clock pointerEvents="none" size={14} color={color} />;
  return <Package pointerEvents="none" size={14} color={color} />;
};

const OrderCard = React.memo(function OrderCard({ order, onViewDetails }) {
  const statusColor = getStatusColor(order.status);
  
  return (
    <TouchableOpacity  activeOpacity={0.7} style={styles.card}  onPress={() => onViewDetails(order)}>
      {/* Top Header: Date and Status */}
      <View style={styles.cardHeader}>
        <View style={styles.orderDateWrap}>
          <Clock pointerEvents="none" size={18} color="#8E24AA" />
          <Text style={styles.orderDateText} numberOfLines={1}>{order.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          {getStatusIcon(order.status, statusColor)}
          <Text style={[styles.statusText, { color: statusColor }]}>{order.status || 'Pending'}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Details Section */}
      <View style={styles.cardBody}>
        <View style={[styles.detailCol, { flex: 2 }]}>
          <Text style={styles.detailLabel}>Batch Ref.</Text>
          <Text style={styles.detailValueId} numberOfLines={1}>{order.id}</Text>
        </View>
        <View style={[styles.detailCol, { flex: 1, alignItems: 'center' }]}>
          <Text style={styles.detailLabel}>Items</Text>
          <Text style={styles.detailValue}>{order.items}</Text>
        </View>
        <View style={[styles.detailCol, { flex: 1, alignItems: 'flex-end' }]}>
          <Text style={styles.detailLabel}>Total Qty</Text>
          <Text style={styles.detailValueTotal}>{Number(order.totalQuantity || 0).toFixed(3)}</Text>
        </View>
      </View>

      {!!order.cartRemarks && (
        <View style={styles.orderNoteBox}>
          <Text style={styles.orderNoteLabel}>Order Note</Text>
          <Text style={styles.orderNoteText}>{order.cartRemarks}</Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.deliveryInfo}>
          <Package pointerEvents="none" size={15} color="#888" />
          <Text style={styles.deliveryText}>Order Summary</Text>
        </View>
        <View style={styles.viewDetails}>
          <Text style={styles.viewDetailsText}>View Items</Text>
          <ChevronRight pointerEvents="none" size={16} color="#8E24AA" />
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => prevProps.order.id === nextProps.order.id);

export default function OrdersScreen({ navigation }) {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const response = await fetch('https://gold.imcbs.com/api/orders/my/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          
          // Filter by the logged in customer's code
          const customerData = user?.code 
            ? data.filter(order => 
                order.customer_code === user.code || 
                order.customer === user.code ||
                order.customer_id === user.code
              ) 
            : data;

          const ordersArray = customerData.map(batch => {
            const d = new Date(batch.created_at);
            const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            let totalQuantity = 0;
            const itemsList = (batch.items || []).map(item => {
              totalQuantity += (item.quantity || 0);
              return {
                name: item.product_name,
                brand: item.product_brand,
                qty: item.quantity,
                unit: item.unit_display || item.unit || 'Kg',
                remarks: item.remarks
              };
            });

            return {
              id: batch.order_ref || batch.batch_ref,
              date: dateStr,
              status: batch.status_display || batch.status,
              items: itemsList.length,
              totalQuantity: totalQuantity,
              expectedDelivery: batch.status_display || 'Processing',
              timestamp: d.getTime(),
              itemsList,
              cartRemarks: batch.cart_remarks || ''
            };
          }).sort((a, b) => b.timestamp - a.timestamp);

          setOrders(ordersArray);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, user]);

  const renderItem = useCallback(({ item }) => (
    <OrderCard order={item} onViewDetails={setSelectedOrder} />
  ), []);

  const keyExtractor = useCallback(item => item.id.toString(), []);

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <View
        style={[styles.header, { backgroundColor: '#8E24AA', paddingTop: insets.top + 15 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8E24AA" />
        </View>
      ) : orders.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Package pointerEvents="none" size={60} color="#DDD" />
          <Text style={{ marginTop: 10, color: '#999', fontSize: 16 }}>No orders found.</Text>
        </View>
      ) : (
        <FlatList keyboardShouldPersistTaps="handled"
          data={orders}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews={false}
        />
      )}

      {/* Order Details Modal */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order Details</Text>
                <Text style={styles.modalSub}>{selectedOrder?.id}</Text>
              </View>
              <TouchableOpacity  activeOpacity={0.7} onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
                <X pointerEvents="none" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {selectedOrder?.itemsList.map((item, idx) => (
                <View key={idx} style={styles.detailItemRow}>
                  <View style={styles.detailItemLeft}>
                    <Text style={styles.detailItemName}>{item.name || 'Unknown Product'}</Text>
                    {!!item.brand && <Text style={styles.detailItemBrand}>{item.brand}</Text>}
                    {!!item.remarks && (
                      <View style={styles.remarksBadge}>
                        <Text style={styles.remarksText}>Note: {item.remarks}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.detailItemRight}>
                    <Text style={styles.detailItemQty}>{Number(item.qty || 0).toFixed(3)}</Text>
                    <Text style={styles.detailItemUnit}>{item.unit}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  
  header: {

    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },

  list: {
    padding: 16,
    paddingBottom: 100, // Space for bottom tab bar
    gap: 16,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(142,36,170,0.08)',
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  orderDateText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A2A3A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 6,
  },
  detailCol: {
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValueId: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '800',
  },
  detailValueTotal: {
    fontSize: 15,
    color: '#8E24AA',
    fontWeight: '900',
  },

  orderNoteBox: {
    backgroundColor: '#FDF8E4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBEFB4',
  },
  orderNoteLabel: {
    fontSize: 10,
    color: '#856404',
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  orderNoteText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#8E24AA',
    fontWeight: '800',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    paddingBottom: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A2A3A',
  },
  modalSub: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    marginTop: 4,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  modalScroll: {
    gap: 0,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailItemLeft: {
    flex: 1,
    paddingRight: 16,
  },
  detailItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    lineHeight: 20,
  },
  detailItemBrand: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  remarksBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  remarksText: {
    color: '#856404',
    fontSize: 11,
    fontWeight: '600',
  },
  detailItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 50,
  },
  detailItemQty: {
    fontSize: 18,
    fontWeight: '900',
    color: '#8E24AA',
  },
  detailItemUnit: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 2,
  },
});
