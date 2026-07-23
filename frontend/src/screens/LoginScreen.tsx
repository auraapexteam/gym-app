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
import { Theme } from '../theme/Theme';
import { Sparkles, Apple } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasscode = () => {
    Alert.alert(
      'Forgot Passcode?',
      'Please contact your gym administrator to reset your passcode or send a recovery link.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Sparkle Logo */}
          <View style={styles.logoCircle}>
            <Sparkles size={28} color="#FFFFFF" />
          </View>

          {/* Header */}
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue training.</Text>

          {/* Form */}
          <View style={styles.formContainer}>
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

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={handleForgotPasscode} style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Forgot passcode?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0b0f19" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerWrapper}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
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
              New to our gym?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('Signup')}
              >
                Create an account
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
    marginBottom: 24,
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
    marginTop: 32,
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
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
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
