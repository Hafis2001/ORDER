import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Home, Search, ShoppingBag, ClipboardList, User, Users } from 'lucide-react-native';

import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';

// Global Touch Fixes were applied directly to components via script.

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import NewOrderScreen from './src/screens/NewOrderScreen';
import VegetablesListScreen from './src/screens/VegetablesListScreen';
import CartScreen from './src/screens/CartScreen';
import CategoryProductsScreen from './src/screens/CategoryProductsScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CustomerLedgerListScreen from './src/screens/CustomerLedgerListScreen';
import CustomerLedgerDetailScreen from './src/screens/CustomerLedgerDetailScreen';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import NetworkOverlay from './src/components/NetworkOverlay';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Animated icon for regular tabs
function AnimatedTabIcon({ focused, IconComponent }) {
  const activeValue = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    activeValue.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 180 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(activeValue.value, [0, 1], [1, 1.15]) }],
    opacity: interpolate(activeValue.value, [0, 1], [0.5, 1]),
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <Animated.View style={iconStyle} pointerEvents="none">
        <IconComponent
          size={22}
          color={focused ? '#8E24AA' : '#BBAECF'}
          strokeWidth={focused ? 2.5 : 1.8}
        />
      </Animated.View>
    </View>
  );
}

// Custom tab bar with raised center Search button
function CustomTabBar({ state, descriptors, navigation }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View style={[styles.tabBarWrapper, { bottom: 20 + insets.bottom }]} pointerEvents="box-none">
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = index === 2; // center slot

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            return (
              // No pointerEvents restriction — iOS needs full touch pass-through on raised button
              <View key={route.key} style={styles.centerSlot} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.centerBtn}
                  onPress={onPress}
                  activeOpacity={0.85}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Search pointerEvents="none" size={26} color="#FFF" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            );
          }

          const iconMap = {
            Home: Home,
            Items: ShoppingBag,
            Customers: Users,
            Orders: ClipboardList,
            Profile: User,
          };
          const IconComponent = iconMap[route.name] || Home;

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <AnimatedTabIcon focused={isFocused} IconComponent={IconComponent} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={NewOrderScreen} />
      <Tab.Screen name="Items" component={CategoryProductsScreen}
        initialParams={{ category: 'All' }} />
      <Tab.Screen name="Search" component={CategoryProductsScreen}
        initialParams={{ category: 'All' }} />
      <Tab.Screen name="Customers" component={CustomerLedgerDetailScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
    </Tab.Navigator>
  );
}

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#2D2D2D',
    border: '#F0F0F0',
    primary: '#8E24AA',
  },
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    // Taller wrapper so the raised center button's touch area is fully inside
    // the parent bounds (iOS clips touches to parent frame by default)
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    // overflow visible so iOS allows touches on raised portion
    overflow: 'visible',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 36,
    height: 64,
    width: '100%',
    alignItems: 'center',
    elevation: 18,
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(142,36,170,0.06)',
    overflow: 'visible',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Center slot: leave space for the raised button
  centerSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28, // lifts above the tab bar
    overflow: 'visible',
  },
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#8E24AA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 14,
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    // White ring border
    borderWidth: 4,
    borderColor: '#FFF',
  },
});

export default function App() {
  const [appKey, setAppKey] = useState(0);

  const handleReconnect = useCallback(() => {
    // Force a re-render of the entire navigation stack to reload the page data after network reconnects
    setAppKey(prev => prev + 1);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NetworkOverlay onReconnect={handleReconnect} />
      <AuthProvider>
        <CartProvider>
          <NavigationContainer theme={AppTheme} key={`nav-${appKey}`}>
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
                detachInactiveScreens: false,
              }}
            >
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="VegetablesList" component={VegetablesListScreen} />
              <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
              <Stack.Screen name="Cart" component={CartScreen} options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
              <Stack.Screen name="CustomerLedgerDetail" component={CustomerLedgerDetailScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
