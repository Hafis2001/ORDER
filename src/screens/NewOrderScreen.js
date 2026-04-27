import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';

export default function NewOrderScreen({ navigation }) {
  const [customer, setCustomer] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>GOLDEN RAIN EST</Text>
          <Text style={styles.subtitle}>Select a customer and discover today's fresh harvest.</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Search or enter name..." 
            value={customer}
            onChangeText={setCustomer}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Item Type</Text>
          <View style={styles.cardContainer}>
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => navigation.navigate('VegetablesList')}
            >
              <Text style={styles.cardIcon}>🥬</Text>
              <Text style={styles.cardText}>Fresh Vegetables</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <Text style={styles.cardIcon}>🍎</Text>
              <Text style={styles.cardText}>Seasonal Fruits</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f9ff', // Fresh Harvest Background
  },
  container: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#181c20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#181c20',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e8ee',
    borderRadius: 24,
    padding: 16,
    fontSize: 16,
    color: '#181c20',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181c20',
    marginBottom: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#D63384',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#181c20',
    textAlign: 'center',
  }
});
