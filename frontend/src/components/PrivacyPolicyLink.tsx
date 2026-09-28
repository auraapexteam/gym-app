import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';

export const PRIVACY_POLICY_URL = 'https://auraapex.in/privacy-policy';

export async function openPrivacyPolicy() {
  try {
    await Linking.openURL(PRIVACY_POLICY_URL);
  } catch {
    Alert.alert('Unable to open privacy policy', 'Please visit ' + PRIVACY_POLICY_URL + ' in your browser.');
  }
}

export function PrivacyPolicyLink() {
  return (
    <TouchableOpacity accessibilityRole="link" accessibilityLabel="Privacy policy"
      onPress={openPrivacyPolicy} style={styles.link}>
      <Text style={styles.text}>Privacy policy</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  text: { color: '#88ef0c', fontSize: 14, textDecorationLine: 'underline' },
});
