import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';

const VEGETABLES = [
  { id: '1', name: 'Organic Heirloom Tomatoes', price: '$4.99 / lb', emoji: '🍅' },
  { id: '2', name: 'Fresh Crisp Lettuce', price: '$2.49 / head', emoji: '🥬' },
  { id: '3', name: 'Sweet Carrots', price: '$1.99 / bunch', emoji: '🥕' },
  { id: '4', name: 'Bell Peppers', price: '$3.50 / lb', emoji: '🫑' },
];

export default function VegetablesListScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vegetables</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          {VEGETABLES.map(veg => (
            <View key={veg.id} style={styles.card}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.emoji}>{veg.emoji}</Text>
              </View>
              <Text style={styles.itemName}>{veg.name}</Text>
              <Text style={styles.itemPrice}>{veg.price}</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add to Cart</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
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
  cartButton: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#D63384',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cartIcon: {
    fontSize: 20,
  },
  container: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#D63384',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#f1f4f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 40,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#181c20',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#FFC107', // Gold highlight
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#D63384', // Vibrant Pink
    paddingVertical: 10,
    borderRadius: 9999, // Pill shape
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
