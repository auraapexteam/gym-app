import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_interval: 'month' | 'year';
  razorpay_plan_id?: string;
}

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

      const { razorpaySubscriptionId, amount } = response.data.data;

      // 2. Open Razorpay Checkout overlay
      const options = {
        description: plan.description,
        currency: 'INR',
        key: 'rzp_test_TCESM9ZshcU5Ul', // Your Razorpay test Key ID
        subscription_id: razorpaySubscriptionId,
        name: 'Subscription App',
        prefill: {
          email: user?.email || '',
          contact: '9876543210',
          name: 'Subscription Customer',
        },
        theme: { color: '#6366F1' },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
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

  const renderPlanCard = ({ item }: { item: Plan }) => {
    const isProcessing = purchasingId === item.id;
    return (
      <View style={styles.card}>
        <Text style={styles.planName}>{item.name}</Text>
        <Text style={styles.planDescription}>{item.description}</Text>
        <Text style={styles.planPrice}>
          ₹{item.price} <Text style={styles.planInterval}>/ {item.billing_interval}</Text>
        </Text>

        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => handleSubscribe(item)}
          disabled={purchasingId !== null}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.subscribeText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={renderPlanCard}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No subscription plans available right now.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6366F1',
    marginTop: 16,
  },
  planInterval: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  subscribeButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  subscribeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
    fontSize: 16,
  },
});
