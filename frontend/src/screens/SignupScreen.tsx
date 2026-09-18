import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ChevronLeft, User, Mail, Lock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { useTheme } from '../context/ThemeContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </Svg>
);

export function SignupScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [fullName, setFullName] = useState(route?.params?.prefillFullName || '');
  const [email, setEmail] = useState(route?.params?.prefillEmail || route?.params?.email || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'auraapex://login-callback',
        },
      });

      if (error) {
        Alert.alert('Google Sign-In', error.message);
      } else if (data?.url) {
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          Alert.alert('Google Sign-In', 'Opening Google Authentication page...');
        }
      }
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message || 'Failed to initiate Google Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setEmailError('');
    setPasswordError('');

    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setEmailError('Email is required.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setPasswordError('Password is required.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || undefined,
          },
        },
      });

      if (error) {
        const lowerMsg = (error.message || '').toLowerCase();
        if (lowerMsg.includes('already registered') || lowerMsg.includes('already exists') || lowerMsg.includes('user_already_exists')) {
          Alert.alert(
            'Account Already Exists',
            'An account with this email already exists. Redirecting you to Sign In...',
            [{ text: 'Sign In', onPress: () => navigation.replace('Login', { prefillEmail: email.trim() }) }]
          );
        } else {
          Alert.alert('Sign Up Failed', error.message);
        }
      } else if (!data.session) {
        await AsyncStorage.setItem('has_seen_onboarding', 'true');
        Alert.alert(
          'Account Created 🎉',
          'Account created successfully! Please verify your email if required, then sign in.',
          [{ text: 'OK', onPress: () => navigation.replace('Login', { prefillEmail: email.trim() }) }]
        );
      } else {
        await AsyncStorage.setItem('has_seen_onboarding', 'true');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);
  const bottomInset = Math.max(insets.bottom, 20) + 24;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: bottomInset }]} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
              <ChevronLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.brandContainer}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M4 12L8 4L12 20L16 8L20 12" stroke="#88ef0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
              <Text style={styles.brandText}>AURA APEX</Text>
            </View>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            <Text style={styles.title}>
              <Text style={styles.titleGreen}>Create </Text>
              Account
            </Text>
            <Text style={styles.subtitle}>Join India's fastest growing fitness ecosystem.</Text>

            {/* Full Name Input */}
            <View style={styles.inputBox}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
                placeholderTextColor="#64748b"
                autoCapitalize="words"
                style={styles.textInput}
              />
            </View>

            {/* Email Input */}
            <View style={[styles.inputBox, { marginTop: 14 }]}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                placeholder="Email address"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.textInput}
              />
            </View>
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

            {/* Mobile Number Input */}
            <View style={[styles.inputBox, { marginTop: 14 }]}>
              <Text style={styles.countryCode}>IN +91</Text>
              <View style={styles.inputDivider} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Mobile number"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                style={styles.textInput}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputBox, { marginTop: 14 }]}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                placeholder="Password"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={styles.textInput}
              />
            </View>
            {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

            {/* Create Account Button */}
            <TouchableOpacity
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0b0f12" />
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Already have an account */}
            <View style={styles.accountLinkContainer}>
              <Text style={styles.accountText}>
                Already have an account?{' '}
                <Text
                  style={styles.accountGreenLink}
                  onPress={() => navigation.navigate('Login')}
                >
                  Sign in
                </Text>
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Only Sign-In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              activeOpacity={0.85}
              onPress={handleGoogleSignIn}
            >
              <GoogleIcon />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f12',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  keyboardView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: '#88ef0c',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#161b20',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#242b33',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 34,
    marginBottom: 8,
  },
  titleGreen: {
    color: '#88ef0c',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f262e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d3540',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 12,
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#2d3540',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  errorText: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#88ef0c',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#88ef0c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0b0f12',
  },
  accountLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  accountText: {
    fontSize: 14,
    color: '#ffffff',
  },
  accountGreenLink: {
    color: '#88ef0c',
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2d3540',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#94a3b8',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: '#1f262e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d3540',
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
});
