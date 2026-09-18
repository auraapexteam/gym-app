import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ImageBackground,
  Dimensions,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radii } from '../theme/tokens';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import { supabase } from '../api/supabase';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </Svg>
);

export function LoginScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { setSession, loadUserProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefillEmail = route?.params?.prefillEmail;
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [route?.params?.prefillEmail]);

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

  const isEmailFormValid = email.trim().length > 0 && password.length >= 6;

  const navigateAfterAuth = async () => {
    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
    } catch {
      // ignore
    }
    await loadUserProfile();
    const profile = useAuthStore.getState().userProfile;
    if (profile && profile.onboarding_completed === false && !profile.gym_id) {
      navigation.replace('ProfileSetup');
    } else {
      navigation.replace('MainTabs');
    }
  };

  const handleEmailSignIn = async () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post('/auth/login', {
        email: email.trim(),
        password,
      });

      if (res.data?.success && res.data.data?.session) {
        await setSession(res.data.data.session, res.data.data.profile);
        await navigateAfterAuth();
      } else {
        throw new Error(res.data?.message || 'Login failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 8;
  const bottomInset = Math.max(insets.bottom, 20) + 24;

  return (
    <View style={styles.container}>
      {/* Top Hero Image (~28% screen height) */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
        }}
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <View style={styles.darkGradientOverlay} />

        <View style={[styles.headerSafeArea, { paddingTop: topInset }]}>
          <View style={styles.topHeader}>
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <ChevronLeft size={20} color={colors.white} />
            </TouchableOpacity>

            <Text style={styles.brandText}>AURA APEX</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Bottom Sheet Card (`colors.bgElevated`) */}
      <View style={styles.bottomSheetCard}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Text style={styles.headingTitle}>
            <Text style={styles.greenText}>Sign in </Text>
            <Text style={styles.whiteText}>for{'\n'}Fitness Success</Text>
          </Text>
          <Text style={styles.subtext}>Join India's fastest growing fitness ecosystem.</Text>

          {/* Email & Password Input Fields */}
          <View style={styles.inputFieldBox}>
            <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputFieldBox}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={styles.textInput}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={18} color={colors.textMuted} />
              ) : (
                <Eye size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordRow}
            activeOpacity={0.8}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Primary Button */}
          <PrimaryButton
            title="Sign In"
            onPress={handleEmailSignIn}
            disabled={!isEmailFormValid}
            loading={loading}
            style={styles.ctaMargin}
          />

          {/* New here? Create account link */}
          <View style={styles.accountLinkContainer}>
            <Text style={styles.accountText}>
              New here?{' '}
              <Text
                style={styles.accountGreenLink}
                onPress={() => navigation.navigate('Signup', { prefillEmail: email.trim() })}
              >
                Create account
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
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  heroBackground: {
    width: '100%',
    height: Math.max(SCREEN_HEIGHT * 0.28, 220),
  },
  darkGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 10, 10, 0.55)',
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  brandText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  bottomSheetCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    marginTop: -20,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  headingTitle: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 6,
  },
  greenText: {
    color: colors.accent,
  },
  whiteText: {
    color: colors.white,
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  segmentedMargin: {
    marginBottom: 16,
  },
  inputFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  flagCode: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 10,
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.surfaceBorder,
    marginRight: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  ctaMargin: {
    marginTop: 4,
    marginBottom: 16,
  },
  forgotPasswordRow: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  accountLinkContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  accountText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  accountGreenLink: {
    color: colors.accent,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  googleButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
  shieldSquare: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resendRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  resendText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: colors.textMuted,
  },
});

