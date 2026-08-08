import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline, Path, Rect, ClipPath, Defs } from 'react-native-svg';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useGymStore } from '../store/useGymStore';
import { useTheme } from '../context/ThemeContext';
import {
  Bell,
  Flame,
  Droplet,
  Beef,
  ArrowUpRight,
  Plus,
  Minus,
  Building2,
  Clock,
  XCircle,
  CreditCard,
  Footprints,
} from 'lucide-react-native';

/* ============ Vector Components ============ */

function ProgressRing({ size = 60, stroke = 6, progress = 0.5, color = '#6366f1', label, sublabel }: any) {
  const { isDark } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ - progress * circ;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ transform: [{ rotate: '-90deg' }] }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      {label && (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#f5f6fa' : '#14161f' }}>{label}</Text>
          {sublabel && <Text style={{ fontSize: 8, color: isDark ? '#a1a5b7' : '#5b5f70', fontWeight: '600', marginTop: 1 }}>{sublabel}</Text>}
        </View>
      )}
    </View>
  );
}

function Sparkline({ data, color = '#10b981', width = 92, height = 22 }: any) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((val: number, i: number) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <Svg width={width} height={height}>
      <Polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </Svg>
  );
}

function WaterGlass({ value }: { value: number }) {
  const fillHeight = Math.min(26, value * 26);
  const yPos = 32 - fillHeight;
  return (
    <Svg width={28} height={32} viewBox="0 0 28 32">
      <Defs>
        <ClipPath id="glass-clip">
          <Path d="M4 4 L24 4 L22 30 L6 30 Z" />
        </ClipPath>
      </Defs>
      <Path d="M4 4 L24 4 L22 30 L6 30 Z" fill="none" stroke="#0d94f8" strokeWidth={1.5} />
      <Rect
        x={0}
        y={yPos}
        width={28}
        height={fillHeight}
        fill="#0d94f8"
        opacity={0.5}
        clipPath="url(#glass-clip)"
      />
    </Svg>
  );
}

/* ============ Main Screen ============ */

export function HomeScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { subscription, loadSubscription, userProfile } = useAuthStore();
  const { myRequest, fetchMyRequestStatus } = useGymStore();

  const todayIso = new Date().toISOString().slice(0, 10);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }, []);

  // Today's metrics — loaded from the real Logbook (/progress/month), same
  // data ProgressScreen writes to. Defaults only apply until the first log.
  const [todayWater, setTodayWater] = useState(1500);
  const [todayProtein, setTodayProtein] = useState(95);
  const [todayWeight, setTodayWeight] = useState(72.0);
  const [todaySteps, setTodaySteps] = useState(0);

  // Real attendance history, used to derive this week's check-in dots and streak.
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [savingLog, setSavingLog] = useState(false);

  // Quick log temp states
  const [tempWeight, setTempWeight] = useState('72.0');
  const [tempWater, setTempWater] = useState(1500);
  const [tempProtein, setTempProtein] = useState(95);
  const [tempSteps, setTempSteps] = useState(0);

  const fetchTodayMetrics = async () => {
    try {
      const now = new Date();
      const res = await apiClient.get('/progress/month', {
        params: { year: String(now.getFullYear()), month: String(now.getMonth() + 1) },
      });
      if (res.data?.success) {
        const summary = res.data.data;
        const w = summary.weightLogs?.find((l: any) => l.log_date === todayIso)?.weight;
        const wa = summary.waterLogs?.find((l: any) => l.log_date === todayIso)?.amount_ml;
        const p = summary.proteinLogs?.find((l: any) => l.log_date === todayIso)?.amount_g;
        const s = summary.stepsLogs?.find((l: any) => l.log_date === todayIso)?.steps;
        if (w) setTodayWeight(w);
        if (wa) setTodayWater(wa);
        if (p) setTodayProtein(p);
        if (s) setTodaySteps(s);
      }
    } catch (err) {
      console.warn('Failed to load today\'s logbook metrics:', err);
    }
  };

  useEffect(() => {
    loadSubscription();
    fetchMyRequestStatus();
    fetchTodayMetrics();

    const fetchAttendance = async () => {
      try {
        const res = await apiClient.get('/attendance/me');
        if (res.data?.success) {
          const items = res.data.data.items || res.data.data || [];
          setAttendanceDates(
            items.map((i: any) => String(i.attendance_date || i.created_at).slice(0, 10))
          );
        }
      } catch (err) {
        console.warn('Failed to load attendance for dashboard:', err);
      }
    };
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch; store actions are stable
  }, [loadSubscription, fetchMyRequestStatus]);

  const weekCheckIns = attendanceDates;

  // Consecutive-day streak counted backward from today (or yesterday, so a
  // day not yet checked into doesn't immediately zero the streak).
  const streak = useMemo(() => {
    const dateSet = new Set(attendanceDates);
    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    let count = 0;
    let cursor = new Date();
    if (!dateSet.has(toIso(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dateSet.has(toIso(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [attendanceDates]);

  // Real gym-link state — never assume a user is linked/subscribed without checking.
  const gymStatus: 'linked' | 'pending' | 'rejected' | 'none' = userProfile?.gym_id
    ? 'linked'
    : myRequest?.status === 'pending'
    ? 'pending'
    : myRequest?.status === 'rejected'
    ? 'rejected'
    : 'none';

  const gymBadgeLabel =
    gymStatus === 'linked'
      ? myRequest?.gyms?.name || 'My Gym'
      : gymStatus === 'pending'
      ? 'Pending'
      : gymStatus === 'rejected'
      ? 'Declined'
      : 'No Gym';

  // Subscription calculation
  const isSubscribed = subscription && subscription.status === 'active';
  const planName = subscription?.plans?.name || 'Elite';

  const daysLeft = useMemo(() => {
    if (subscription?.current_period_end) {
      const diff = new Date(subscription.current_period_end).getTime() - Date.now();
      return Math.max(1, Math.ceil(diff / 86400000));
    }
    return 21; // Prototype default
  }, [subscription]);

  const progress = 1 - daysLeft / 30;

  // Calendar dates for the week
  const weekDates = useMemo(() => {
    const arr: { date: string; label: string; day: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push({
        date: d.toISOString().slice(0, 10),
        label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
        day: d.getDate(),
      });
    }
    return arr;
  }, []);

  const weekCheckInCount = useMemo(
    () => weekDates.filter((d) => weekCheckIns.includes(d.date)).length,
    [weekDates, weekCheckIns]
  );

  const openLogSheet = () => {
    setTempWeight(todayWeight.toFixed(1));
    setTempWater(todayWater);
    setTempProtein(todayProtein);
    setTempSteps(todaySteps);
    setLogModalOpen(true);
  };

  const handleSaveLog = async () => {
    const wtNum = parseFloat(tempWeight) || todayWeight;
    try {
      setSavingLog(true);
      await Promise.all([
        apiClient.post('/progress/weight', { weight: wtNum, logDate: todayIso }),
        apiClient.post('/progress/water', { amountMl: tempWater, logDate: todayIso }),
        apiClient.post('/progress/protein', { amountG: tempProtein, logDate: todayIso }),
        apiClient.post('/progress/steps', { steps: tempSteps, logDate: todayIso }),
      ]);
      setTodayWeight(wtNum);
      setTodayWater(tempWater);
      setTodayProtein(tempProtein);
      setTodaySteps(tempSteps);
      setLogModalOpen(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save your log.');
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Banner Area */}
      <View style={styles.topBanner}>
        <View style={styles.topRow}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'A'}
              </Text>
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.greetText}>{greeting}</Text>
              <Text style={styles.nameText}>
                {userProfile?.full_name ? userProfile.full_name.split(' ')[0] : 'Athlete'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.gymBadge}>
              <Text style={styles.gymBadgeText} numberOfLines={1}>{gymBadgeLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
              style={styles.bellButton}
            >
              <Bell size={16} color={colors.foreground} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {gymStatus !== 'linked' ? (
          /* Not yet linked to a gym — real state, no fabricated plan data. */
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.onboardCard}
            onPress={() => navigation.navigate('GymDirectory')}
          >
            <View
              style={[
                styles.onboardIconBadge,
                { backgroundColor: gymStatus === 'rejected' ? colors.destructiveSoft : gymStatus === 'pending' ? colors.infoSoft : colors.primarySoft },
              ]}
            >
              {gymStatus === 'pending' ? (
                <Clock size={22} color={colors.info} />
              ) : gymStatus === 'rejected' ? (
                <XCircle size={22} color={colors.destructive} />
              ) : (
                <Building2 size={22} color={colors.primary} />
              )}
            </View>
            <View style={styles.onboardTextGroup}>
              <Text style={styles.onboardTitle}>
                {gymStatus === 'pending'
                  ? 'Request pending'
                  : gymStatus === 'rejected'
                  ? 'Request declined'
                  : 'No gym linked yet'}
              </Text>
              <Text style={styles.onboardDesc}>
                {gymStatus === 'pending'
                  ? `Waiting for ${myRequest?.gyms?.name || 'the gym'} to approve your request.`
                  : gymStatus === 'rejected'
                  ? `${myRequest?.gyms?.name || 'The gym'} declined your request — tap to browse others.`
                  : 'Browse gyms and request to join one to unlock plans & check-ins.'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : !isSubscribed ? (
          /* Linked, but no active plan yet — prompt to purchase instead of showing fake plan data. */
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.onboardCard}
            onPress={() => navigation.navigate('PlansTab')}
          >
            <View style={[styles.onboardIconBadge, { backgroundColor: colors.primarySoft }]}>
              <CreditCard size={22} color={colors.primary} />
            </View>
            <View style={styles.onboardTextGroup}>
              <Text style={styles.onboardTitle}>Choose your plan</Text>
              <Text style={styles.onboardDesc}>
                You're linked to {gymBadgeLabel} — pick a membership plan to unlock your digital check-in pass.
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          /* Active Plan / Streak row */
          <View style={styles.heroGrid}>
            {/* Plan Info Card */}
            <View style={[styles.glassCard, styles.planCard]}>
              <View style={styles.planDetails}>
                <View style={styles.badgeContainer}>
                  <Text style={styles.planBadge}>{planName.toUpperCase()} PLAN</Text>
                </View>
                <Text style={styles.planPrice}>
                  ₹{subscription?.plans?.price ? subscription.plans.price.toLocaleString() : '—'}
                  <Text style={styles.planPricePeriod}>/mo</Text>
                </Text>
                <Text style={styles.planDates}>Active Access</Text>
              </View>
              <ProgressRing size={72} stroke={7} progress={progress} label={`${daysLeft}`} sublabel="Days left" />
            </View>

            {/* Streak Card */}
            <View style={[styles.glassCard, styles.streakCard]}>
              <Flame size={20} color="#fbbf24" style={{ marginBottom: 4 }} />
              <Text style={styles.streakCount}>{streak}</Text>
              <Text style={styles.streakLabel}>Day streak</Text>
            </View>
          </View>
        )}

        {/* Metrics Row (Weight, Water, Protein, Steps) */}
        <View style={styles.metricsGrid}>
          {/* Weight Card */}
          <View style={[styles.glassCard, styles.metricCard]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <ArrowUpRight size={13} color="#10b981" />
              </View>
              <Text style={styles.metricTitle}>Weight</Text>
            </View>
            <Text style={styles.metricValue}>
              {todayWeight.toFixed(1)}
              <Text style={styles.metricUnit}>kg</Text>
            </Text>
            <View style={styles.sparklineContainer}>
              <Sparkline data={[74, 73.6, 73.2, 73, 72.5, 72.2, todayWeight]} color="#10b981" />
            </View>
          </View>

          {/* Water Card */}
          <View style={[styles.glassCard, styles.metricCard]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBadge, { backgroundColor: 'rgba(13, 148, 248, 0.15)' }]}>
                <Droplet size={13} color="#0d94f8" />
              </View>
              <Text style={styles.metricTitle}>Water</Text>
            </View>
            <Text style={styles.metricValue}>
              {(todayWater / 1000).toFixed(1)}
              <Text style={styles.metricUnit}>L</Text>
            </Text>
            <View style={styles.waterContainer}>
              <WaterGlass value={todayWater / 3000} />
            </View>
          </View>

          {/* Protein Card */}
          <View style={[styles.glassCard, styles.metricCard]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBadge, { backgroundColor: 'rgba(248, 113, 113, 0.15)' }]}>
                <Beef size={13} color="#f87171" />
              </View>
              <Text style={styles.metricTitle}>Protein</Text>
            </View>
            <Text style={styles.metricValue}>
              {todayProtein}
              <Text style={styles.metricUnit}>g</Text>
            </Text>
            <View style={styles.proteinRingContainer}>
              <ProgressRing size={44} stroke={4} progress={todayProtein / 150} color="#f87171" />
            </View>
          </View>

          {/* Steps Card */}
          <View style={[styles.glassCard, styles.metricCard]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBadge, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Footprints size={13} color="#fbbf24" />
              </View>
              <Text style={styles.metricTitle}>Steps</Text>
            </View>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
              {todaySteps.toLocaleString()}
            </Text>
            <View style={styles.proteinRingContainer}>
              <ProgressRing size={44} stroke={4} progress={Math.min(1, todaySteps / 10000)} color="#fbbf24" />
            </View>
          </View>
        </View>

        {/* This Week check-ins calendar layout */}
        <View style={styles.weekSection}>
          <View style={styles.weekHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <Text style={styles.weekCount}>{weekCheckInCount} check-ins</Text>
          </View>
          <View style={styles.weekScroll}>
            {weekDates.map((d) => {
              const checked = weekCheckIns.includes(d.date);
              const isToday = d.date === new Date().toISOString().slice(0, 10);
              return (
                <View
                  key={d.date}
                  style={[styles.weekDayCard, isToday && styles.weekTodayCard]}
                >
                  <Text style={styles.weekDayLabel}>{d.label}</Text>
                  <Text style={styles.weekDayNum}>{d.day}</Text>
                  <View style={[styles.weekDayIndicator, checked ? styles.checkedDot : styles.emptyDot]} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Log Action Box */}
        <View style={styles.logTodayWrapper}>
          <View style={styles.logTodayLeft}>
            <Text style={styles.logTodayTitle}>Quick Log</Text>
            <Text style={styles.logTodayDesc}>Water · protein · weight · photo</Text>
          </View>
          <TouchableOpacity
            onPress={openLogSheet}
            activeOpacity={0.8}
            style={styles.logButton}
          >
            <Text style={styles.logButtonText}>+ Log Today</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Quick Log Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={logModalOpen}
        onRequestClose={() => setLogModalOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.dismissOverlay}
            activeOpacity={1}
            onPress={() => setLogModalOpen(false)}
          />
          <View style={styles.sheetBody}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Log today</Text>
              <TouchableOpacity onPress={() => setLogModalOpen(false)}>
                <Text style={styles.sheetClose}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetContent}>
              {/* Weight Slider */}
              <View style={styles.sheetItem}>
                <View style={styles.sheetInputLabelRow}>
                  <Text style={styles.sheetInputTitle}>Weight (kg)</Text>
                  <TextInput
                    value={tempWeight}
                    onChangeText={setTempWeight}
                    keyboardType="decimal-pad"
                    style={styles.weightTextInput}
                  />
                </View>
                {/* Visual Weight graph simulator */}
                <View style={{ height: 26, marginVertical: 8, alignItems: 'center' }}>
                  <Sparkline
                    data={[74, 73.6, 73.2, 73, 72.5, 72.2, parseFloat(tempWeight) || todayWeight]}
                    color="#10b981"
                    width={260}
                    height={26}
                  />
                </View>
              </View>

              {/* Water Adjustment Box */}
              <View style={styles.sheetControlBox}>
                <View>
                  <Text style={styles.sheetControlTitle}>Water</Text>
                  <Text style={styles.sheetControlValue}>{(tempWater / 1000).toFixed(2)} L</Text>
                </View>
                <View style={styles.adjusterRow}>
                  <TouchableOpacity
                    onPress={() => setTempWater(Math.max(0, tempWater - 250))}
                    activeOpacity={0.7}
                    style={styles.adjustButton}
                  >
                    <Minus size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  <WaterGlass value={tempWater / 3000} />
                  <TouchableOpacity
                    onPress={() => setTempWater(tempWater + 250)}
                    activeOpacity={0.7}
                    style={[styles.adjustButton, { backgroundColor: '#0d94f8' }]}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Protein Adjustment Box */}
              <View style={styles.sheetControlBox}>
                <View>
                  <Text style={styles.sheetControlTitle}>Protein</Text>
                  <Text style={styles.sheetControlValue}>{tempProtein} g</Text>
                </View>
                <View style={styles.adjusterRow}>
                  <TouchableOpacity
                    onPress={() => setTempProtein(Math.max(0, tempProtein - 5))}
                    activeOpacity={0.7}
                    style={styles.adjustButton}
                  >
                    <Minus size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  <ProgressRing size={32} stroke={3.5} progress={tempProtein / 150} color="#f87171" />
                  <TouchableOpacity
                    onPress={() => setTempProtein(tempProtein + 5)}
                    activeOpacity={0.7}
                    style={[styles.adjustButton, { backgroundColor: '#f87171' }]}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Steps Adjustment Box */}
              <View style={styles.sheetControlBox}>
                <View>
                  <Text style={styles.sheetControlTitle}>Steps</Text>
                  <Text style={styles.sheetControlValue}>{tempSteps.toLocaleString()}</Text>
                </View>
                <View style={styles.adjusterRow}>
                  <TouchableOpacity
                    onPress={() => setTempSteps(Math.max(0, tempSteps - 500))}
                    activeOpacity={0.7}
                    style={styles.adjustButton}
                  >
                    <Minus size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTempSteps(tempSteps + 500)}
                    activeOpacity={0.7}
                    style={[styles.adjustButton, { backgroundColor: '#fbbf24' }]}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Save */}
              <TouchableOpacity
                onPress={handleSaveLog}
                activeOpacity={0.85}
                disabled={savingLog}
                style={styles.saveLogButton}
              >
                {savingLog ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveLogButtonText}>Save log</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBanner: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20, // push down below status bar/notch on Android
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
  },
  headerTitles: {
    justifyContent: 'center',
  },
  greetText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  gymBadge: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  gymBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gymName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedForeground,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  bellButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f87171',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120, // increased padding to ensure zero overlap with floating tabs
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  onboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  onboardIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  onboardTextGroup: { flex: 1 },
  onboardTitle: { fontSize: 15, fontWeight: '800', color: colors.foreground },
  onboardDesc: { fontSize: 12, color: colors.mutedForeground, marginTop: 3, lineHeight: 17 },
  glassCard: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
  },
  planCard: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planDetails: {
    justifyContent: 'center',
    gap: 4,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  planBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.foreground,
  },
  planPricePeriod: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  planDates: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.foreground,
  },
  streakLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    paddingHorizontal: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: colors.mutedForeground,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.foreground,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  sparklineContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  waterContainer: {
    marginTop: 6,
    alignItems: 'center',
  },
  proteinRingContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  weekSection: {
    marginBottom: 20,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
  },
  weekCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  weekScroll: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayCard: {
    width: (Dimensions.get('window').width - 40) / 7.6,
    aspectRatio: 0.72,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  weekTodayCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  weekDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  weekDayNum: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
  },
  weekDayIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  checkedDot: {
    backgroundColor: colors.success,
  },
  emptyDot: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  },
  logTodayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
  },
  logTodayLeft: {
    gap: 2,
  },
  logTodayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
  },
  logTodayDesc: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  logButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetBody: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
  },
  sheetClose: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  sheetContent: {
    marginTop: 20,
    gap: 16,
  },
  sheetItem: {
    gap: 8,
  },
  sheetInputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
  },
  sheetInputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  weightTextInput: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    textAlign: 'right',
    width: 100,
    padding: 0,
  },
  sheetControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
  },
  sheetControlTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
  },
  sheetControlValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: 2,
  },
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveLogButton: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  saveLogButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
