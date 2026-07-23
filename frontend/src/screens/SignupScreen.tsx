import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../api/supabase';
import { Sparkles, Apple } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export function SignupScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || undefined,
          },
        },
      });

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else {
        Alert.alert(
          'Account Created',
          'Account created successfully. Please verify your email if required, or sign in.',
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
            <View style={[styles.inputLabelContainer, emailFocus && styles.inputFocus]}>
              <Text style={[styles.floatingLabel, (emailFocus || email.length > 0) && styles.floatingLabelActive]}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.textInput}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputLabelContainer, passwordFocus && styles.inputFocus]}>
              <Text style={[styles.floatingLabel, (passwordFocus || password.length > 0) && styles.floatingLabelActive]}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                autoCapitalize="none"
                secureTextEntry
                style={styles.textInput}
              />
            </View>

            {/* Helper Text */}
            {password.length > 0 && password.length < 8 && (
              <Text style={styles.errorText}>Passcode needs at least 8 characters.</Text>
            )}

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0b0f19" />
              ) : (
                <Text style={styles.primaryButtonText}>Create account</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerWrapper}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Row */}
            <View style={styles.socialRow}>
              <TouchableOpacity activeOpacity={0.7} style={styles.socialButton}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path
                    fill="#EA4335"
                    d="M12 10v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.2 14.7 2.3 12 2.3 6.7 2.3 2.5 6.6 2.5 12s4.2 9.7 9.5 9.7c5.5 0 9.1-3.8 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
                  />
                </Svg>
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} style={styles.socialButton}>
                <Apple size={16} color="#f5f6fa" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a1a5b7',
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a5b7',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 8,
    height: 58,
  },
  inputFocus: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: 18,
    fontSize: 14,
    color: '#a1a5b7',
  },
  floatingLabelActive: {
    top: 6,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6366f1',
  },
  textInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f5f6fa',
    padding: 0,
    margin: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#f87171',
    fontWeight: '600',
    marginTop: -4,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 9999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
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
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a1a5b7',
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f6fa',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#a1a5b7',
  },
  footerLink: {
    color: '#6366f1',
    fontWeight: '700',
  },
});
