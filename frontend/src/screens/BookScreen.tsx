import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QrCode, Dumbbell, Zap, Sun, Moon, Check } from 'lucide-react-native';
import { colors, radii } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { PrimaryButton } from '../components/PrimaryButton';
import { apiClient } from '../api/client';

export function BookScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark, setTheme } = useTheme();
  const { userProfile, user, subscription, loadSubscription, loadUserProfile } = useAuthStore();
  
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 8;
  
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [scannedCount, setScannedCount] = useState(0);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  const fetchAttendance = React.useCallback(() => {
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

  React.useEffect(() => {
    fetchAttendance();
    loadSubscription();
    loadUserProfile();
  }, [fetchAttendance, loadSubscription, loadUserProfile]);

  const handleOpenScanner = () => {
    navigation.navigate('QRCheckIn');
  };

  const activeSub = React.useMemo(() => {
    if (!subscription) return null;
    if (Array.isArray(subscription)) {
      return subscription.find((s: any) => s.status === 'active') || null;
    }
    return (subscription as any).status === 'active' ? subscription : null;
  }, [subscription]);

  const isAssociatedWithGym = !!userProfile?.gym_id && !!activeSub;
  const userName = userProfile?.full_name || (user?.email ? user.email.split('@')[0] : 'Member');
  const planName = (activeSub as any)?.plan?.name || (activeSub as any)?.plans?.name || 'Active Plan';
  const endDateStr = (activeSub as any)?.endDate || (activeSub as any)?.end_date;
  const validTill = endDateStr
    ? new Date(endDateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Active';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.bg : '#F5F5F0', paddingTop: topInset }]}>
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
            {/* Active Pass Card (Only rendered when user has active sub & linked gym) */}
            {isAssociatedWithGym ? (
              <View style={styles.passCard}>
                <View style={styles.passCardHeader}>
                  <View>
                    <Text style={styles.passTag}>PARTNER GYM · ACTIVE</Text>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.memberSince}>Aura Apex Member</Text>
                  </View>
                  <View style={styles.boltBadge}>
                    <Zap size={22} color={colors.black} fill={colors.black} />
                  </View>
                </View>

                <View style={styles.passDivider} />

                <View style={styles.passStatsRow}>
                  <View style={styles.passStatCol}>
                    <Text style={styles.passStatLabel}>Valid Till</Text>
                    <Text style={styles.passStatVal}>{validTill}</Text>
                  </View>
                  <View style={styles.passStatCol}>
                    <Text style={styles.passStatLabel}>Check-ins</Text>
                    <Text style={styles.passStatVal}>{scannedCount}</Text>
                  </View>
                  <View style={styles.passStatCol}>
                    <Text style={styles.passStatLabel}>Plan</Text>
                    <Text style={styles.passStatVal} numberOfLines={1}>{planName}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.unlinkedPassCard}>
                <View style={styles.passCardHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.unlinkedTag}>NO ACTIVE GYM MEMBERSHIP</Text>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.unlinkedSub}>
                      Not linked to an active gym package. Select a partner gym to activate check-in access.
                    </Text>
                  </View>
                  <View style={styles.unlinkedIconBadge}>
                    <Dumbbell size={22} color="#9CA3AF" />
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.browseGymBtn}
                  onPress={() => navigation.navigate('ExploreTab')}
                >
                  <Text style={styles.browseGymBtnText}>Browse Partner Gyms</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Scan Gym QR Code Card */}
            <View style={[styles.qrCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
              <View style={styles.qrIconBadge}>
                <QrCode size={36} color={colors.black} strokeWidth={2.2} />
              </View>

              <Text style={[styles.qrTitle, { color: isDark ? colors.white : colors.black }]}>
                Scan Gym QR Code
              </Text>
              <Text style={[styles.qrSub, { color: isDark ? colors.textMuted : '#4B5563' }]}>
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
                  <Text style={[styles.stepDesc, { color: isDark ? colors.textMuted : '#4B5563' }]}>
                    Show up at your registered Aura Apex gym
                  </Text>
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
                  <Text style={[styles.stepDesc, { color: isDark ? colors.textMuted : '#4B5563' }]}>
                    Tap 'Open Scanner' and allow camera access
                  </Text>
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
                  <Text style={[styles.stepDesc, { color: isDark ? colors.textMuted : '#4B5563' }]}>
                    Point at the entry QR — you're in instantly
                  </Text>
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
    </View>
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
  unlinkedPassCard: {
    backgroundColor: '#1C1E24',
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  unlinkedTag: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  unlinkedSub: {
    fontSize: 12.5,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 17,
  },
  unlinkedIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseGymBtn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseGymBtnText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '900',
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
