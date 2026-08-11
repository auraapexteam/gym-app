import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../theme/Theme';
import { useTheme } from '../context/ThemeContext';
import { AppButton } from '../components/AppButton';
import { apiClient } from '../api/client';

interface DashboardStats {
  activeMembers: number | null;
  todayCheckIns: number | null;
  monthlyRevenue: number | null;
}

export function OwnerDashboardScreen() {
  const { userProfile, signOut } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/analytics/dashboard');
        if (cancelled) return;
        if (res.data?.success) {
          const d = res.data.data || {};
          setStats({
            activeMembers: d.members?.active ?? d.members?.total ?? null,
            todayCheckIns: d.attendance?.today ?? null,
            monthlyRevenue: d.revenue?.thisMonth ?? d.revenue?.total ?? null,
          });
          setStatsError(null);
        }
      } catch (err: any) {
        if (cancelled) return;
        // Staff/trainer roles don't have analytics access — that's expected.
        setStatsError(
          err?.response?.status === 403
            ? 'Analytics are available to gym owners on the web portal.'
            : 'Could not load analytics. Manage your gym from the web portal.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatStat = (value: number | null) =>
    value != null ? Number(value).toLocaleString('en-IN') : '—';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>SaaS Console</Text>
        <Text style={styles.title}>Gym Owner Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {userProfile?.full_name || 'there'}</Text>
        <View style={styles.roleBadgeContainer}>
          <Text style={styles.roleBadge}>Role: {userProfile?.role?.toUpperCase() || '—'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gym Analytics</Text>

        <View style={styles.divider} />

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : statsError ? (
          <Text style={styles.errorText}>{statsError}</Text>
        ) : (
          <>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>👥 Active Members</Text>
              <Text style={styles.metricValue}>{formatStat(stats?.activeMembers ?? null)}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>✅ Today's Check-ins</Text>
              <Text style={styles.metricValue}>{formatStat(stats?.todayCheckIns ?? null)}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>💰 Monthly Revenue</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {stats?.monthlyRevenue != null ? `₹${Number(stats.monthlyRevenue).toLocaleString('en-IN')}` : '—'}
              </Text>
            </View>
          </>
        )}

        <View style={styles.divider} />
        <Text style={styles.portalHint}>
          Full management tools (members, plans, QR, staff) live in the Aura Apex web portal.
        </Text>
      </View>

      <View style={styles.footer}>
        <AppButton variant="destructive" size="md" fullWidth={true} onPress={signOut}>
          Sign Out
        </AppButton>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 6,
  },
  roleBadgeContainer: {
    marginTop: 12,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.radius.round,
  },
  roleBadge: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: Theme.radius.lg,
    ...Theme.shadow.lift,
    marginHorizontal: 24,
    marginVertical: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  loaderRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 19,
    paddingVertical: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  portalHint: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
