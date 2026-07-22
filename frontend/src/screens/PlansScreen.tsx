import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../theme/Theme';
import { AppButton } from '../components/AppButton';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_interval: 'month' | 'year';
  razorpay_plan_id?: string;
}

// Mock payment history to match society-harmony's finances layout
const mockPaymentHistory = [
  { id: 'TXN-8291', label: 'Monthly Membership · July', date: 'Jul 3, 2026', amount: 4500, status: 'paid' },
  { id: 'TXN-7198', label: 'Personal Trainer session', date: 'Jun 27, 2026', amount: 1500, status: 'paid' },
  { id: 'TXN-6187', label: 'Monthly Membership · June', date: 'Jun 5, 2026', amount: 4500, status: 'paid' },
  { id: 'TXN-5352', label: 'Supplement Bar Order', date: 'May 21, 2026', amount: 2500, status: 'refunded' },
];

export function PlansScreen({ navigation }: any) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { user, loadSubscription } = useAuthStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/plans');
      if (response.data && response.data.success) {
        setPlans(response.data.data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    try {
      setPurchasingId(plan.id);

      // 1. Create a subscription on the backend
      const response = await apiClient.post('/subscriptions', {
        planId: plan.id,
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data.message || 'Failed to initiate subscription');
      }

      const { razorpaySubscriptionId } = response.data.data;

      // 2. Open Razorpay Checkout overlay
      const options = {
        description: plan.description,
        currency: 'INR',
        key: 'rzp_test_TCESM9ZshcU5Ul', // Razorpay test Key ID
        subscription_id: razorpaySubscriptionId,
        name: 'Aura Apex Gym',
        prefill: {
          email: user?.email || '',
          contact: '9876543210',
          name: 'Gym Customer',
        },
        theme: { color: Theme.colors.primary },
      };

      RazorpayCheckout.open(options)
        .then(() => {
          Alert.alert(
            'Payment Successful',
            'Your payment was processed. Your subscription will be activated shortly once Razorpay webhooks sync!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Reload active subscription in background
                  loadSubscription();
                  navigation.navigate('Home');
                },
              },
            ]
          );
        })
        .catch((error: any) => {
          console.warn('Razorpay Checkout failed:', error);
          Alert.alert('Payment Failed', error.description || 'Checkout closed or failed.');
        });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during subscription checkout.');
    } finally {
      setPurchasingId(null);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerSubtitle}>contribute & join</Text>
      <Text style={styles.headerTitle}>Subscription Plans</Text>
      <Text style={styles.headerDesc}>
        Choose a plan to activate your membership and unlock premium features, personal coaching, and store discounts.
      </Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.historySection}>
      <Text style={styles.sectionTitle}>Payment History</Text>
      <View style={styles.historyList}>
        {mockPaymentHistory.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyLabel}>{item.label}</Text>
              <Text style={styles.historyDate}>{item.date} · {item.id}</Text>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyAmount}>₹{item.amount}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  item.status === 'paid' ? styles.statusPaid : styles.statusRefunded,
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPlanCard = ({ item }: { item: Plan }) => {
    const isProcessing = purchasingId === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.planBadgeContainer}>
          <Text style={styles.planBadge}>⚡ POPULAR</Text>
        </View>
        <Text style={styles.planName}>{item.name}</Text>
        <Text style={styles.planDescription}>{item.description}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.planPrice}>₹{item.price}</Text>
          <Text style={styles.planInterval}> / {item.billing_interval}</Text>
        </View>

        <AppButton
          variant="primary"
          size="md"
          fullWidth={true}
          onPress={() => handleSubscribe(item)}
          disabled={purchasingId !== null}
          loading={isProcessing}
        >
          Subscribe Now
        </AppButton>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={renderPlanCard}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No subscription plans available right now.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginTop: 4,
  },
  headerDesc: {
    fontSize: 13,
    color: Theme.colors.mutedForeground,
    marginTop: 8,
    lineHeight: 20,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 20,
    marginBottom: 20,
    ...Theme.shadow.lift,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  planBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.primarySoft,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  planBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  planDescription: {
    fontSize: 13,
    color: Theme.colors.mutedForeground,
    marginTop: 6,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 16,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  planInterval: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    fontWeight: '600',
  },
  historySection: {
    marginTop: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadow.soft,
  },
  historyInfo: {
    flex: 1,
    paddingRight: 8,
  },
  historyLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  historyDate: {
    fontSize: 10,
    color: Theme.colors.mutedForeground,
    marginTop: 4,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  statusBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  statusPaid: {
    backgroundColor: Theme.colors.successSoft,
    color: Theme.colors.success,
  },
  statusRefunded: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.mutedForeground,
    marginTop: 40,
    fontSize: 16,
  },
});
