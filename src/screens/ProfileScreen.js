import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Dimensions,
  Alert
} from 'react-native';

import { 
  User, 
  Phone, 
  MapPin, 
  Building, 
  Hash, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Settings
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const InfoRow = ({ icon: Icon, label, value, isLast = false }) => (
  <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
    <View style={styles.iconContainer}>
      <Icon size={18} color="#8E24AA" />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

const ActionItem = ({ icon: Icon, label, onPress, color = '#333' }) => (
  <TouchableOpacity  activeOpacity={0.7} style={styles.actionItem} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    <ChevronRight pointerEvents="none" size={18} color="#CCC" />
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View
          style={[styles.header, { backgroundColor: '#8E24AA', paddingTop: insets.top + 20 }]}
        >
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <Text style={styles.initials}>{getInitials(user?.name)}</Text>
            </View>
            <TouchableOpacity  activeOpacity={0.7} style={styles.editBadge}>
              <Settings pointerEvents="none" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
          <View style={styles.userBadge}>
            <ShieldCheck pointerEvents="none" size={12} color="#FFF" />
            <Text style={styles.userBadgeText}>Verified Customer</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Main Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Details</Text>
            <InfoRow icon={Hash} label="Customer Code" value={user?.code} />
            <InfoRow icon={Phone} label="Phone Number" value={user?.phone} />
            <InfoRow icon={MapPin} label="City / Place" value={`${user?.city || ''}, ${user?.place || ''}`} />
            <InfoRow icon={Building} label="Business Address" value={user?.address} isLast={true} />
          </View>


          {/* Logout Section */}
          <TouchableOpacity  activeOpacity={0.7} style={styles.logoutBtn} onPress={handleLogout}>
            <View
              style={styles.logoutGradient}
            >
              <LogOut pointerEvents="none" size={20} color="#FFF" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.version}>App Version 8.3.1 • Build 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  initials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#333',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8E24AA',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  userBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    marginTop: -20,
    paddingBottom: 120, // Space for floating tab bar
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8E24AA',
    letterSpacing: 1,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutBtn: {
    marginTop: 30,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  version: {
    textAlign: 'center',
    marginTop: 30,
    color: '#BBB',
    fontSize: 12,
    fontWeight: '600',
  }
});
