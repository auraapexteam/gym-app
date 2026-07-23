import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../theme/Theme';
import { AppButton } from '../components/AppButton';

export function OwnerDashboardScreen() {
  const { userProfile, signOut } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>SaaS Console</Text>
        <Text style={styles.title}>Gym Owner Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {userProfile?.full_name || 'Admin'}</Text>
        <View style={styles.roleBadgeContainer}>
          <Text style={styles.roleBadge}>Role: {userProfile?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Owner Analytics</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>👥 Active Members</Text>
          <Text style={styles.metricValue}>1,245</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>✅ Today's Check-ins</Text>
          <Text style={styles.metricValue}>312</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>💰 Monthly Revenue</Text>
          <Text style={[styles.metricValue, { color: Theme.colors.primary }]}>₹1,85,000</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton variant="destructive" size="md" fullWidth={true} onPress={signOut}>
          Sign Out
        </AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    marginTop: 6,
  },
  roleBadgeContainer: {
    marginTop: 12,
    backgroundColor: Theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.radius.round,
  },
  roleBadge: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: 20,
    borderRadius: Theme.radius.lg,
    ...Theme.shadow.lift,
    marginHorizontal: 24,
    marginVertical: 40,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 14,
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
    color: Theme.colors.mutedForeground,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
