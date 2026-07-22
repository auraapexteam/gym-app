import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../theme/Theme';
import { AppButton } from '../components/AppButton';

const gymNotices = [
  { id: 1, tag: 'Facility', title: 'Turf area closed for maintenance on Sunday 8am–11am', time: '2h ago', isNew: true },
  { id: 2, tag: 'Events', title: 'Powerlifting workshop RSVP by Friday evening', time: '1d ago', isNew: true },
  { id: 3, tag: 'Store', title: 'New whey protein flavors refilled at the nutrition store', time: '3d ago', isNew: false },
];

export function HomeScreen({ navigation }: any) {
  const { user, subscription, loadSubscription, signOut, loading } = useAuthStore();

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isSubscribed = subscription && subscription.status === 'active';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>{getGreeting()}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {user?.email?.split('@')[0] || 'Athlete'}
          </Text>
        </View>
        <TouchableOpacity style={styles.notifButton} onPress={() => Alert.alert('Notices', 'No new notifications.')}>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Core Loading State */}
        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Active or Inactive Subscription Hero Block */}
            {isSubscribed ? (
              <View style={[styles.subscriptionHero, styles.heroActive]}>
                <View style={styles.campaignHeader}>
                  <Text style={styles.campaignTag}>★ PREMIUM MEMBER</Text>
                  <Text style={styles.campaignDate}>Expires: {formatDate(subscription.current_period_end)}</Text>
                </View>
                <Text style={styles.heroPlanTitle}>
                  {subscription.plans?.name || 'Standard Plan'}
                </Text>
                <Text style={styles.heroPlanDesc}>
                  Access to full gym amenities, premium trainer assists, and lockers.
                </Text>
                
                <View style={styles.divider} />

                <View style={styles.heroDetailRow}>
                  <Text style={styles.heroDetailLabel}>Amount billing:</Text>
                  <Text style={styles.heroDetailValue}>
                    ₹{subscription.plans?.price} / {subscription.plans?.billing_interval}
                  </Text>
                </View>

                <View style={styles.heroDetailRow}>
                  <Text style={styles.heroDetailLabel}>Status:</Text>
                  <Text style={[styles.heroDetailValue, { color: Theme.colors.success }]}>Active</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.subscriptionHero, styles.heroInactive]}>
                <View style={styles.campaignHeader}>
                  <Text style={[styles.campaignTag, { backgroundColor: Theme.colors.destructiveSoft, color: Theme.colors.destructive }]}>
                    ⚠ NO ACTIVE PLAN
                  </Text>
                </View>
                <Text style={styles.heroPlanTitle}>Unlock Premium Access</Text>
                <Text style={styles.heroPlanDesc}>
                  Subscribe to one of our plans to start working out and booking gym check-ins.
                </Text>
                
                <View style={styles.spacer} />
                
                <AppButton
                  variant="primary"
                  size="md"
                  fullWidth={true}
                  onPress={() => navigation.navigate('Plans')}
                >
                  Explore Plans
                </AppButton>
              </View>
            )}

            {/* Quick Stats Grid */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>💪</Text>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={[styles.statValue, { color: isSubscribed ? Theme.colors.success : Theme.colors.destructive }]}>
                  {isSubscribed ? 'Active' : 'Expired'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>📅</Text>
                <Text style={styles.statLabel}>Plan</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {isSubscribed ? subscription.plans?.name?.split(' ')[0] : 'None'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>⏱</Text>
                <Text style={styles.statLabel}>Cycle</Text>
                <Text style={styles.statValue}>
                  {isSubscribed ? subscription.plans?.billing_interval : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Notice Board Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notice Board</Text>
              <TouchableOpacity onPress={() => Alert.alert('Notice Board', 'Showing latest gym announcements.')}>
                <Text style={styles.sectionAction}>See all →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.noticeList}>
              {gymNotices.map((notice) => (
                <View key={notice.id} style={styles.noticeCard}>
                  <View style={styles.noticeCardHeader}>
                    <Text style={styles.noticeTag}>{notice.tag}</Text>
                    <Text style={styles.noticeTime}>{notice.time}</Text>
                  </View>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                </View>
              ))}
            </View>

            {/* Gym Location Map Preview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gym Location</Text>
            </View>
            <View style={styles.mapCard}>
              <View style={styles.mapPinContainer}>
                <Text style={styles.mapPin}>📍</Text>
              </View>
              <View style={styles.mapInfo}>
                <Text style={styles.mapTitle}>Bangalore Main Branch</Text>
                <Text style={styles.mapSubtitle}>Outer Ring Road, Koramangala</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer / Logout */}
      <View style={styles.footer}>
        <AppButton variant="outline" size="md" fullWidth={true} onPress={signOut}>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginTop: 2,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAEBE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIcon: {
    fontSize: 18,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.destructive,
    borderWidth: 1.5,
    borderColor: Theme.colors.surface,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerLoader: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  subscriptionHero: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 20,
    ...Theme.shadow.lift,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  heroActive: {
    borderLeftWidth: 6,
    borderLeftColor: Theme.colors.primary,
  },
  heroInactive: {
    borderLeftWidth: 6,
    borderLeftColor: Theme.colors.destructive,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignTag: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: Theme.colors.primarySoft,
    color: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
  },
  campaignDate: {
    fontSize: 10,
    color: Theme.colors.mutedForeground,
    fontWeight: '600',
  },
  heroPlanTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  heroPlanDesc: {
    fontSize: 12,
    color: Theme.colors.mutedForeground,
    lineHeight: 18,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 14,
  },
  heroDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroDetailLabel: {
    fontSize: 12,
    color: Theme.colors.mutedForeground,
  },
  heroDetailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  spacer: {
    height: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadow.soft,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    color: Theme.colors.mutedForeground,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginTop: 2,
  },
  noticeList: {
    marginBottom: 24,
    gap: 12,
  },
  noticeCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadow.soft,
  },
  noticeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeTag: {
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  noticeTime: {
    fontSize: 10,
    color: Theme.colors.mutedForeground,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.foreground,
    lineHeight: 18,
  },
  mapCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadow.soft,
  },
  mapPinContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mapPin: {
    fontSize: 18,
  },
  mapInfo: {
    flex: 1,
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  mapSubtitle: {
    fontSize: 11,
    color: Theme.colors.mutedForeground,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderColor: Theme.colors.border,
  },
});
