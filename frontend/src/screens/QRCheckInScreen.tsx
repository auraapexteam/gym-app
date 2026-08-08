import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Camera } from 'react-native-camera-kit';
import { apiClient } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { QrCode, Check, Building2, CreditCard, Lock } from 'lucide-react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function QRCheckInScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { userProfile, subscription } = useAuthStore();

  const isLinked = !!userProfile?.gym_id;
  const isSubscribed = subscription && subscription.status === 'active';

  const [token, setToken] = useState('');
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
      } catch {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Animated.Value refs are stable by design
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
        const response = await apiClient.post('/attendance/check-in', {
          token: activeToken.trim(),
        });

        if (response.data && response.data.success) {
          setPhase('success');
          // Autohide success screen and navigate back
          setTimeout(() => {
            navigation.navigate('MainTabs', { screen: 'HomeTab' });
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

  if (!isLinked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockContainer}>
          <View style={[styles.lockIconBadge, { backgroundColor: colors.primarySoft }]}>
            <Building2 size={44} color={colors.primary} />
          </View>
          <Text style={styles.lockTitle}>No Gym Linked</Text>
          <Text style={styles.lockSubtitle}>
            You haven't joined a gym yet. Browse available fitness centers and join one to unlock reception QR check-ins.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.lockBtn}
            onPress={() => navigation.navigate('GymDirectory')}
          >
            <Building2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.lockBtnText}>Browse & Join a Gym</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSubscribed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockContainer}>
          <View style={[styles.lockIconBadge, { backgroundColor: colors.primarySoft }]}>
            <CreditCard size={44} color={colors.primary} />
          </View>
          <Text style={styles.lockTitle}>Membership Plan Required</Text>
          <Text style={styles.lockSubtitle}>
            Select and activate a membership plan to unlock your digital QR check-in pass and reception camera scanner.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.lockBtn}
            onPress={() => navigation.navigate('PlansTab')}
          >
            <CreditCard size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.lockBtnText}>View Membership Plans</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated foreground ring */}
            {phase === 'scanning' && (
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={colors.primary}
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
              <QrCode size={90} color={colors.mutedForeground} strokeWidth={1.5} />
            ) : null}

            {phase === 'scanning' && (
              <Animated.View style={{ transform: [{ rotate: spinAngle }] }}>
                <QrCode size={90} color={colors.primary} strokeWidth={1.8} />
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
              placeholderTextColor={colors.mutedForeground}
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

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  gymHeaderTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.foreground,
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
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  helperText: {
    fontSize: 14,
    color: colors.mutedForeground,
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
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
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
    color: colors.mutedForeground,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  lockIconBadge: {
    width: 88,
    height: 88,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.foreground,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
    marginBottom: 28,
  },
  lockBtn: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 50,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  lockBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
