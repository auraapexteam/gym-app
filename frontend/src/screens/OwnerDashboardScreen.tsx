import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import { COLORS, SHADOWS } from '../theme/tokens';
import { LogOut, Users, CheckCircle, BarChart3, Search, UserPlus, Dumbbell, Bell, X, Check, Clock } from 'lucide-react-native';

type TabKey = 'overview' | 'members' | 'requests' | 'attendance';

export function OwnerDashboardScreen() {
  const { userProfile, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    activeMembers: 0,
    checkInsToday: 0,
    revenueMonth: 0,
  });

  // Members
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance
  const [attendance, setAttendance] = useState<any[]>([]);

  // Join Requests
  const [joinRequests, setJoinRequests] = useState<any[]>([]);

  // Walk-in modal state
  const [walkinModalVisible, setWalkinModalVisible] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinLoading, setWalkinLoading] = useState(false);

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview') {
        const [statsRes, membersRes] = await Promise.allSettled([
          apiClient.get('/attendance/stats').catch(() => null),
          apiClient.get('/members').catch(() => null),
        ]);
        if (statsRes.status === 'fulfilled' && statsRes.value != null && statsRes.value.data?.success) {
          setStats((prev) => ({
            ...prev,
            checkInsToday: statsRes.value!.data.data.today || 0,
          }));
        }
        if (membersRes.status === 'fulfilled' && membersRes.value != null && membersRes.value.data?.success) {
          const items = membersRes.value.data.data.items || membersRes.value.data.data;
          setStats((prev) => ({ ...prev, activeMembers: items.filter((m: any) => m.status === 'active').length }));
        }
      } else if (activeTab === 'members') {
        const res = await apiClient.get('/members');
        if (res.data?.success) {
          setMembers(res.data.data.items || res.data.data);
        }
      } else if (activeTab === 'requests') {
        const res = await apiClient.get('/gyms/join-requests/pending');
        if (res.data?.success) {
          setJoinRequests(res.data.data || []);
        }
      } else if (activeTab === 'attendance') {
        const res = await apiClient.get('/attendance');
        if (res.data?.success) {
          setAttendance(res.data.data.items || res.data.data);
        }
      }
    } catch (err: any) {
      console.warn('Dashboard load error:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (memberId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.post('/attendance/manual', { memberId });
      if (res.data?.success) {
        Alert.alert('Checked In', 'Member checked in successfully.');
        fetchTabData();
      }
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Check-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.patch(`/gyms/join-requests/${requestId}/approve`);
      if (res.data?.success) {
        Alert.alert('Approved', 'Member has been linked to your gym.');
        fetchTabData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to approve.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this join request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiClient.patch(`/gyms/join-requests/${requestId}/reject`);
              fetchTabData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to reject.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddWalkIn = async () => {
    if (!walkinName.trim()) {
      Alert.alert('Required', 'Please enter the member\'s full name.');
      return;
    }
    try {
      setWalkinLoading(true);
      const res = await apiClient.post('/members', { fullName: walkinName.trim() });
      if (res.data?.success) {
        Alert.alert('Created', 'Walk-in member profile created successfully.');
        setWalkinName('');
        setWalkinModalVisible(false);
        setActiveTab('members');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create member.');
    } finally {
      setWalkinLoading(false);
    }
  };

  const filteredMembers = members.filter((m) =>
    (m.fullName || m.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: 'Members' },
    { key: 'requests', label: `Requests${joinRequests.length > 0 ? ` (${joinRequests.length})` : ''}` },
    { key: 'attendance', label: 'Attendance' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AURA APEX</Text>
          <Text style={styles.subtitle}>
            {userProfile?.role?.toUpperCase() || 'OWNER'} · {userProfile?.full_name || userProfile?.email?.split('@')[0]}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <LogOut size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Content */}
      <View style={styles.content}>
        {loading && <ActivityIndicator color={COLORS.primary} style={styles.loadingSpinner} />}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Users size={28} color={COLORS.primary} />
                <Text style={styles.statNumber}>{stats.activeMembers}</Text>
                <Text style={styles.statName}>Active Members</Text>
              </View>
              <View style={styles.statBox}>
                <CheckCircle size={28} color={COLORS.success} />
                <Text style={styles.statNumber}>{stats.checkInsToday}</Text>
                <Text style={styles.statName}>Check-ins Today</Text>
              </View>
              <View style={styles.statBox}>
                <Bell size={28} color={COLORS.warning} />
                <Text style={styles.statNumber}>{joinRequests.length}</Text>
                <Text style={styles.statName}>Pending Requests</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Staff Workflows</Text>

            <TouchableOpacity style={styles.taskCard} onPress={() => setWalkinModalVisible(true)}>
              <UserPlus size={20} color={COLORS.primary} style={styles.taskIcon} />
              <View>
                <Text style={styles.taskTitle}>Add Walk-in Member</Text>
                <Text style={styles.taskDesc}>Create profile and log check-in instantly</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.taskCard} onPress={() => setActiveTab('requests')}>
              <Bell size={20} color={COLORS.warning} style={styles.taskIcon} />
              <View>
                <Text style={styles.taskTitle}>Review Join Requests</Text>
                <Text style={styles.taskDesc}>{joinRequests.length} pending customer approvals</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <View style={styles.listContainer}>
            <View style={styles.searchBar}>
              <Search size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search member directory..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.listRow}>
                  <View>
                    <Text style={styles.rowTitle}>{item.fullName || item.full_name || 'Unknown'}</Text>
                    <Text style={styles.rowSubtitle}>Status: {item.status?.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleManualCheckIn(item.id)}
                  >
                    <Text style={styles.actionBtnText}>Check In</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                !loading ? <Text style={styles.emptyText}>No matching members found.</Text> : null
              }
            />
          </View>
        )}

        {/* JOIN REQUESTS TAB */}
        {activeTab === 'requests' && (
          <FlatList
            data={joinRequests}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.requestRow}>
                <View style={styles.requestInfo}>
                  <Text style={styles.rowTitle}>
                    {item.profiles?.full_name || item.profiles?.email || 'Unknown User'}
                  </Text>
                  <Text style={styles.rowSubtitle}>{item.profiles?.email}</Text>
                  <Text style={styles.requestDate}>
                    Applied: {new Date(item.created_at).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApproveRequest(item.id)}
                  >
                    <Check size={16} color={COLORS.surface} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRejectRequest(item.id)}
                  >
                    <X size={16} color={COLORS.surface} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Clock size={40} color={COLORS.border} />
                  <Text style={styles.emptyText}>No pending join requests.</Text>
                  <Text style={styles.emptySubtext}>New customers requesting to join will appear here.</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <FlatList
            data={attendance}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.listRow}>
                <View>
                  <Text style={styles.rowTitle}>
                    {item.member?.fullName || item.member?.full_name || 'Walk-in'}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {new Date(item.attendance_date || item.created_at).toLocaleDateString('en-IN')} · {item.method?.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.statusText, { color: COLORS.success }]}>✓ LOGGED</Text>
              </View>
            )}
            ListEmptyComponent={
              !loading ? <Text style={styles.emptyText}>No attendance records found.</Text> : null
            }
          />
        )}
      </View>

      {/* Walk-in Modal (cross-platform, no Alert.prompt) */}
      <Modal
        visible={walkinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWalkinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Walk-in Member</Text>
              <TouchableOpacity onPress={() => setWalkinModalVisible(false)}>
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>Enter the member's full name to create their profile.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={COLORS.textSecondary}
              value={walkinName}
              onChangeText={setWalkinName}
              autoFocus
            />
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleAddWalkIn}
              disabled={walkinLoading}
            >
              {walkinLoading ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <Text style={styles.modalBtnText}>Create Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  tabsContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    flexGrow: 0,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingSpinner: {
    marginVertical: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  statName: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  taskIcon: {
    marginRight: 14,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  taskDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  listRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Join request styles
  requestRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
    padding: 10,
    borderRadius: 8,
  },
  rejectBtn: {
    backgroundColor: COLORS.danger,
    padding: 10,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
    backgroundColor: COLORS.background,
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
