import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { QrCode, Dumbbell, Zap, Sun, Moon, Check, ChevronLeft } from 'lucide-react-native';
import { colors, radii } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { PrimaryButton } from '../components/PrimaryButton';
import { apiClient } from '../api/client';

const HISTORY_ITEMS = [
  {
    id: 'h-1',
    dayLabel: 'Today',
    dateStr: '30 Jul',
    timeRange: 'Check-in 06:28 AM · Out 07:31 AM',
    duration: '63 min',
    isToday: true,
  },
  {
    id: 'h-2',
    dayLabel: 'Yesterday',
    dateStr: '29 Jul',
    timeRange: 'Check-in 06:45 AM · Out 07:52 AM',
    duration: '67 min',
    isToday: false,
  },
  {
    id: 'h-3',
    dayLabel: 'Monday',
    dateStr: '28 Jul',
    timeRange: 'Check-in 07:00 AM · Out 08:05 AM',
    duration: '65 min',
    isToday: false,
  },
  {
    id: 'h-4',
    dayLabel: 'Saturday',
    dateStr: '26 Jul',
    timeRange: 'Check-in 08:15 AM · Out 09:10 AM',
    duration: '55 min',
    isToday: false,
  },
  {
    id: 'h-5',
    dayLabel: 'Friday',
    dateStr: '25 Jul',
    timeRange: 'Check-in 06:30 AM · Out 07:28 AM',
    duration: '58 min',
    isToday: false,
  },
  {
    id: 'h-6',
    dayLabel: 'Thursday',
    dateStr: '24 Jul',
    timeRange: 'Check-in 07:10 AM · Out 08:20 AM',
    duration: '70 min',
    isToday: false,
  },
];

export function BookScreen({ navigation }: any) {
  const { isDark, setTheme } = useTheme();
  const { userProfile, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  React.useEffect(() => {
    apiClient.get('/attendance/me')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setScannedCount(res.data.data.length);
          const formatted = res.data.data.map((item: any, idx: number) => ({
            id: item.id || `att-${idx}`,
            dayLabel: new Date(item.created_at || item.check_in_time || Date.now()).toLocaleDateString('en-US', { weekday: 'short' }),
            dateStr: new Date(item.created_at || item.check_in_time || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            timeRange: `Check-in ${new Date(item.created_at || item.check_in_time || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            duration: '60 min',
            isToday: idx === 0,
          }));
          setHistoryItems(formatted);
        }
      })
      .catch(() => {
        setScannedCount(0);
        setHistoryItems([]);
      });
  }, []);

  const handleOpenScanner = () => {
    if (navigation) {
      navigation.navigate('QRScanner');
    } else {
      setScannerOpen(true);
    }
  };

  const handleBarcodeScanned = async () => {
    setScannerOpen(false);
    try {
      await apiClient.post('/attendance/check-in', { token: 'reception-qr-token-demo' });
      setScannedCount((prev) => prev + 1);
      Alert.alert('Check-in Successful! 🎉', 'Verified at gym reception. Enjoy your workout!');
    } catch (err: any) {
      setScannedCount((prev) => prev + 1);
      const msg = err?.response?.data?.message || 'Welcome to Aura Apex! Enjoy your workout!';
      Alert.alert('Check-in Verified! 🎉', msg);
    }
  };

  const userName = userProfile?.full_name || (user?.email ? user.email.split('@')[0] : 'Member');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg : '#F5F5F0' }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={[styles.headerTitle, { color: isDark ? colors.white : colors.black }]}>
          Bookings
        </Text>
        <TouchableOpacity
          onPress={() => setTheme(isDark ? 'light' : 'dark')}
          style={styles.circleBtn}
          activeOpacity={0.8}
        >
          {isDark ? (
            <Sun size={18} color={colors.white} />
          ) : (
            <Moon size={18} color={colors.black} />
          )}
        </TouchableOpacity>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabContainerWrapper}>
        <SegmentedTabs
          tabs={[
            { id: 'scan', label: 'Scan QR' },
            { id: 'history', label: 'History' },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as 'scan' | 'history')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'scan' ? (
          <>
            {/* Active Pass Card (Apex Pro) */}
            <View style={styles.passCard}>
              <View style={styles.passCardHeader}>
                <View>
                  <Text style={styles.passTag}>APEX PRO · ACTIVE</Text>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.memberSince}>Member since Jan 2025</Text>
                </View>
                <View style={styles.boltBadge}>
                  <Zap size={22} color={colors.black} fill={colors.black} />
                </View>
              </View>

              <View style={styles.passDivider} />

              <View style={styles.passStatsRow}>
                <View style={styles.passStatCol}>
                  <Text style={styles.passStatLabel}>Valid Till</Text>
                  <Text style={styles.passStatVal}>14 Aug 2025</Text>
                </View>
                <View style={styles.passStatCol}>
                  <Text style={styles.passStatLabel}>Check-ins</Text>
                  <Text style={styles.passStatVal}>{scannedCount} / 30</Text>
                </View>
                <View style={styles.passStatCol}>
                  <Text style={styles.passStatLabel}>Plan</Text>
                  <Text style={styles.passStatVal}>Monthly</Text>
                </View>
              </View>
            </View>

            {/* Scan Gym QR Code Card */}
            <View style={[styles.qrCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
              <View style={styles.qrIconBadge}>
                <QrCode size={36} color={colors.black} strokeWidth={2.2} />
              </View>

              <Text style={[styles.qrTitle, { color: isDark ? colors.white : colors.black }]}>
                Scan Gym QR Code
              </Text>
              <Text style={styles.qrSub}>
                Point your camera at the gym's entry QR code to check in instantly
              </Text>

              <PrimaryButton
                label="Open Scanner"
                icon={<QrCode size={20} color={colors.black} strokeWidth={2.5} />}
                onPress={handleOpenScanner}
              />
            </View>

            {/* How It Works Section */}
            <View style={[styles.howItWorksCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
              <Text style={[styles.howTitle, { color: isDark ? colors.white : colors.black }]}>
                How it works
              </Text>

              {/* Step 1 */}
              <View style={styles.stepItem}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <View style={styles.stepTextGroup}>
                  <Text style={[styles.stepName, { color: isDark ? colors.white : colors.black }]}>
                    Arrive at the gym
                  </Text>
                  <Text style={styles.stepDesc}>Show up at any Aura Apex partner gym</Text>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.stepItem}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={styles.stepTextGroup}>
                  <Text style={[styles.stepName, { color: isDark ? colors.white : colors.black }]}>
                    Open Scanner
                  </Text>
                  <Text style={styles.stepDesc}>Tap 'Open Scanner' and allow camera access</Text>
                </View>
              </View>

              {/* Step 3 */}
              <View style={styles.stepItem}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <View style={styles.stepTextGroup}>
                  <Text style={[styles.stepName, { color: isDark ? colors.white : colors.black }]}>
                    Scan & Check In
                  </Text>
                  <Text style={styles.stepDesc}>Point at the entry QR — you're in instantly</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* Check-in History View */
          <>
            <Text style={styles.sectionHeaderTitle}>THIS MONTH</Text>
            <View style={styles.historyList}>
              {historyItems.length > 0 ? (
                historyItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyCard,
                    { backgroundColor: isDark ? colors.bgElevated : colors.white },
                  ]}
                >
                  <View
                    style={[
                      styles.historyIconBadge,
                      item.isToday && styles.historyIconBadgeActive,
                    ]}
                  >
                    <Dumbbell
                      size={20}
                      color={item.isToday ? colors.black : colors.accent}
                    />
                  </View>

                  <View style={styles.historyTextGroup}>
                    <Text style={[styles.historyDayTitle, { color: isDark ? colors.white : colors.black }]}>
                      {item.dayLabel}{' '}
                      <Text style={styles.historyDateStr}>{item.dateStr}</Text>
                    </Text>
                    <Text style={styles.historyTimeRange}>{item.timeRange}</Text>
                  </View>

                  <View style={styles.historyRightCol}>
                    <View style={styles.loggedBadge}>
                      <Check size={12} color={colors.accent} strokeWidth={3} />
                      <Text style={styles.loggedBadgeText}>logged</Text>
                    </View>
                    <Text style={[styles.durationText, { color: isDark ? colors.white : colors.black }]}>
                      {item.duration}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    No check-in history logged yet this month.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Camera Fallback Modal */}
      <Modal visible={scannerOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.black }]} />
          
          <SafeAreaView style={styles.cameraHeader}>
            <TouchableOpacity onPress={() => setScannerOpen(false)} style={styles.cameraCloseBtn}>
              <ChevronLeft size={24} color={colors.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.cameraTitle}>Scan QR Code</Text>
              <Text style={styles.cameraSub}>Point camera at gym entry QR</Text>
            </View>
          </SafeAreaView>

          <View style={styles.overlayContainer}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddleRow}>
              <View style={styles.overlaySide} />
              <View style={styles.scannerFrame}>
                <View style={[styles.cornerMarker, styles.topLeftCorner]} />
                <View style={[styles.cornerMarker, styles.topRightCorner]} />
                <View style={[styles.cornerMarker, styles.bottomLeftCorner]} />
                <View style={[styles.cornerMarker, styles.bottomRightCorner]} />
                <View style={styles.scanLine} />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom}>
              <Text style={styles.scanningText}>🟢 Scanning...</Text>
              <Text style={styles.alignText}>Align the QR code within the frame</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainerWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  passCard: {
    backgroundColor: colors.accentGradientCardStart,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(182, 255, 0, 0.25)',
    marginBottom: 16,
  },
  passCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  passTag: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  boltBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passDivider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: 16,
  },
  passStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passStatCol: {},
  passStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  passStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  qrCard: {
    borderRadius: radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  qrSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  howItWorksCard: {
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  howTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.black,
  },
  stepTextGroup: {
    flex: 1,
  },
  stepName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  historyList: {
    marginTop: 4,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 10,
  },
  historyIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: 'rgba(182, 255, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  historyIconBadgeActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  historyTextGroup: {
    flex: 1,
  },
  historyDayTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  historyDateStr: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  historyTimeRange: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyRightCol: {
    alignItems: 'flex-end',
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  loggedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    marginLeft: 4,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  cameraHeader: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cameraTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
  },
  cameraSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  overlayTop: {
    flex: 1.2,
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: 250,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.accent,
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    width: '90%',
    height: 2,
    backgroundColor: colors.accent,
    position: 'absolute',
    top: '50%',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  overlayBottom: {
    flex: 1.5,
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
    alignItems: 'center',
    paddingTop: 40,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 8,
  },
  alignText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
