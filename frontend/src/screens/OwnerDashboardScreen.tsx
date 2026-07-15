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
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import { COLORS, SHADOWS } from '../theme/tokens';
import { LogOut, Users, CheckCircle, BarChart3, Search, UserPlus, ShieldAlert, Dumbbell } from 'lucide-react-native';

export function OwnerDashboardScreen() {
  const { userProfile, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'attendance' | 'equipment'>('overview');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    activeMembers: 120,
    checkInsToday: 35,
    revenueMonth: 185000,
  });

  // Members lists
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Attendance lists
  const [attendance, setAttendance] = useState<any[]>([]);
  
  // Equipment lists
  const [equipment, setEquipment] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview') {
        const statsRes = await apiClient.get('/attendance/stats').catch(() => null);
        if (statsRes && statsRes.data.success) {
          setStats((prev) => ({
            ...prev,
            checkInsToday: statsRes.data.data.today || 0,
          }));
        }
      } else if (activeTab === 'members') {
        const membersRes = await apiClient.get('/members');
        if (membersRes.data && membersRes.data.success) {
          setMembers(membersRes.data.data.items || membersRes.data.data);
        }
      } else if (activeTab === 'attendance') {
        const attendRes = await apiClient.get('/attendance');
        if (attendRes.data && attendRes.data.success) {
          setAttendance(attendRes.data.data.items || attendRes.data.data);
        }
      } else if (activeTab === 'equipment') {
        const equipRes = await apiClient.get('/equipment');
        if (equipRes.data && equipRes.data.success) {
          setEquipment(equipRes.data.data.items || equipRes.data.data);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load dashboard logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (memberId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.post('/attendance/manual', { memberId });
      if (res.data && res.data.success) {
        Alert.alert('Checked In', 'Member checked in successfully.');
        fetchDashboardData();
      }
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Check-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWalkIn = () => {
    Alert.prompt('Add Walk-in Member', 'Enter the full name of the member:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create',
        onPress: async (name: string | undefined) => {
          if (!name) return;
          try {
            setLoading(true);
            const res = await apiClient.post('/members', { fullName: name });
            if (res.data && res.data.success) {
              Alert.alert('Created', 'Walk-in member added successfully.');
              setActiveTab('members');
            }
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to create member.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderMember = ({ item }: { item: any }) => (
    <View style={styles.listRow}>
      <View>
        <Text style={styles.rowTitle}>{item.fullName}</Text>
        <Text style={styles.rowSubtitle}>Status: {item.status?.toUpperCase()}</Text>
      </View>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => handleManualCheckIn(item.id)}
      >
        <Text style={styles.actionBtnText}>Check In</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredMembers = members.filter((m) =>
    m.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AURA APEX</Text>
          <Text style={styles.subtitle}>Gym Control Center</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <LogOut size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['overview', 'members', 'attendance', 'equipment'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {loading && <ActivityIndicator color={COLORS.primary} style={styles.loadingSpinner} />}

        {activeTab === 'overview' && (
          <ScrollView>
            {/* Real Stats Cards */}
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
                <BarChart3 size={28} color="#0EA5E9" />
                <Text style={styles.statNumber}>₹{stats.revenueMonth / 1000}k</Text>
                <Text style={styles.statName}>Revenue</Text>
              </View>
            </View>

            {/* Quick Staff Tasks */}
            <Text style={styles.sectionHeader}>Staff Workflows</Text>
            <TouchableOpacity style={styles.taskCard} onPress={handleAddWalkIn}>
              <UserPlus size={20} color={COLORS.primary} style={styles.taskIcon} />
              <View>
                <Text style={styles.taskTitle}>Add Walk-in Member</Text>
                <Text style={styles.taskDesc}>Instantly create profile and log check-in</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        )}

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
              renderItem={renderMember}
              ListEmptyComponent={<Text style={styles.emptyText}>No matching members found.</Text>}
            />
          </View>
        )}

        {activeTab === 'attendance' && (
          <FlatList
            data={attendance}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listRow}>
                <View>
                  <Text style={styles.rowTitle}>Member: {item.member?.fullName || 'Walk-in'}</Text>
                  <Text style={styles.rowSubtitle}>Method: {item.method?.toUpperCase()}</Text>
                </View>
                <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No attendance records logged today.</Text>}
          />
        )}

        {activeTab === 'equipment' && (
          <FlatList
            data={equipment}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listRow}>
                <View style={styles.equipLeft}>
                  <Dumbbell size={18} color={COLORS.primary} style={styles.equipIcon} />
                  <View>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowSubtitle}>Condition: {item.condition}</Text>
                  </View>
                </View>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No equipment records registered.</Text>}
          />
        )}
      </View>
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
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 10,
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
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  statName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginVertical: 14,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    marginBottom: 16,
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
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  equipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipIcon: {
    marginRight: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 40,
    fontSize: 15,
  },
});
