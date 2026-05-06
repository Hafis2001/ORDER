import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user data on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
        
        if (storedToken && storedUser && loginTimestamp) {
          const now = Date.now();
          const loginTime = parseInt(loginTimestamp);
          const hoursElapsed = (now - loginTime) / (1000 * 60 * 60);

          if (hoursElapsed < 23) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Session expired
            await logout();
          }
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
        await AsyncStorage.setItem('loginTimestamp', Date.now().toString());
        
        setToken(data.token);
        setUser(userData);
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
      await AsyncStorage.removeItem('loginTimestamp');
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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
