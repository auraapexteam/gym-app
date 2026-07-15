import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS, SHADOWS } from '../theme/tokens';
import { LogOut, Calendar, QrCode, CreditCard, ChevronRight, Award, Clock, Search, Building2, Send, Bell, BookOpen, Info } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function HomeScreen({ navigation }: any) {
  const { user, userProfile, subscription, loadSubscription, loadUserProfile } = useAuthStore();

  // Gym directory state (when gym_id is null)
  const [gyms, setGyms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinRequest, setJoinRequest] = useState<any>(null);
  const [gymsLoading, setGymsLoading] = useState(false);

  // Dashboard state (when gym_id is set)
  const [history, setHistory] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [recentNotification, setRecentNotification] = useState<any>(null);

  useEffect(() => {
    if (userProfile?.gym_id) {
      loadSubscription();
      fetchCheckInHistory();
      fetchUnreadCount();
      fetchRecentNotification();
    } else {
      fetchGymDirectory();
      fetchJoinRequestStatus();
    }
  }, [userProfile?.gym_id]);

  const fetchGymDirectory = async () => {
    try {
      setGymsLoading(true);
      const res = await apiClient.get('/gyms/directory');
      if (res.data?.success) {
        setGyms(res.data.data.items || res.data.data);
      }
    } catch (err) {
      console.warn('Gym directory load failed:', err);
    } finally {
      setGymsLoading(false);
    }
  };

  const fetchJoinRequestStatus = async () => {
    try {
      const res = await apiClient.get('/gyms/join-request/status');
      if (res.data?.success) {
        setJoinRequest(res.data.data);
      }
    } catch {
      setJoinRequest(null);
    }
  };

  const handleApplyToGym = async (gymId: string, gymName: string) => {
    try {
      setGymsLoading(true);
      const res = await apiClient.post('/gyms/join-request', { gymId });
      if (res.data?.success) {
        Alert.alert('Request Sent', `Your join request to ${gymName} has been submitted. The owner will review it shortly.`);
        fetchJoinRequestStatus();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Could not submit request.';
      Alert.alert('Request Failed', msg);
    } finally {
      setGymsLoading(false);
    }
  };

  const fetchCheckInHistory = async () => {
    try {
      setHistLoading(true);
      const res = await apiClient.get('/attendance/me', {
        params: { limit: 3, page: 1 },
      });
      if (res.data?.success) {
        const list = res.data.data.items || res.data.data || [];
        setHistory(list.slice(0, 3));

        // Check if user checked in today
        const todayStr = new Date().toISOString().slice(0, 10);
        const hasCheckedInToday = list.some(
          (h: any) => new Date(h.attendance_date || h.created_at).toISOString().slice(0, 10) === todayStr
        );
        setTodayCheckedIn(hasCheckedInToday);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.data.count || 0);
      }
    } catch {
      setUnreadCount(0);
    }
  };

  const fetchRecentNotification = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data?.success) {
        const list = res.data.data.items || res.data.data || [];
        if (list.length > 0) {
          setRecentNotification(list[0]);
        }
      }
    } catch {
      setRecentNotification(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  // ─── RENDER: No gym linked yet ────────────────────────────────────────────
  if (!userProfile?.gym_id) {
    const filteredGyms = gyms.filter((g) =>
      (g.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Welcome,</Text>
            <Text style={styles.headerName}>{userProfile?.full_name || user?.email?.split('@')[0]}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => useAuthStore.getState().signOut()}>
            <LogOut size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status card */}
          {joinRequest ? (
            <View style={[styles.card, styles.pendingCard]}>
              <Send size={22} color={COLORS.warning} style={styles.mb8} />
              <Text style={styles.cardTitle}>Request Pending</Text>
              <Text style={styles.cardDesc}>
                Your request to join <Text style={{ fontWeight: 'bold' }}>{joinRequest.gyms?.name || 'the gym'}</Text> is being reviewed.{'\n'}Tap below once the owner has approved you.
              </Text>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={async () => {
                  setGymsLoading(true);
                  await loadUserProfile();
                  await fetchJoinRequestStatus();
                  setGymsLoading(false);
                }}
              >
                {gymsLoading
                  ? <ActivityIndicator color={COLORS.primary} size="small" />
                  : <Text style={styles.outlineBtnText}>Check Approval Status</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, styles.infoCard]}>
              <Building2 size={28} color={COLORS.primary} style={styles.mb8} />
              <Text style={styles.cardTitle}>Connect to a Gym</Text>
              <Text style={styles.cardDesc}>
                Search and select a gym below to send a join request. Once the owner approves, your full dashboard activates.
              </Text>
            </View>
          )}

          {/* Search + directory */}
          {!joinRequest && (
            <>
              <View style={styles.searchRow}>
                <Search size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search gyms by name..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {gymsLoading && gyms.length === 0
                ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
                : (
                  <FlatList
                    data={filteredGyms}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View style={styles.gymRow}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text style={styles.gymName}>{item.name}</Text>
                          {!!item.address && <Text style={styles.gymAddress}>{item.address}</Text>}
                        </View>
                        <TouchableOpacity
                          style={styles.applyBtn}
                          onPress={() => handleApplyToGym(item.id, item.name)}
                        >
                          <Text style={styles.applyBtnText}>Join</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>No gyms found in the directory.</Text>
                    }
                  />
                )
              }
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─── RENDER: Gym linked — full dashboard ──────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Welcome back,</Text>
          <Text style={styles.headerName}>{userProfile?.full_name || user?.email?.split('@')[0]}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={22} color={COLORS.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subscription Card */}
        {subscription && subscription.status === 'active' ? (
          <View style={[styles.card, styles.activeCard]}>
            <View style={styles.cardRow}>
              <Award size={18} color={COLORS.success} />
              <Text style={[styles.cardLabel, { color: COLORS.success, marginLeft: 6 }]}>ACTIVE MEMBER</Text>
            </View>
            <Text style={styles.planName}>{subscription.plans?.name || 'Membership'}</Text>
            <Text style={styles.planPrice}>
              ₹{subscription.plans?.price}
              <Text style={styles.planDur}> / {subscription.plans?.durationDays || 30} days</Text>
            </Text>
            <View style={styles.divider} />
            <View style={styles.cardRow}>
              <Text style={styles.detailLabel}>Expires</Text>
              <Text style={styles.detailValue}>{formatDate(subscription.end_date)}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.inactiveCard]}>
            <Text style={styles.cardLabel}>NO ACTIVE PLAN</Text>
            <Text style={styles.planName}>Start Your Journey</Text>
            <Text style={styles.cardDesc}>Buy a membership plan to unlock full gym access, tracking, and check-ins.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Plans')}>
              <CreditCard size={16} color={COLORS.surface} style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Browse Plans</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Check-In Today Status Banner */}
        <View style={[styles.card, todayCheckedIn ? styles.checkInSuccessCard : styles.checkInPendingCard]}>
          <Text style={[styles.checkInStatusTitle, { color: todayCheckedIn ? COLORS.success : COLORS.warning }]}>
            {todayCheckedIn ? '✓ Checked In Today' : '⚠️ Attendance Required'}
          </Text>
          <Text style={styles.checkInStatusDesc}>
            {todayCheckedIn
              ? 'Your attendance has been logged successfully. Have a great workout session!'
              : 'Remember to check in using the QR code scanner when you arrive at the gym.'}
          </Text>
        </View>

        {/* Recent Notification Preview */}
        {recentNotification && (
          <TouchableOpacity
            style={styles.notificationPreviewCard}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Info size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.notificationPreviewTitle} numberOfLines={1}>
                {recentNotification.title || 'Notification'}
              </Text>
              <Text style={styles.notificationPreviewText} numberOfLines={1}>
                {recentNotification.message}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('QRCheckIn')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <QrCode size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>QR Check-In</Text>
              <Text style={styles.actionSub}>Scan your gym's daily QR code</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Progress')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
              <Calendar size={20} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Progress Logbook</Text>
              <Text style={styles.actionSub}>Log weight, water & protein</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('BeginnerGuide')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
              <BookOpen size={20} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Beginner Guide</Text>
              <Text style={styles.actionSub}>Learn how to use Aura Apex app</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('GymInfo')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Building2 size={20} color={COLORS.warning} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Gym Information</Text>
              <Text style={styles.actionSub}>View timings, address & contact info</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('SubscriptionHistory')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#FAE8FF' }]}>
              <Award size={20} color="#C084FC" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Subscription History</Text>
              <Text style={styles.actionSub}>View past plans & cancellations</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('AttendanceHistory')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
              <Clock size={20} color="#38BDF8" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Attendance History</Text>
              <Text style={styles.actionSub}>View full logged check-in history</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerGreeting: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  headerName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2, textTransform: 'capitalize' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: COLORS.background, position: 'relative' },

  // Notification badge
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  activeCard: { borderLeftWidth: 4, borderLeftColor: COLORS.success },
  inactiveCard: { borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  pendingCard: { borderLeftWidth: 4, borderLeftColor: COLORS.warning, alignItems: 'center' },
  infoCard: { alignItems: 'center' },

  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, textAlign: 'center', marginBottom: 12 },
  planName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  planPrice: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  planDur: { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  detailLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  mb8: { marginBottom: 8 },

  // Check-In Status Banners
  checkInSuccessCard: { borderLeftWidth: 4, borderLeftColor: COLORS.success, backgroundColor: COLORS.success + '0A' },
  checkInPendingCard: { borderLeftWidth: 4, borderLeftColor: COLORS.warning, backgroundColor: COLORS.warning + '0A' },
  checkInStatusTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  checkInStatusDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  // Notification Preview
  notificationPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  notificationPreviewTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  notificationPreviewText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  outlineBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  applyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  applyBtnText: { color: COLORS.surface, fontSize: 12, fontWeight: '700' },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8, marginBottom: 10 },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { padding: 10, borderRadius: 10, marginRight: 14 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  actionSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // History
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  histRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  histDate: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  histMethod: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  histBadge: { fontSize: 16, color: COLORS.success, fontWeight: '700' },

  // Directory
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  gymName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  gymAddress: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Empty
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 14, paddingVertical: 12 },
});
