import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { User, Lock, ArrowRight, Leaf, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading: contextLoading, token } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  React.useEffect(() => {
    if (!contextLoading && token) {
      navigation.replace('MainTabs');
    }
  }, [contextLoading, token, navigation]);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!code || !password) return;
    setIsLoggingIn(true);
    const success = await login(code, password);
    setIsLoggingIn(false);
    if (success) {
      navigation.replace('MainTabs');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.mainContainer}>
        {/* Background Gradient */}
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#8E24AA' }]}
        />

        {/* Decorative Top Elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />


        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContent, 
              { 
                paddingTop: insets.top + (isKeyboardVisible ? 20 : 40),
                paddingBottom: isKeyboardVisible ? 120 : 40,
                justifyContent: isKeyboardVisible ? 'flex-start' : 'center'
              }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header / Brand */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/image.jpeg')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>GOLDEN RAIN EST</Text>
              <Text style={styles.tagline}>Premium Trading & Services</Text>
            </View>

            {/* Login Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.instructionText}>Sign in to manage your store</Text>

              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <User pointerEvents="none" size={18} color="#8E24AA" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Customer Code"
                  placeholderTextColor="#999"
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Lock pointerEvents="none" size={18} color="#8E24AA" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity  activeOpacity={0.7} 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff pointerEvents="none" size={18} color="#8E24AA" />
                  ) : (
                    <Eye pointerEvents="none" size={18} color="#8E24AA" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity  activeOpacity={0.7} style={styles.forgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity  activeOpacity={0.7} 
                style={styles.loginButton}
                onPress={handleLogin}
                
                disabled={isLoggingIn}
              >
                <View
                  style={[styles.buttonGradient, { backgroundColor: '#8E24AA' }]}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>SIGN IN</Text>
                      <ArrowRight pointerEvents="none" size={18} color="#FFF" />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Need technical support?</Text>
              <TouchableOpacity  activeOpacity={0.7}>
                <Text style={styles.contactText}> Contact Admin</Text>
              </TouchableOpacity>
            </View>
            
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#8E24AA',
  },
  flex: {
    flex: 1,
  },
  
  // Background Decorations
  decorCircle1: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    top: height * 0.2,
    left: -width * 0.3,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    // paddingBottom is handled dynamically in inline style
  },

  // Header Logo area
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
    marginTop: 6,
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    fontWeight: '500',
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 8,
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  eyeIcon: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotText: {
    color: '#8E24AA',
    fontSize: 12,
    fontWeight: '600',
  },
  
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  contactText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
