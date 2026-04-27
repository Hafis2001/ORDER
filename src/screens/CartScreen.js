import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

export default function CartScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cartItem}>
          <View style={styles.itemIconContainer}>
            <Text style={styles.itemIcon}>🍅</Text>
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>Organic Heirloom Tomatoes</Text>
            <Text style={styles.itemPrice}>$4.99</Text>
          </View>
          <View style={styles.quantityControl}>
            <Text style={styles.qtyText}>-  1  +</Text>
          </View>
        </View>

        <View style={styles.cartItem}>
          <View style={styles.itemIconContainer}>
            <Text style={styles.itemIcon}>🥬</Text>
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>Fresh Crisp Lettuce</Text>
            <Text style={styles.itemPrice}>$2.49</Text>
          </View>
          <View style={styles.quantityControl}>
            <Text style={styles.qtyText}>-  2  +</Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>$9.97</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>$0.80</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>$10.77</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={() => alert('Order Placed!')}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f9ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f9ff',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#181c20',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181c20',
  },
  container: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#D63384',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  itemIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#f1f4f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemIcon: {
    fontSize: 30,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#181c20',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  quantityControl: {
    backgroundColor: '#f1f4f9',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181c20',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    marginBottom: 32,
    shadowColor: '#D63384',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  summaryValue: {
    fontSize: 16,
    color: '#181c20',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#ebeef3',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181c20',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D63384',
  },
  checkoutButton: {
    backgroundColor: '#D63384',
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#D63384',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  checkoutText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
