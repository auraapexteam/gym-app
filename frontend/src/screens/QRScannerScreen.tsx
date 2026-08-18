import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { colors, radii } from '../theme/tokens';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function QRScannerScreen({ navigation }: any) {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [submitting, setSubmitting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const checkCameraPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'Aura Apex Gym needs camera access to scan check-in QR codes.',
              buttonPositive: 'OK',
              buttonNegative: 'Cancel',
            }
          );
          setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } catch {
          setHasPermission(false);
        }
      } else {
        setHasPermission(true);
      }
    };
    checkCameraPermission();
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const handleBarcodeRead = async (scannedCode?: string) => {
    if (!scannedCode || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const res = await apiClient.post('/attendance/check-in', {
        token: scannedCode.trim(),
      });

      if (res.data?.success) {
        Alert.alert('Check-in Successful! 🎉', 'Welcome to Aura Apex gym. Enjoy your workout!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Check-in Notice', res.data?.message || 'Check-in processed.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Check-in failed. Please verify your QR code or membership.';
      Alert.alert('Check-in Failed', msg, [
        { text: 'OK', onPress: () => { submittingRef.current = false; setSubmitting(false); } },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Scan QR Code</Text>
            <Text style={styles.subtitle}>Point camera at gym entry QR</Text>
          </View>
        </View>

        {/* Scanner Viewport */}
        <View style={styles.scannerCenter}>
          {hasPermission && (
            <Camera
              style={StyleSheet.absoluteFill}
              scanBarcode={true}
              onReadCode={(event: any) => handleBarcodeRead(event?.nativeEvent?.codeStringValue)}
              showFrame={false}
            />
          )}

          <View style={styles.scanFrame}>
            {/* 4 Corner Brackets */}
            <View style={[styles.bracket, styles.topLeft]} />
            <View style={[styles.bracket, styles.topRight]} />
            <View style={[styles.bracket, styles.bottomLeft]} />
            <View style={[styles.bracket, styles.bottomRight]} />

            {/* Moving Green Line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY }] },
              ]}
            />
          </View>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          {submitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Verifying check-in token...</Text>
            </View>
          ) : (
            <Text style={styles.footerTip}>Align the QR code within the frame to verify attendance</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scannerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: radii.md,
  },
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    height: 2,
    backgroundColor: colors.accent,
    width: '100%',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  footerTip: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
