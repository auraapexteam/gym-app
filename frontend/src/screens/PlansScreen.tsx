import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../theme/Theme';
import { Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_interval: 'month' | 'year';
  features?: string[];
}

export function PlansScreen({ navigation }: any) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Checkout sheet states
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'upi' | 'card'>('upi');
  const [payPhase, setPayPhase] = useState<'form' | 'loading' | 'success'>('form');

  const { user, loadSubscription, subscription } = useAuthStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/plans');
      if (response.data && response.data.success) {
        // Map backend plans or use mock list for features if missing
        const list = response.data.data.map((p: Plan) => {
          let features = ['Full gym access', 'Locker inclusion', '1 group class/week'];
          if (p.name.includes('Standard') || p.name.includes('Elite')) {
            features = ['All Starter perks', 'Unlimited group classes', 'Sauna recovery access', 'Progress tracking logs'];
          }
          if (p.name.includes('Elite')) {
            features = ['All Standard perks', 'Personal trainer 4x/mo', 'Nutrition meal planning', 'Recovery lounge access', 'Priority booking slots'];
          }
          return { ...p, features };
        });
        setPlans(list);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = (plan: Plan) => {
    setSelectedPlan(plan);
    setPayPhase('form');
    setCheckoutOpen(true);
  };

  const handlePay = async () => {
    if (!selectedPlan) return;
    
    try {
      setPayPhase('loading');

      // 1. Create a subscription session on the backend
      const response = await apiClient.post('/subscriptions', {
        planId: selectedPlan.id,
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data.message || 'Failed to initiate subscription');
      }

      const { razorpaySubscriptionId } = response.data.data;

      // Calculate checkout price based on toggle
      const calculatedPrice = billingCycle === 'annual' 
        ? Math.round(selectedPlan.price * 12 * 0.8) 
        : selectedPlan.price;

      // 2. Configure Razorpay details
      const options = {
        description: selectedPlan.description,
        currency: 'INR',
        key: 'rzp_test_TCESM9ZshcU5Ul', // Test Key
        subscription_id: razorpaySubscriptionId,
        name: 'Aura Apex Gym',
        prefill: {
          email: user?.email || '',
          contact: '9876543210',
          name: 'Gym Customer',
        },
        theme: { color: '#6366f1' },
      };

      // 3. Open Razorpay native widget
      RazorpayCheckout.open(options)
        .then(() => {
          // Success
          setPayPhase('success');
          loadSubscription();
          
          // Delayed close
          setTimeout(() => {
            setCheckoutOpen(false);
            navigation.navigate('HomeTab');
          }, 1800);
        })
        .catch((error: any) => {
          console.warn('Razorpay Checkout failed:', error);
          setPayPhase('form');
          Alert.alert('Payment Failed', error.description || 'Checkout closed or failed.');
        });
    } catch (error: any) {
      setPayPhase('form');
      Alert.alert('Error', error.message || 'An error occurred during subscription checkout.');
    }
  };

  const getPrice = (plan: Plan) => {
    if (billingCycle === 'annual') {
      return Math.round(plan.price * 12 * 0.8);
    }
    return plan.price;
  };

  const getIntervalLabel = () => {
    return billingCycle === 'annual' ? '/yr' : '/mo';
  };

  const isCurrentPlan = (plan: Plan) => {
    return subscription?.plans?.id === plan.id;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title area */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Choose your plan</Text>
          <Text style={styles.screenSubtitle}>Cancel or switch tiers anytime.</Text>
        </View>

        {/* Toggle Segment Billing */}
        <View style={styles.segmentedRow}>
          <View style={styles.segmentedBg}>
            <TouchableOpacity
              onPress={() => setBillingCycle('monthly')}
              activeOpacity={0.8}
              style={[styles.segmentBtn, billingCycle === 'monthly' && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, billingCycle === 'monthly' && styles.segmentTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBillingCycle('annual')}
              activeOpacity={0.8}
              style={[styles.segmentBtn, billingCycle === 'annual' && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, billingCycle === 'annual' && styles.segmentTextActive]}>
                Annual
              </Text>
            </TouchableOpacity>
          </View>
          {billingCycle === 'annual' && (
            <View style={styles.mintBadge}>
              <Text style={styles.mintBadgeText}>Save 20%</Text>
            </View>
          )}
        </View>

        {/* Swipe Carousel of plan cards */}
        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <ScrollView
            horizontal={true}
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={width * 0.76 + 12}
            contentContainerStyle={styles.carouselContainer}
          >
            {plans.map((p) => {
              const isElite = p.name.includes('Elite') || p.name.includes('Gold') || p.name.includes('Premium');
              const isCurrent = isCurrentPlan(p);
              
              return (
                <View
                  key={p.id}
                  style={[
                    styles.planCard,
                    isElite ? styles.featuredCard : styles.standardCard,
                  ]}
                >
                  {isElite && (
                    <View style={styles.popBadge}>
                      <Text style={styles.popBadgeText}>Most Popular</Text>
                    </View>
                  )}
                  <Text style={[styles.tierName, isElite ? styles.textWhite : styles.textMuted]}>
                    {p.name.toUpperCase()}
                  </Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={[styles.tierPrice, isElite ? styles.textWhite : styles.textWhite]}>
                      ₹{getPrice(p).toLocaleString()}
                    </Text>
                    <Text style={[styles.tierInterval, isElite ? styles.textMuted : styles.textMuted]}>
                      {getIntervalLabel()}
                    </Text>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.featuresContainer}>
                    {p.features?.map((f, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Check size={14} color={isElite ? '#FFFFFF' : '#10b981'} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={[styles.featureText, isElite ? styles.textWhite : styles.textMuted]}>
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => !isCurrent && handleOpenCheckout(p)}
                    activeOpacity={0.8}
                    style={[
                      styles.subscribeBtn,
                      isElite ? styles.subscribeBtnElite : styles.subscribeBtnStandard,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subscribeBtnText,
                        isElite ? styles.subscribeTextElite : styles.subscribeTextStandard,
                      ]}
                    >
                      {isCurrent ? 'Current Plan' : 'Subscribe Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>

      {/* Slide-Up Checkout Bottom Drawer Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={checkoutOpen}
        onRequestClose={() => setCheckoutOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.dismissOverlay}
            activeOpacity={1}
            onPress={() => setCheckoutOpen(false)}
          />
          <View style={styles.sheetBody}>
            {payPhase === 'form' && selectedPlan && (
              <View style={styles.sheetContent}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Checkout</Text>
                  <TouchableOpacity onPress={() => setCheckoutOpen(false)}>
                    <Text style={styles.sheetClose}>Close</Text>
                  </TouchableOpacity>
                </View>

                {/* Amount Row Box */}
                <View style={styles.checkoutAmountCard}>
                  <View>
                    <Text style={styles.checkoutPlanSub}>
                      Aura Apex · {selectedPlan.name} ({billingCycle})
                    </Text>
                    <Text style={styles.checkoutAmountVal}>
                      ₹{getPrice(selectedPlan).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.checkoutGatewayBadge}>
                    <Text style={styles.checkoutGatewayText}>Razorpay</Text>
                  </View>
                </View>

                {/* Method selector Segment */}
                <View style={styles.methodSegmentBg}>
                  <TouchableOpacity
                    onPress={() => setPayMethod('upi')}
                    activeOpacity={0.8}
                    style={[styles.methodBtn, payMethod === 'upi' && styles.methodBtnActive]}
                  >
                    <Text style={[styles.methodText, payMethod === 'upi' && styles.methodTextActive]}>
                      UPI
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPayMethod('card')}
                    activeOpacity={0.8}
                    style={[styles.methodBtn, payMethod === 'card' && styles.methodBtnActive]}
                  >
                    <Text style={[styles.methodText, payMethod === 'card' && styles.methodTextActive]}>
                      Card
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Detail Box */}
                {payMethod === 'upi' ? (
                  <View style={styles.methodDetailBox}>
                    <Text style={styles.methodDetailLabel}>UPI ID</Text>
                    <Text style={styles.methodDetailValue}>aarav@okhdfc</Text>
                  </View>
                ) : (
                  <View style={styles.methodDetailBox}>
                    <Text style={styles.methodDetailLabel}>Card Number</Text>
                    <Text style={styles.methodDetailValue}>•••• •••• •••• 4242</Text>
                  </View>
                )}

                {/* Checkout Trigger */}
                <TouchableOpacity
                  onPress={handlePay}
                  activeOpacity={0.85}
                  style={styles.payBtn}
                >
                  <Text style={styles.payBtnText}>
                    Pay ₹{getPrice(selectedPlan).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {payPhase === 'loading' && (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Processing payment…</Text>
              </View>
            )}

            {payPhase === 'success' && selectedPlan && (
              <View style={styles.successState}>
                <View style={styles.successCircle}>
                  <Check size={36} color="#FFFFFF" strokeWidth={3.5} />
                </View>
                <Text style={styles.successTitle}>You're on {selectedPlan.name}!</Text>
                <Text style={styles.successSubtitle}>Membership activated successfully.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 16, // clear top notch/status bar on Android
    paddingBottom: 120,
  },
  screenHeader: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#a1a5b7',
    marginTop: 4,
  },
  segmentedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  segmentedBg: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 9999,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  segmentBtnActive: {
    backgroundColor: '#6366f1',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a5b7',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mintBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  mintBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  centerLoader: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    paddingRight: 40,
    gap: 12,
  },
  planCard: {
    width: width * 0.74,
    borderRadius: 28,
    padding: 20,
    minHeight: 330,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  standardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featuredCard: {
    backgroundColor: '#141a2a',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  popBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  popBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  tierName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  textWhite: {
    color: '#f5f6fa',
  },
  textMuted: {
    color: '#a1a5b7',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '800',
  },
  tierInterval: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
  },
  featuresContainer: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
  },
  subscribeBtn: {
    borderRadius: 9999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeBtnStandard: {
    backgroundColor: '#6366f1',
  },
  subscribeBtnElite: {
    backgroundColor: '#FFFFFF',
  },
  subscribeBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  subscribeTextStandard: {
    color: '#FFFFFF',
  },
  subscribeTextElite: {
    color: '#141a2a',
  },

  /* ============ Sheet Styles ============ */
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetBody: {
    backgroundColor: '#141a2a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    minHeight: 300,
  },
  sheetContent: {
    gap: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  sheetClose: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a1a5b7',
  },
  checkoutAmountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
  },
  checkoutPlanSub: {
    fontSize: 11,
    color: '#a1a5b7',
    fontWeight: '600',
  },
  checkoutAmountVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f5f6fa',
    marginTop: 2,
  },
  checkoutGatewayBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkoutGatewayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  methodSegmentBg: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 3,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  methodBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a5b7',
  },
  methodTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  methodDetailBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 16,
  },
  methodDetailLabel: {
    fontSize: 10,
    color: '#a1a5b7',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  methodDetailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5f6fa',
    marginTop: 4,
  },
  payBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 9999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ============ State Views ============ */
  loadingState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#a1a5b7',
    fontWeight: '600',
  },
  successState: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f5f6fa',
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 12,
    color: '#a1a5b7',
    fontWeight: '500',
  },
});
