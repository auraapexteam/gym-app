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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../api/supabase';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Check, X } from 'lucide-react-native';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;'/]/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      digit: /[0-9]/.test(password),
      special: SPECIAL_CHAR_REGEX.test(password),
    }),
    [password]
  );
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSignup = async () => {
    setEmailError('');
    setPasswordError('');

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
    if (!isPasswordValid) {
      setPasswordError('Password does not meet all requirements below.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email')) {
          setEmailError(error.message);
        } else if (msg.includes('password')) {
          setPasswordError(error.message);
        } else {
          Alert.alert('Sign Up Failed', error.message);
        }
      } else if (!data.session) {
        // Email confirmation required — the auth stack is still mounted, so
        // returning to Login is valid. (With auto-confirm, a session comes
        // back, the auth listener switches stacks, and no navigation is
        // needed — navigating to 'Login' would target a removed route.)
        Alert.alert(
          'Account Created',
          'Account created successfully. Please verify your email if required, then sign in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Back Link */}
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to sign in</Text>
          </TouchableOpacity>

          {/* Sparkle Logo */}
          <View style={styles.logoCircle}>
            <Sparkles size={28} color="#FFFFFF" />
          </View>

          {/* Header */}
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Aura Apex in 30 seconds.</Text>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Full Name Input */}
            <View style={[styles.inputLabelContainer, nameFocus && styles.inputFocus]}>
              <Text style={[styles.floatingLabel, (nameFocus || fullName.length > 0) && styles.floatingLabelActive]}>
                Full name
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
                autoCapitalize="words"
                style={styles.textInput}
              />
            </View>

            {/* Email Input */}
            <View
              style={[
                styles.inputLabelContainer,
                emailFocus && styles.inputFocus,
                !!emailError && styles.inputErrorBorder,
              ]}
            >
              <Text style={[styles.floatingLabel, (emailFocus || email.length > 0) && styles.floatingLabelActive]}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError('');
                }}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.textInput}
              />
            </View>
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

            {/* Password Input */}
            <View
              style={[
                styles.inputLabelContainer,
                passwordFocus && styles.inputFocus,
                !!passwordError && styles.inputErrorBorder,
              ]}
            >
              <Text style={[styles.floatingLabel, (passwordFocus || password.length > 0) && styles.floatingLabelActive]}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (passwordError) setPasswordError('');
                }}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                autoCapitalize="none"
                secureTextEntry
                style={styles.textInput}
              />
            </View>
            {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

            {/* Real-time password requirement checklist */}
            {(passwordFocus || password.length > 0) && (
              <View style={styles.checklistBox}>
                {[
                  { key: 'length', label: 'At least 8 characters' },
                  { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
                  { key: 'digit', label: 'One number (0-9)' },
                  { key: 'special', label: 'One special symbol (!@#$…)' },
                ].map((req) => {
                  const met = (passwordChecks as any)[req.key];
                  return (
                    <View key={req.key} style={styles.checklistRow}>
                      <View
                        style={[
                          styles.checklistIcon,
                          { backgroundColor: met ? colors.successSoft : colors.destructiveSoft },
                        ]}
                      >
                        {met ? (
                          <Check size={11} color={colors.success} strokeWidth={3} />
                        ) : (
                          <X size={11} color={colors.destructive} strokeWidth={3} />
                        )}
                      </View>
                      <Text style={[styles.checklistText, met && { color: colors.foreground }]}>
                        {req.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Create account</Text>
              )}
            </TouchableOpacity>

          </View>

          {/* Footer Account Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('Login')}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 6,
  },
  formContainer: {
    marginTop: 24,
    gap: 16,
  },
  inputLabelContainer: {
    position: 'relative',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 8,
    height: 58,
  },
  inputFocus: {
    borderColor: colors.primary,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surface,
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: 18,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  floatingLabelActive: {
    top: 6,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.primary,
  },
  textInput: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    padding: 0,
    margin: 0,
  },
  errorText: {
    fontSize: 12,
    color: colors.destructive,
    fontWeight: '600',
    marginTop: -4,
  },
  inputErrorBorder: {
    borderColor: colors.destructive,
  },
  checklistBox: {
    gap: 8,
    marginTop: -4,
    marginBottom: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});
