import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

const SettingsScreen = ({ navigation }) => {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  const OptionItem = ({ title, isDestructive = false }) => (
    <TouchableOpacity delayPressIn={0} activeOpacity={0.7} style={styles.optionCard}>
      <Text style={[styles.optionTitle, isDestructive && styles.destructiveText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <OptionItem title="Edit Profile" />
          <OptionItem title="Notifications" />
          <OptionItem title="Privacy & Security" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <OptionItem title="Theme (Light/Dark)" />
          <OptionItem title="Language" />
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity delayPressIn={0} activeOpacity={0.7} style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf9fa',
  },
  container: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1c1d',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#6a6b6c',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#1a1c1d',
    fontWeight: '500',
  },
  destructiveText: {
    color: '#ba1a1a',
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#ffdad6',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#93000a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
