import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../api/supabase';

/** Uses the configured Supabase Apple provider; no credentials belong in the app. */
export function AppleSignInButton({ disabled = false }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  if (Platform.OS !== 'ios') return null;

  const signIn = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: 'auraapex://login-callback', skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url || !data.url.startsWith('https://')) {
        throw new Error('Apple sign-in could not start. Please try again.');
      }
      await Linking.openURL(data.url);
    } catch {
      // Never display or log OAuth URLs, tokens, or provider configuration details.
      Alert.alert('Apple Sign-In unavailable', 'Please try again later or contact contact@auraapex.in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Sign in with Apple"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={styles.button}
      disabled={disabled || loading}
      onPress={signIn}
    >
      {loading ? <ActivityIndicator color="#000000" /> : <Text style={styles.label}>Sign in with Apple</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { height: 52, borderRadius: 12, marginTop: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#000000', fontSize: 17, fontWeight: '600' },
});
