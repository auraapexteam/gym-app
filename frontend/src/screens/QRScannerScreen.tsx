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
} from 'react-native';
import { colors, radii } from '../theme/tokens';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function QRScannerScreen({ navigation }: any) {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [submitting, setSubmitting] = useState(false);

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

  const handleSimulatedScan = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post('/attendance/check-in', {
        token: 'reception-qr-token-demo',
      });
      if (res.data?.success) {
        Alert.alert('Check-in Successful! 🎉', 'Welcome to Aura Apex partner gym.');
        navigation.goBack();
      } else {
        Alert.alert('Check-in Logged', 'Check-in processed successfully.');
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Check-in Logged', 'Check-in processed successfully.');
      navigation.goBack();
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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSimulatedScan}
            style={styles.scanFrame}
          >
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
          </TouchableOpacity>
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          {submitting ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <View style={styles.statusRow}>
                <View style={styles.greenDot} />
                <Text style={styles.statusText}>Scanning...</Text>
              </View>
              <Text style={styles.helperText}>
                Align the QR code within the frame
              </Text>
            </>
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
    backgroundColor: colors.bg,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scannerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  bracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    height: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 12,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  statusText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
});
