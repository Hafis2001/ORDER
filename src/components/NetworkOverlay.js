import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';

const NetworkOverlay = ({ onReconnect }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const spin = useSharedValue(0);

  useEffect(() => {
    // Animation for WifiOff icon
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      true // reverse
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
      
      if (!connected) {
        wasOffline = true;
      } else if (connected && wasOffline) {
        // Network came back!
        wasOffline = false;
        if (onReconnect) {
          onReconnect();
        }
      }
    });
    
    // Initial fetch to ensure correct state on mount
    NetInfo.fetch().then(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
      if (!connected) wasOffline = true;
    });
    
    return () => unsubscribe();
  }, [onReconnect]);

  const handleRetry = useCallback(() => {
    setIsChecking(true);
    spin.value = withRepeat(
      withTiming(spin.value + 360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
    
    NetInfo.fetch().then(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
      setTimeout(() => {
        setIsChecking(false);
        spin.value = 0; // stop spinning
        if (connected && onReconnect) {
          onReconnect();
        }
      }, 800);
    });
  }, [onReconnect]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const animatedSpinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spin.value}deg` }],
    };
  });

  if (isConnected) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <WifiOff size={80} color="#FF3B30" strokeWidth={1.5} />
      </Animated.View>
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.message}>Please try again after network.</Text>
      
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={handleRetry}
        disabled={isChecking}
        activeOpacity={0.8}
      >
        <Animated.View style={animatedSpinStyle}>
          <RefreshCw size={20} color="#FFF" />
        </Animated.View>
        <Text style={styles.retryText}>{isChecking ? 'Checking...' : 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    padding: 24,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#8E24AA',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NetworkOverlay;
