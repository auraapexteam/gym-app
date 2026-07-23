import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Polyline, Path, Rect, ClipPath, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../theme/Theme';
import {
  Bell,
  Flame,
  Droplet,
  Beef,
  ArrowUpRight,
  Plus,
  Minus,
} from 'lucide-react-native';

/* ============ Vector Components ============ */

function ProgressRing({ size = 60, stroke = 6, progress = 0.5, color = '#6366f1', label, sublabel }: any) {
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
            stroke="rgba(255, 255, 255, 0.08)"
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
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#f5f6fa' }}>{label}</Text>
          {sublabel && <Text style={{ fontSize: 8, color: '#a1a5b7', fontWeight: '600', marginTop: 1 }}>{sublabel}</Text>}
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
  const { user, subscription, loadSubscription, loading, userProfile } = useAuthStore();

  // Metrics state (Interactive Prototype)
  const [streak, setStreak] = useState(12);
  const [todayWater, setTodayWater] = useState(1500);
  const [todayProtein, setTodayProtein] = useState(95);
  const [todayWeight, setTodayWeight] = useState(72.0);
  
  // Weekly check-in tracker
  const [weekCheckIns, setWeekCheckIns] = useState<string[]>([]);
  const [logModalOpen, setLogModalOpen] = useState(false);

  // Quick log temp states
  const [tempWeight, setTempWeight] = useState('72.0');
  const [tempWater, setTempWater] = useState(1500);
  const [tempProtein, setTempProtein] = useState(95);

  useEffect(() => {
    loadSubscription();
    
    // Seed check-in dates for this week
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10);
    };
    setWeekCheckIns([daysAgo(1), daysAgo(2), daysAgo(4), daysAgo(6)]);
  }, [loadSubscription]);

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

  const openLogSheet = () => {
    setTempWeight(todayWeight.toFixed(1));
    setTempWater(todayWater);
    setTempProtein(todayProtein);
    setLogModalOpen(true);
  };

  const handleSaveLog = () => {
    const wtNum = parseFloat(tempWeight) || todayWeight;
    setTodayWeight(wtNum);
    setTodayWater(tempWater);
    setTodayProtein(tempProtein);
    setLogModalOpen(false);
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
              <Text style={styles.greetText}>GOOD MORNING</Text>
              <Text style={styles.nameText}>
                {userProfile?.full_name ? userProfile.full_name.split(' ')[0] : 'amanmahadik8'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.gymBadge}>
              <Text style={styles.gymBadgeText}>Aura Downtown</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
              style={styles.bellButton}
            >
              <Bell size={16} color="#f5f6fa" />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.focusRow}>
          <Text style={styles.focusLabel}>TODAY'S FOCUS</Text>
          <Text style={styles.focusValue}>Push Day · Chest & Triceps</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Plan / Streak row */}
        <View style={styles.heroGrid}>
          {/* Plan Info Card */}
          <View style={[styles.glassCard, styles.planCard]}>
            <View style={styles.planDetails}>
              <View style={styles.badgeContainer}>
                <Text style={styles.planBadge}>{planName.toUpperCase()} PLAN</Text>
              </View>
              <Text style={styles.planPrice}>
                ₹{subscription?.plans?.price ? subscription.plans.price.toLocaleString() : '2,999'}
                <Text style={styles.planPricePeriod}>/mo</Text>
              </Text>
              <Text style={styles.planDates}>
                {isSubscribed ? 'Active Access' : 'Renew Pending'}
              </Text>
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

        {/* Metrics Row (Weight, Water, Protein) */}
        <View style={styles.metricsGrid}>
          {/* Weight Card */}
          <View style={styles.glassCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Weight</Text>
              <ArrowUpRight size={14} color="#10b981" />
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
          <View style={styles.glassCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Water</Text>
              <Droplet size={14} color="#0d94f8" />
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
          <View style={styles.glassCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Protein</Text>
              <Beef size={14} color="#f87171" />
            </View>
            <Text style={styles.metricValue}>
              {todayProtein}
              <Text style={styles.metricUnit}>g</Text>
            </Text>
            <View style={styles.proteinRingContainer}>
              <ProgressRing size={44} stroke={4} progress={todayProtein / 150} color="#f87171" />
            </View>
          </View>
        </View>

        {/* This Week check-ins calendar layout */}
        <View style={styles.weekSection}>
          <View style={styles.weekHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <Text style={styles.weekCount}>{weekCheckIns.length} check-ins</Text>
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
                    <Minus size={16} color="#f5f6fa" />
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
                    <Minus size={16} color="#f5f6fa" />
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

              {/* Submit Save */}
              <TouchableOpacity
                onPress={handleSaveLog}
                activeOpacity={0.85}
                style={styles.saveLogButton}
              >
                <Text style={styles.saveLogButtonText}>Save log</Text>
              </TouchableOpacity>
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
    backgroundColor: '#0b0f19',
  },
  topBanner: {
    backgroundColor: '#141a2a',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20, // push down below status bar/notch on Android
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366f1',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  headerTitles: {
    justifyContent: 'center',
  },
  greetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a5b7',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  gymBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  gymBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
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
    color: '#a1a5b7',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  bellButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    borderColor: '#141a2a',
  },
  focusRow: {
    marginTop: 20,
    gap: 4,
  },
  focusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a5b7',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  focusValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f5f6fa',
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
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    color: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  planPricePeriod: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a1a5b7',
  },
  planDates: {
    fontSize: 10,
    color: '#a1a5b7',
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
    color: '#f5f6fa',
  },
  streakLabel: {
    fontSize: 10,
    color: '#a1a5b7',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#a1a5b7',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a1a5b7',
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
    color: '#f5f6fa',
  },
  weekCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a5b7',
  },
  weekScroll: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayCard: {
    width: (Dimensions.get('window').width - 40) / 7.6,
    aspectRatio: 0.72,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  weekTodayCard: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  weekDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a5b7',
  },
  weekDayNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  weekDayIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  checkedDot: {
    backgroundColor: '#10b981',
  },
  emptyDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logTodayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 16,
  },
  logTodayLeft: {
    gap: 2,
  },
  logTodayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  logTodayDesc: {
    fontSize: 11,
    color: '#a1a5b7',
    fontWeight: '500',
  },
  logButton: {
    backgroundColor: '#6366f1',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#6366f1',
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

  /* ============ Sheet Styles ============ */
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetBody: {
    backgroundColor: '#141a2a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  sheetClose: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a1a5b7',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
  },
  sheetInputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a1a5b7',
  },
  weightTextInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f5f6fa',
    textAlign: 'right',
    width: 100,
    padding: 0,
  },
  sheetControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 14,
  },
  sheetControlTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a5b7',
    textTransform: 'uppercase',
  },
  sheetControlValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f5f6fa',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveLogButton: {
    backgroundColor: '#6366f1',
    borderRadius: 9999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6366f1',
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
