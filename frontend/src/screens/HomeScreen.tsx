import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS, SHADOWS } from '../theme/tokens';
import { LogOut, Calendar, QrCode, CreditCard, ChevronRight, Award, Clock } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function HomeScreen({ navigation }: any) {
  const { user, subscription, loadSubscription, signOut, loading } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
    fetchCheckInHistory();
  }, []);

  const fetchCheckInHistory = async () => {
    try {
      setHistLoading(true);
      const res = await apiClient.get('/attendance/history');
      if (res.data && res.data.success) {
        setHistory(res.data.data.slice(0, 3)); // show last 3 check-ins
      }
    } catch {
      // Degrade gracefully if profile history endpoint differs
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerUser}>{user?.email?.split('@')[0]}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
            <LogOut size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* Subscription Status Card */}
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : subscription && subscription.status === 'active' ? (
            <View style={[styles.card, styles.activeCard]}>
              <View style={styles.cardHeader}>
                <Award size={20} color={COLORS.success} />
                <Text style={styles.cardStatusLabel}>ACTIVE MEMBER</Text>
              </View>
              <Text style={styles.planName}>{subscription.plans?.name || 'Standard Membership'}</Text>
              <Text style={styles.planPrice}>
                ₹{subscription.plans?.price} <Text style={styles.planInterval}>/ {subscription.plans?.durationDays || 30} Days</Text>
              </Text>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expires On:</Text>
                <Text style={styles.detailValue}>{formatDate(subscription.end_date)}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.card, styles.inactiveCard]}>
              <Text style={styles.cardStatusLabel}>NO ACTIVE PLAN</Text>
              <Text style={styles.inactiveTitle}>Ready to begin your training?</Text>
              <Text style={styles.inactiveDesc}>
                Unlock full gym access, premium trainers, and tracking tools by selecting a membership plan.
              </Text>

              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => navigation.navigate('Plans')}
              >
                <CreditCard size={18} color={COLORS.surface} style={styles.btnIcon} />
                <Text style={styles.subscribeButtonText}>Choose a Plan</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions Panel */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('QRCheckIn')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                <QrCode size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.actionName}>QR Check-in</Text>
                <Text style={styles.actionDesc}>Scan gym code to log entry</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Progress')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#E0F2FE' }]}>
                <Calendar size={20} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.actionName}>Progress Logbook</Text>
                <Text style={styles.actionDesc}>Log weight, water, and protein</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Check-In History */}
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <View style={styles.card}>
            {histLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : history.length > 0 ? (
              history.map((h: any, idx: number) => (
                <View key={h.id || idx} style={styles.historyRow}>
                  <Clock size={16} color={COLORS.textSecondary} style={styles.histIcon} />
                  <View>
                    <Text style={styles.historyDate}>{formatDate(h.attendance_date)}</Text>
                    <Text style={styles.historyMethod}>Via {h.method?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.historyStatus}>Success</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No workout logs recorded this week.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  headerUser: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
  },
  loader: {
    marginVertical: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.success,
  },
  inactiveCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.danger,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardStatusLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginLeft: 6,
    letterSpacing: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  planPrice: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  planInterval: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  inactiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  inactiveDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  subscribeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  btnIcon: {
    marginRight: 8,
  },
  subscribeButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 28,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    padding: 10,
    borderRadius: 8,
    marginRight: 14,
  },
  actionName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  actionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  histIcon: {
    marginRight: 10,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  historyMethod: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  historyStatus: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
