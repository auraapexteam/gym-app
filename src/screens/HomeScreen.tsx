import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export function HomeScreen({ navigation }: any) {
  const { user, subscription, loadSubscription, signOut, loading } = useAuthStore();

  useEffect(() => {
    loadSubscription();
  }, []);

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome,</Text>
        <Text style={styles.headerUser}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" />
        ) : subscription && subscription.status === 'active' ? (
          // Active Subscription Card
          <View style={[styles.card, styles.activeCard]}>
            <Text style={styles.cardStatusLabel}>ACTIVE SUBSCRIPTION</Text>
            <Text style={styles.planName}>{subscription.plans?.name || 'Standard Plan'}</Text>
            <Text style={styles.planPrice}>
              ₹{subscription.plans?.price}/{subscription.plans?.billing_interval}
            </Text>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Renewal Date:</Text>
              <Text style={styles.detailValue}>{formatDate(subscription.current_period_end)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, styles.activeText]}>Active</Text>
            </View>
          </View>
        ) : (
          // Inactive / No Subscription Card
          <View style={[styles.card, styles.inactiveCard]}>
            <Text style={styles.cardStatusLabel}>NO ACTIVE SUBSCRIPTION</Text>
            <Text style={styles.inactiveTitle}>Unlock Premium Features</Text>
            <Text style={styles.inactiveDesc}>
              Subscribe to one of our premium plans to gain full access to exclusive services.
            </Text>

            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => navigation.navigate('Plans')}
            >
              <Text style={styles.subscribeButtonText}>Explore Plans</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerUser: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#10B981',
  },
  inactiveCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#EF4444',
  },
  cardStatusLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  planPrice: {
    fontSize: 18,
    color: '#4B5563',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  activeText: {
    color: '#10B981',
  },
  inactiveTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  inactiveDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 24,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
