import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors, radii } from '../theme/tokens';
import { useAuthStore } from '../store/useAuthStore';
import { useGymStore } from '../store/useGymStore';
import { apiClient } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { uploadPersonalImage } from '../utils/upload';
import {
  User as UserIcon,
  Settings,
  Sun,
  Moon,
  Dumbbell,
  MapPin,
  Trophy,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Target,
  ChevronRight,
  Camera,
} from 'lucide-react-native';

export function ProfileScreen({ navigation }: any) {
  const { userProfile, signOut, loadUserProfile, user } = useAuthStore();
  const { fetchMyRequestStatus, savedGymIds, fetchSavedGyms } = useGymStore();
  const { isDark, setTheme } = useTheme();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [workoutsCount, setWorkoutsCount] = useState(0);
  const [activeDaysCount, setActiveDaysCount] = useState(0);

  useEffect(() => {
    fetchMyRequestStatus();
    fetchSavedGyms();

    // Fetch real total workouts count
    apiClient.get('/workouts/history')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setWorkoutsCount(res.data.data.length);
        }
      })
      .catch(() => setWorkoutsCount(0));

    // Fetch real attendance active days count
    apiClient.get('/attendance/me')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setActiveDaysCount(res.data.data.length);
        }
      })
      .catch(() => setActiveDaysCount(0));
  }, [fetchMyRequestStatus, fetchSavedGyms]);

  const handlePickAvatar = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1200, maxHeight: 1200 });
    if (result.didCancel || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    try {
      setUploadingAvatar(true);
      const publicUrl = await uploadPersonalImage(
        { uri: asset.uri, fileName: asset.fileName, type: asset.type, fileSize: asset.fileSize },
        'avatar'
      );
      const res = await apiClient.patch('/auth/me', { avatarUrl: publicUrl });
      if (res.data?.success) {
        await loadUserProfile();
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err.response?.data?.message || err.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Aura Apex?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const nameDisplay = userProfile?.full_name || (user?.email ? user.email.split('@')[0] : 'Member');
  const emailDisplay = user?.email || userProfile?.email || '';
  const avatarUrl = userProfile?.avatar_url;
  const goalSubtext = (userProfile as any)?.fitness_goal || (userProfile as any)?.fitness_level ? `${(userProfile as any)?.fitness_level || 'Active'} · ${(userProfile as any)?.fitness_goal || 'Custom Goal'}` : 'Set your fitness target';
  const goalPercent = userProfile ? '100%' : '0%';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg : '#F5F5F0' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Bar Header */}
        <View style={styles.topBar}>
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
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.circleBtn}
            activeOpacity={0.8}
          >
            <Settings size={18} color={isDark ? colors.white : colors.black} />
          </TouchableOpacity>
        </View>

        {/* User Hero Section */}
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarGlowContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <UserIcon size={36} color={colors.accent} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Camera size={12} color={colors.black} />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: isDark ? colors.white : colors.black }]}>
              {nameDisplay}
            </Text>
            {emailDisplay ? <Text style={styles.userEmail}>{emailDisplay}</Text> : null}

            {/* Badges Row */}
            <View style={styles.badgeRow}>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>Apex Pro</Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={[styles.streakBadgeText, { color: isDark ? colors.white : colors.black }]}>
                  🔥 {activeDaysCount}-day
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Summary Card (3 columns - Starts from 0) */}
        <View style={[styles.statsCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: isDark ? colors.white : colors.black }]}>
              {workoutsCount}
            </Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: isDark ? colors.white : colors.black }]}>
              {savedGymIds.length}
            </Text>
            <Text style={styles.statLabel}>Gyms</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: isDark ? colors.white : colors.black }]}>
              {activeDaysCount}
            </Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
        </View>

        {/* Fitness Goal Card */}
        <View style={[styles.goalCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
          <View style={styles.goalHeader}>
            <View style={styles.goalLeft}>
              <View style={styles.targetIconCircle}>
                <Target size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.goalTitle, { color: isDark ? colors.white : colors.black }]}>
                  Fitness Goal
                </Text>
                <Text style={styles.goalSub}>{goalSubtext}</Text>
              </View>
            </View>
            <Text style={styles.goalPercent}>{goalPercent}</Text>
          </View>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: goalPercent as any }]} />
          </View>
        </View>

        {/* Dark Mode Toggle Card */}
        <TouchableOpacity
          onPress={() => setTheme(isDark ? 'light' : 'dark')}
          activeOpacity={0.8}
          style={[styles.darkModeCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}
        >
          <View style={styles.darkModeLeft}>
            <View style={styles.darkModeIconCircle}>
              {isDark ? <Moon size={20} color={colors.accent} /> : <Sun size={20} color={colors.accent} />}
            </View>
            <View>
              <Text style={[styles.darkModeTitle, { color: isDark ? colors.white : colors.black }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Text style={styles.darkModeSub}>Tap to switch to {isDark ? 'light' : 'dark'}</Text>
            </View>
          </View>
          <View style={styles.darkModeToggleCircle}>
            {isDark ? <Moon size={16} color={colors.accent} /> : <Sun size={16} color={colors.accent} />}
          </View>
        </TouchableOpacity>

        {/* Menu Cards */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProgressTab')}
            style={[styles.menuCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <Dumbbell size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: isDark ? colors.white : colors.black }]}>My Workouts</Text>
                <Text style={styles.menuSub}>24 this month</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('GymDirectory')}
            style={[styles.menuCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <MapPin size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: isDark ? colors.white : colors.black }]}>Saved Gyms</Text>
                <Text style={styles.menuSub}>5 saved</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ProgressTab')}
            style={[styles.menuCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <Trophy size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: isDark ? colors.white : colors.black }]}>Achievements</Text>
                <Text style={styles.menuSub}>8 of 15</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('SubscriptionHistory')}
            style={[styles.menuCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <CreditCard size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: isDark ? colors.white : colors.black }]}>Membership</Text>
                <Text style={styles.menuSub}>Monthly · Active</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('PrivacySettings')}
            style={[styles.menuCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <ShieldCheck size={18} color={colors.accent} />
              </View>
              <Text style={[styles.menuTitle, { color: isDark ? colors.white : colors.black }]}>Privacy & Security</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('HelpSettings')}
            style={[styles.menuCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <HelpCircle size={18} color={colors.accent} />
              </View>
              <Text style={[styles.menuTitle, { color: isDark ? colors.white : colors.black }]}>Help & Support</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          style={styles.signOutBtn}
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
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
    marginLeft: 10,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarGlowContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginRight: 16,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  proBadge: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.black,
  },
  streakBadge: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.lg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.surfaceBorder,
  },
  goalCard: {
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  goalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goalPercent: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.accent,
  },
  goalTrack: {
    height: 8,
    backgroundColor: colors.surfaceBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  darkModeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  darkModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkModeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  darkModeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  darkModeSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  darkModeToggleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuGroup: {
    marginBottom: 16,
  },
  menuCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 10,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  menuSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radii.xl,
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.danger,
    marginLeft: 10,
  },
});

