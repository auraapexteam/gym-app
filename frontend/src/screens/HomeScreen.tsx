import React, { useCallback, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { useGymStore } from '../store/useGymStore';
import { ProgressRing } from '../components/ProgressRing';
import { StatMiniCard } from '../components/StatMiniCard';
import { GymCard } from '../components/GymCard';
import {
  Bell,
  Sun,
  Moon,
  Heart,
  Droplet,
  Flame,
  Play,
  Zap,
} from 'lucide-react-native';
import { apiClient } from '../api/client';

export function HomeScreen({ navigation }: any) {
  const { isDark, setTheme } = useTheme();
  const { userProfile, loadSubscription, user, subscription } = useAuthStore();
  const { fetchMyRequestStatus, directory, fetchDirectory, myRequest } = useGymStore();

  const [refreshing, setRefreshing] = useState(false);
  const [proteinVal, setProteinVal] = useState(0);
  const [stepsVal, setStepsVal] = useState(0);
  const [waterVal, setWaterVal] = useState(0);
  const [burnedVal, setBurnedVal] = useState(0);
  const [streakVal, setStreakVal] = useState(0);

  const isRegisteredToGym = !!userProfile?.gym_id || myRequest?.status === 'approved' || subscription?.status === 'active';
  const planName = subscription?.plan?.name || (myRequest?.gyms as any)?.name || 'Active Gym Membership';
  const planPrice = subscription?.plan?.price ? `₹${subscription.plan.price}` : 'Active';
  const endDateStr = subscription?.end_date || subscription?.endDate;
  const remainingDays = endDateStr
    ? Math.max(0, Math.ceil((new Date(endDateStr).getTime() - Date.now()) / (1000 * 3600 * 24)))
    : null;

  const handleToggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const refreshDashboard = useCallback(() => {
    loadSubscription();
    fetchMyRequestStatus();
    fetchDirectory();

    apiClient.get('/attendance/me')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setStreakVal(res.data.data.length);
        }
      })
      .catch(() => setStreakVal(0));
  }, [loadSubscription, fetchMyRequestStatus, fetchDirectory]);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [refreshDashboard])
  );

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshDashboard();
    setTimeout(() => setRefreshing(false), 600);
  }, [refreshDashboard]);

  const userName = userProfile?.full_name || (user?.email ? user.email.split('@')[0] : 'Member');

  const proteinPct = Math.min(100, Math.round((proteinVal / 180) * 100));
  const stepsPct = Math.min(100, Math.round((stepsVal / 10000) * 100));
  const streakPct = Math.min(100, Math.round((streakVal / 7) * 100));

  const nearbyGymsList = useMemo(() => {
    if (directory && directory.length > 0) {
      return directory.map((g) => ({
        id: g.id,
        name: g.name,
        rating: 4.8,
        distance: '0.8 km',
        monthlyPrice: 999,
        imageUrl: g.logoUrl || undefined,
        isOpen: g.status === 'active',
      }));
    }
    return [];
  }, [directory]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.bg : '#F5F5F0' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
          }}
          style={styles.heroBackground}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />
          <SafeAreaView style={styles.heroSafeArea}>
            <View style={styles.heroHeaderRow}>
              <View>
                <Text style={styles.greetingText}>Good morning 👋</Text>
                <Text style={styles.userNameText}>{userName}</Text>
              </View>

              <View style={styles.topActionsCluster}>
                <TouchableOpacity
                  onPress={handleToggleTheme}
                  style={styles.iconCircleBtn}
                  activeOpacity={0.8}
                >
                  {isDark ? (
                    <Sun size={18} color={colors.white} />
                  ) : (
                    <Moon size={18} color={colors.black} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={styles.iconCircleBtn}
                  activeOpacity={0.8}
                >
                  <Bell size={18} color={colors.white} />
                  <View style={styles.notificationDot} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ProfileTab')}
                  style={styles.avatarBorderRing}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarLetter}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.bodyPadding}>
          <View style={styles.todayBadgePill}>
            <Text style={styles.todayBadgeText}>TODAY</Text>
          </View>

          <View
            style={[
              styles.dailyActivityCard,
              { backgroundColor: isDark ? colors.bgElevated : colors.white },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardHeaderTitle, { color: isDark ? colors.white : colors.black }]}>
                Daily Activity
              </Text>
              <Text style={styles.streakAmberText}>🔥 {streakVal}-day streak</Text>
            </View>

            <View style={styles.ringsRow}>
              <ProgressRing
                percentage={proteinPct}
                color={colors.accent}
                size={84}
                strokeWidth={7}
                centerText={`${proteinPct}%`}
                subLabel={`${proteinVal}g protein`}
              />
              <ProgressRing
                percentage={stepsPct}
                color="#06B6D4"
                size={84}
                strokeWidth={7}
                centerText={`${stepsPct}%`}
                subLabel={`${stepsVal.toLocaleString()} steps`}
              />
              <ProgressRing
                percentage={streakPct}
                color="#F59E0B"
                size={84}
                strokeWidth={7}
                centerText={`${streakPct}%`}
                subLabel={`${streakVal} streak`}
              />
            </View>
          </View>

          <View style={styles.miniCardsRow}>
            <StatMiniCard
              icon={<Heart size={16} color={colors.danger} fill={colors.danger} />}
              iconBgColor={colors.dangerBg}
              value="-- bpm"
              label="Heart"
            />
            <View style={{ width: 10 }} />
            <StatMiniCard
              icon={<Droplet size={16} color={colors.accent} fill={colors.accent} />}
              iconBgColor={colors.accentDim}
              value={`${waterVal.toFixed(1)} L`}
              label="Water"
            />
            <View style={{ width: 10 }} />
            <StatMiniCard
              icon={<Flame size={16} color="#F97316" fill="#F97316" />}
              iconBgColor="rgba(249, 115, 22, 0.12)"
              value={`${burnedVal}`}
              label="Burned"
            />
          </View>

          {isRegisteredToGym ? (
            <View style={styles.apexPromoCard}>
              <View style={styles.promoTopRow}>
                <View>
                  <View style={styles.apexProTag}>
                    <Zap size={12} color={colors.accent} fill={colors.accent} />
                    <Text style={styles.apexProTagText}>MY GYM MEMBERSHIP</Text>
                  </View>
                  <Text style={styles.promoTitle}>{planName}</Text>
                </View>
                <View style={styles.priceColumn}>
                  <Text style={styles.priceBig}>{planPrice}</Text>
                  {subscription?.plan?.price ? <Text style={styles.priceSub}>/month</Text> : null}
                </View>
              </View>

              {remainingDays !== null ? (
                <Text style={styles.promoSubtext}>
                  Valid Membership · {remainingDays} {remainingDays === 1 ? 'day' : 'days'} remaining
                </Text>
              ) : (
                <Text style={styles.promoSubtext}>
                  Active Gym Registration
                </Text>
              )}

              <View style={styles.promoTagsRow}>
                <View style={styles.outlinedTagPill}>
                  <Text style={styles.outlinedTagText}>Active Member</Text>
                </View>
                <View style={styles.outlinedTagPill}>
                  <Text style={styles.outlinedTagText}>QR Access Enabled</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* 5. Nearby Gyms Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitleText, { color: isDark ? colors.white : colors.black }]}>
              📍 Nearby Gyms
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')}>
              <Text style={styles.seeAllLink}>See all {'>'}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={nearbyGymsList}
            renderItem={({ item }) => (
              <GymCard
                gym={item}
                variant="horizontal"
                onPress={() => navigation.navigate('GymInfo', { gym: item })}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalGymList}
          />

          {/* 6. Today's Workout Card */}
          <Text style={[styles.sectionTitleText, { color: isDark ? colors.white : colors.black, marginTop: 24, marginBottom: 12 }]}>
            Today's Workout
          </Text>

          <View style={styles.workoutCard}>
            <View style={styles.workoutLeft}>
              <View style={styles.pushDayTag}>
                <Text style={styles.pushDayTagText}>PUSH DAY</Text>
              </View>
              <Text style={styles.workoutTitle}>Chest + Triceps</Text>
              <Text style={styles.workoutMeta}>
                8 exercises · 55 min · 420 kcal
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.playButtonCircle}
            >
              <Play size={22} color={colors.black} fill={colors.black} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroBackground: {
    width: '100%',
    height: 220,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 10, 10, 0.55)',
  },
  heroSafeArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  greetingText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  userNameText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  topActionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  avatarBorderRing: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 2,
    marginLeft: 8,
  },
  avatarInner: {
    flex: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  todayBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginBottom: 10,
    marginTop: 4,
  },
  todayBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bodyPadding: {
    paddingHorizontal: 20,
    marginTop: -16,
  },
  dailyActivityCard: {
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  streakAmberText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  miniCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  apexPromoCard: {
    backgroundColor: colors.accentGradientCardStart,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(182, 255, 0, 0.25)',
    marginBottom: 24,
  },
  promoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  apexProTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  apexProTagText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 4,
  },
  promoTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceBig: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
  },
  priceSub: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  promoSubtext: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 14,
  },
  promoTagsRow: {
    flexDirection: 'row',
  },
  outlinedTagPill: {
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginRight: 8,
  },
  outlinedTagText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '900',
  },
  seeAllLink: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  horizontalGymList: {
    paddingRight: 10,
  },
  workoutCard: {
    backgroundColor: colors.accentGradientCardStart,
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(182, 255, 0, 0.25)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutLeft: {
    flex: 1,
  },
  pushDayTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginBottom: 6,
  },
  pushDayTagText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  workoutTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  workoutMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  playButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginLeft: 14,
  },
});

