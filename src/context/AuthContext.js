import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  registerForPushNotificationsAsync,
  sendExpoPushTokenToApi,
} from '../services/pushNotifications';

const AuthContext = createContext();
const EXPO_PUSH_TOKEN_KEY = 'expoPushToken';
const EXPO_PUSH_TOKEN_SYNCED_KEY = 'expoPushTokenSynced';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncPushToken = async (authToken) => {
    try {
      const pushTokens = await registerForPushNotificationsAsync();

      if (!pushTokens || !pushTokens.expoToken) {
        return;
      }

      const { expoToken } = pushTokens;
      const syncedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_SYNCED_KEY);
      
      if (syncedToken === expoToken) {
        await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, expoToken);
        return;
      }

      await sendExpoPushTokenToApi(authToken, pushTokens);
      await AsyncStorage.multiSet([
        [EXPO_PUSH_TOKEN_KEY, expoToken],
        [EXPO_PUSH_TOKEN_SYNCED_KEY, expoToken],
      ]);
    } catch (error) {
      console.warn('[PushToken] Could not sync push token:', error.message);
    }
  };

  // Load token and user data on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          syncPushToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStoredData();
  }, []);

  const login = async (code, password) => {
    try {
      setIsLoading(true);
      const response = await fetch('https://gold.imcbs.com/api/auth/customer-login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const userData = {
          code: data.code,
          name: data.name,
          city: data.city,
          place: data.place,
          phone: data.phone,
          address: data.address
        };
        
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        setToken(data.token);
        setUser(userData);
        await syncPushToken(data.token);
        return true;
      } else {
        Alert.alert('Login Failed', data.detail || data.message || 'Invalid credentials. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Network Error', 'Unable to connect to the server. Please check your internet connection.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('loginTimestamp'); // keeping for backwards compat cleanup
      await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
      await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_SYNCED_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  // Helper function to make authenticated requests
  const authFetch = async (url, options = {}) => {
    const currentToken = await AsyncStorage.getItem('userToken');
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
    };
    
    return fetch(url, { ...options, headers });
  };

let isSessionExpiredAlertShown = false;

  // Global fetch interceptor for catching 401 token expiry
  useEffect(() => {
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 401 && !isSessionExpiredAlertShown) {
          isSessionExpiredAlertShown = true;
          Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
            { 
              text: 'OK', 
              onPress: () => {
                isSessionExpiredAlertShown = false;
                logout();
              }
            }
          ]);
        }
        return response;
      } catch (error) {
        throw error;
      }
    };
    return () => {
      global.fetch = originalFetch;
    };
  }, []);

  const value = useMemo(() => ({
    user, token, isLoading, login, logout, authFetch
  }), [user, token, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
