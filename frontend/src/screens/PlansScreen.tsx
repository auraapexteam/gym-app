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
  Modal,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS, SHADOWS } from '../theme/tokens';
import { Check, ShieldCheck } from 'lucide-react-native';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
}

export function PlansScreen({ navigation }: any) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false); // separate from plans loading
  const { user, userProfile, loadSubscription } = useAuthStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      // Backend API contract: customers MUST pass ?gymId= or get 403
      const gymId = userProfile?.gym_id;
      const response = await apiClient.get('/plans', {
        params: gymId ? { gymId } : undefined,
      });
      if (response.data && response.data.success) {
        setPlans(response.data.data.items || response.data.data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    try {
      setPurchasingId(plan.id);

      // 1. Create a Razorpay Order on the backend
      const response = await apiClient.post('/payments/orders', {
        planId: plan.id,
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data.message || 'Failed to initiate order');
      }

      const { orderId, amountInPaise, currency, razorpayKeyId } = response.data.data;

      // 2. Open Razorpay Checkout overlay
      const options = {
        description: plan.description,
        currency: currency,
        key: razorpayKeyId,
        order_id: orderId,
        name: 'Aura Apex Gym',
        prefill: {
          email: user?.email || '',
          contact: '9876543210',
          name: user?.email?.split('@')[0] || 'Gym Customer',
        },
        theme: { color: COLORS.primary },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          // 3. Verify Payment Signature on backend
          try {
            setVerifying(true); // show overlay spinner, don't touch plans loading
            const verifyRes = await apiClient.post('/payments/verify', {
              orderId: orderId,
              paymentId: data.razorpay_payment_id,
              signature: data.razorpay_signature,
            });

            if (verifyRes.data && verifyRes.data.success) {
              await loadSubscription();
              Alert.alert(
                '🎉 Payment Verified',
                'Your membership has been activated! Welcome to Aura Apex.',
                [
                  {
                    text: 'Go to Dashboard',
                    onPress: () => {
                      navigation.navigate('HomeTab');
                    },
                  },
                ]
              );
            }
          } catch (verifyErr: any) {
            Alert.alert(
              'Verification Failed',
              verifyErr.message || 'Payment was received but we could not confirm it. Contact support.',
            );
          } finally {
            setVerifying(false);
            setPurchasingId(null);
          }
        })
        .catch((error: any) => {
          console.warn('Razorpay Checkout failed:', error);
          Alert.alert('Checkout Closed', error.description || 'Payment was cancelled.');
          setPurchasingId(null);
        });
    } catch (error: any) {
      Alert.alert('Checkout Error', error.message || 'An error occurred during order creation.');
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
          ₹{item.price} <Text style={styles.planInterval}>/ {item.durationDays} Days</Text>
        </Text>

        <View style={styles.divider} />

        {/* Features Checklist */}
        <View style={styles.featuresContainer}>
          {(item.features || ['Full Access', 'Cardio + Strength Area']).map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Check size={16} color={COLORS.success} style={styles.featureIcon} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => handleSubscribe(item)}
          disabled={purchasingId !== null}
        >
          {isProcessing ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={styles.subscribeText}>Select & Subscribe</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-screen verify overlay — only shown during payment confirmation */}
      <Modal visible={verifying} transparent animationType="fade">
        <View style={styles.verifyOverlay}>
          <View style={styles.verifyCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.verifyText}>Confirming payment...</Text>
            <Text style={styles.verifySubtext}>Please wait, do not close the app.</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <ShieldCheck size={28} color={COLORS.primary} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Membership Plans</Text>
        <Text style={styles.headerSubtitle}>Select a plan to start your transformation journey</Text>
      </View>

      {loading && plans.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerIcon: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
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
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  planDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
  },
  planInterval: {
    fontSize: 14,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  featuresContainer: {
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  subscribeText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 40,
    fontSize: 16,
  },
  verifyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
  },
  verifyText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  verifySubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
