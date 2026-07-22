import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { apiClient } from '../api/client';
import { COLORS, SHADOWS } from '../theme/tokens';
import { QrCode, ScanLine } from 'lucide-react-native';

export function QRCheckInScreen({ navigation }: any) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!token.trim()) {
      Alert.alert('Required Field', 'Please enter a valid gym QR token.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/attendance/check-in', {
        token: token.trim(),
      });

      if (response.data && response.data.success) {
        Alert.alert(
          'Check-in Successful',
          'Welcome to the gym! Enjoy your workout.',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      }
    } catch (error: any) {
      const errCode = error.response?.data?.error?.code;
      if (errCode === 'ALREADY_CHECKED_IN') {
        Alert.alert('Already Checked In', 'You have already checked in today.');
      } else {
        Alert.alert('Check-in Failed', error.response?.data?.message || 'Invalid or expired QR token.');
      }
    } finally {
      setLoading(false);
      setToken('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.scannerOutline}>
          <ScanLine size={120} color={COLORS.primary} style={styles.scannerIcon} />
          <Text style={styles.scannerText}>AURA APEX MOCK SCANNER</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>Scan Gym QR Code</Text>
          <Text style={styles.description}>
            Enter the token from the gym's active screen display to check in.
          </Text>

          <View style={styles.inputContainer}>
            <QrCode size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter Gym QR Token"
              placeholderTextColor={COLORS.textSecondary}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleCheckIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.buttonText}>Submit & Check-In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOutline: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 24,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: COLORS.surface,
    ...SHADOWS.small,
  },
  scannerIcon: {
    opacity: 0.8,
  },
  scannerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 10,
    letterSpacing: 1.5,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    ...SHADOWS.medium,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
