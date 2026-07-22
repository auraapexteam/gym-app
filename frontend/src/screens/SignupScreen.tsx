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

export function SignupScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPasswordValid = password.length >= 8;
  const passwordHelper = !passwordTouched
    ? 'Use at least 8 characters.'
    : isPasswordValid
    ? 'Looks good.'
    : undefined;
  const passwordError = passwordTouched && password.length > 0 && !isPasswordValid
    ? 'Passcode needs at least 8 characters.'
    : undefined;

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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>← Back to sign in</Text>
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.header}>
            <h1 style={styles.title}>Create your account</h1>
            <Text style={styles.subtitle}>
              Sign up below to register and start managing your subscriptions.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <TextField
              label="Full Name"
              placeholder="Priya Sharma"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              leftIconText="👤"
            />

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
              label="Passcode"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setPasswordTouched(true)}
              autoCapitalize="none"
              leftIconText="🔒"
              passwordToggle={true}
              helper={passwordHelper}
              error={passwordError}
            />

            <View style={styles.spacer} />

            <AppButton
              variant="primary"
              size="lg"
              fullWidth={true}
              loading={loading}
              onPress={handleSignup}
            >
              Create account
            </AppButton>
          </View>

          {/* Already have an account footer */}
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
    backgroundColor: Theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAEBE6',
    borderRadius: Theme.radius.round,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.foreground,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 24,
    ...Theme.shadow.lift,
  },
  spacer: {
    height: 10,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    marginBottom: 20,
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
