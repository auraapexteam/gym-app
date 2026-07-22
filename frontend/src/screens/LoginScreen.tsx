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
} from 'react-native';
import { supabase } from '../api/supabase';
import { Theme } from '../theme/Theme';
import { TextField } from '../components/TextField';
import { AppButton } from '../components/AppButton';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleBiometrics = () => {
    Alert.alert(
      'Biometric Sign In',
      'Biometric authentication is available on supported devices. Please set up fingerprint/FaceID in your phone settings.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Soft brand glow effect at the top */}
      <View style={styles.glowBg} />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Welcome Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🛡️</Text>
            </View>
            <h1 style={styles.title}>Welcome back</h1>
            <Text style={styles.subtitle}>
              Sign in to stay connected with your gym — notices, plans, and schedules at a glance.
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <TextField
              label="Email"
              placeholder="you@gym.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIconText="✉"
            />

            <TextField
              label="Password"
              placeholder="Your passcode"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              leftIconText="🔒"
              passwordToggle={true}
            />

            <View style={styles.forgotWrapper}>
              <TouchableOpacity onPress={handleForgotPasscode}>
                <Text style={styles.forgotText}>Forgot passcode?</Text>
              </TouchableOpacity>
            </View>

            <AppButton
              variant="primary"
              size="lg"
              fullWidth={true}
              loading={loading}
              onPress={handleLogin}
            >
              Sign in
            </AppButton>

            {/* OR separator */}
            <View style={styles.dividerWrapper}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Biometric Button */}
            <View style={styles.biometricContainer}>
              <TouchableOpacity style={styles.biometricButton} onPress={handleBiometrics}>
                <Text style={styles.biometricIcon}>👆</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Create Account footer */}
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
    backgroundColor: Theme.colors.background,
  },
  glowBg: {
    position: 'absolute',
    top: -160,
    alignSelf: 'center',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: Theme.colors.primary,
    opacity: 0.15,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow.lift,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 24,
    ...Theme.shadow.lift,
  },
  forgotWrapper: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: Theme.colors.mutedForeground,
    marginHorizontal: 12,
  },
  biometricContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  biometricButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricIcon: {
    fontSize: 24,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
  },
  footerLink: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
});
