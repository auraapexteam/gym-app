import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Animated,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Camera } from 'react-native-camera-kit';
import { apiClient } from '../api/client';
import { QrCode, Check } from 'lucide-react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function QRCheckInScreen({ navigation }: any) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  // Circle path details
  const size = 260;
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  // Request camera permission on mount
  useEffect(() => {
    const checkAndRequestPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const checkPerm = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (checkPerm) {
            setHasPermission(true);
          } else {
            const req = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
              title: 'Camera Permission',
              message: 'Aura Apex Gym needs access to your camera to scan check-in QR codes.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            });
            setHasPermission(req === PermissionsAndroid.RESULTS.GRANTED);
          }
        } else {
          // iOS prompts automatically on Camera mounting
          setHasPermission(true);
        }
      } catch (err) {
        setHasPermission(false);
      }
    };
    checkAndRequestPermission();
  }, []);

  useEffect(() => {
    if (phase === 'scanning') {
      // Start spin animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      // Start circle progress fill
      Animated.timing(progressValue, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      }).start();
    } else {
      spinValue.setValue(0);
      progressValue.setValue(0);
    }
  }, [phase]);

  const handleStartCheckIn = async (scannedToken?: string) => {
    const activeToken = scannedToken || token;
    if (!activeToken.trim()) {
      Alert.alert('Required Field', 'Please enter or scan a valid gym QR token.');
      return;
    }

    // Stop active camera scanner by switching to scanning animation phase
    setPhase('scanning');

    // Wait 2.2 seconds to simulate scanning animation
    setTimeout(async () => {
      try {
        setLoading(true);
        const response = await apiClient.post('/attendance/check-in', {
          token: activeToken.trim(),
        });

        if (response.data && response.data.success) {
          setPhase('success');
          // Autohide success screen and navigate back
          setTimeout(() => {
            navigation.navigate('HomeTab');
          }, 1600);
        }
      } catch (error: any) {
        setPhase('idle');
        const errCode = error.response?.data?.error?.code;
        if (errCode === 'ALREADY_CHECKED_IN') {
          Alert.alert('Already Checked In', 'You have already checked in today.');
        } else {
          Alert.alert('Check-in Failed', error.response?.data?.message || 'Invalid or expired QR token.');
        }
      } finally {
        setLoading(false);
      }
    }, 2200);
  };

  const spinAngle = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const strokeDashoffset = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Gym header info */}
        <Text style={styles.gymHeaderSub}>Aura Downtown</Text>
        <Text style={styles.gymHeaderTitle}>
          {phase === 'scanning' ? 'Scanning…' : phase === 'success' ? 'Checked in!' : 'One-tap check-in'}
        </Text>

        {/* Circular Scanner block */}
        <View style={styles.scannerWrapper}>
          <Svg width={size} height={size} style={styles.svgBorder}>
            {/* Background ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated foreground ring */}
            {phase === 'scanning' && (
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="#6366f1"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circ} ${circ}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            )}
          </Svg>

          <View style={styles.innerContent}>
            {phase === 'idle' && hasPermission ? (
              <Camera
                style={StyleSheet.absoluteFill}
                scanBarcode={true}
                onReadCode={(event: any) => {
                  const scannedValue = event.nativeEvent.codeStringValue;
                  if (scannedValue) {
                    handleStartCheckIn(scannedValue);
                  }
                }}
              />
            ) : phase === 'idle' ? (
              <QrCode size={90} color="#a1a5b7" strokeWidth={1.5} />
            ) : null}

            {phase === 'scanning' && (
              <Animated.View style={{ transform: [{ rotate: spinAngle }] }}>
                <QrCode size={90} color="#6366f1" strokeWidth={1.8} />
              </Animated.View>
            )}

            {phase === 'success' && (
              <View style={styles.successCircle}>
                <Check size={54} color="#FFFFFF" strokeWidth={3.5} />
              </View>
            )}
          </View>
        </View>

        {/* Status guidance message */}
        <Text style={styles.helperText}>
          {phase === 'scanning'
            ? 'Hold steady near the reader. Code refreshes every 30 seconds.'
            : phase === 'success'
            ? 'Enjoy your session!'
            : hasPermission 
            ? 'Point the camera at the reception check-in QR code.' 
            : 'Enter the active gym token below and initiate scan.'}
        </Text>

        {/* Input & Action buttons */}
        {phase === 'idle' && (
          <View style={styles.controlBox}>
            <TextInput
              style={styles.tokenInput}
              placeholder="Enter active Gym Token manually"
              placeholderTextColor="#a1a5b7"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => handleStartCheckIn()}
              activeOpacity={0.8}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>Submit Token Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel button */}
        {phase === 'idle' && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  gymHeaderSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a5b7',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  gymHeaderTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f5f6fa',
    marginTop: 4,
    marginBottom: 40,
  },
  scannerWrapper: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 40,
  },
  svgBorder: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  innerContent: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#a1a5b7',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 32,
  },
  controlBox: {
    width: '100%',
    gap: 12,
  },
  tokenInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#f5f6fa',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBtn: {
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
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a1a5b7',
  },
});
