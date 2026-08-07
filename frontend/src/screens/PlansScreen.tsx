import React, { useEffect, useState, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
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
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Checkout sheet states
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payPhase, setPayPhase] = useState<'form' | 'loading' | 'success'>('form');

  const { user, userProfile, loadSubscription, subscription } = useAuthStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const targetGymId = userProfile?.gymId || user?.gymId;
      const endpoint = targetGymId ? `/plans?gymId=${targetGymId}` : '/plans';
      const response = await apiClient.get(endpoint);
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

      // 1. Create a Razorpay order on the backend for this plan.
      const orderRes = await apiClient.post('/payments/orders', {
        planId: selectedPlan.id,
      });

      if (!orderRes.data || !orderRes.data.success) {
        throw new Error(orderRes.data?.message || 'Failed to create payment order');
      }

      const { orderId, amountInPaise, currency, razorpayKeyId } = orderRes.data.data;

      // 2. Open Razorpay's native one-time checkout for that order.
      const options = {
        description: selectedPlan.description,
        currency,
        key: razorpayKeyId,
        amount: amountInPaise,
        order_id: orderId,
        name: 'Aura Apex Gym',
        prefill: {
          email: user?.email || '',
          contact: '9876543210',
          name: userProfile?.full_name || 'Gym Customer',
        },
        theme: { color: colors.primary },
      };

      const result = await RazorpayCheckout.open(options);

      // 3. Verify the signature server-side — this is what actually activates
      // the subscription. Never treat the Razorpay callback alone as success.
      const verifyRes = await apiClient.post('/payments/verify', {
        orderId: result.razorpay_order_id,
        paymentId: result.razorpay_payment_id,
        signature: result.razorpay_signature,
      });

      if (!verifyRes.data || !verifyRes.data.success) {
        throw new Error(verifyRes.data?.message || 'Payment verification failed');
      }

      setPayPhase('success');
      loadSubscription();

      // Delayed close
      setTimeout(() => {
        setCheckoutOpen(false);
        navigation.navigate('HomeTab');
      }, 1800);
    } catch (error: any) {
      setPayPhase('form');
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || error.description || error.message || 'Checkout closed or failed.'
      );
    }
  };

  const getIntervalLabel = (plan: Plan) => (plan.billing_interval === 'year' ? '/yr' : '/mo');

  const activeSub = useMemo(() => {
    if (!subscription) return null;
    if (Array.isArray(subscription)) {
      return subscription.find((s: any) => s.status === 'active');
    }
    return subscription.status === 'active' ? subscription : null;
  }, [subscription]);

  const isCurrentPlan = (plan: Plan) => {
    if (!activeSub) return false;
    const subPlanId = activeSub.plan?.id || activeSub.plan_id || activeSub.planId;
    const subPlanName = (activeSub.plan?.name || activeSub.planName || '').toLowerCase().trim();
    const currentName = (plan.name || '').toLowerCase().trim();
    return (subPlanId && subPlanId === plan.id) || (subPlanName && subPlanName === currentName);
  };

  const getRemainingDays = () => {
    if (!activeSub) return 0;
    const subEndDate = activeSub.end_date || activeSub.endDate;
    if (!subEndDate) return 30;
    return Math.max(0, Math.ceil((new Date(subEndDate).getTime() - Date.now()) / (1000 * 3600 * 24)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title area */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Choose your plan</Text>
          <Text style={styles.screenSubtitle}>Select and activate your membership tier.</Text>
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
              const remDays = isCurrent ? getRemainingDays() : 0;
              
              return (
                <View
                  key={p.id}
                  style={[
                    styles.planCard,
                    isElite ? styles.featuredCard : styles.standardCard,
                    isCurrent && styles.activePlanCard,
                  ]}
                >
                  {isCurrent ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE PACKAGE</Text>
                    </View>
                  ) : isElite ? (
                    <View style={styles.popBadge}>
                      <Text style={styles.popBadgeText}>Most Popular</Text>
                    </View>
                  ) : null}

                  <Text style={[styles.tierName, isElite ? styles.textWhite : styles.textMuted]}>
                    {p.name.toUpperCase()}
                  </Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={[styles.tierPrice, isElite ? styles.textWhite : styles.textWhite]}>
                      ₹{p.price.toLocaleString()}
                    </Text>
                    <Text style={[styles.tierInterval, isElite ? styles.textMuted : styles.textMuted]}>
                      {getIntervalLabel(p)}
                    </Text>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.featuresContainer}>
                    {p.features?.map((f, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Check size={14} color={isCurrent || isElite ? '#10b981' : '#10b981'} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={[styles.featureText, isElite ? styles.textWhite : styles.textMuted]}>
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {isCurrent ? (
                    <View style={styles.activePlanBtnContainer}>
                      <Text style={styles.activePlanBtnTitle}>✓ ONGOING ACTIVE PLAN</Text>
                      <Text style={styles.activePlanBtnSubtext}>
                        {remDays > 0 ? `${remDays} Days Remaining` : 'Active Access'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleOpenCheckout(p)}
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
                        Subscribe Now
                      </Text>
                    </TouchableOpacity>
                  )}
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

                <View style={styles.checkoutAmountCard}>
                  <View>
                    <Text style={styles.checkoutPlanSub}>
                      Aura Apex · {selectedPlan.name}
                    </Text>
                    <Text style={styles.checkoutAmountVal}>
                      ₹{selectedPlan.price.toLocaleString()}
                      <Text style={styles.checkoutAmountPeriod}>{getIntervalLabel(selectedPlan)}</Text>
                    </Text>
                  </View>
                  <View style={styles.checkoutGatewayBadge}>
                    <Text style={styles.checkoutGatewayText}>Razorpay</Text>
                  </View>
                </View>

                <View style={styles.methodDetailBox}>
                  <Text style={styles.methodDetailNote}>
                    You'll choose UPI, card, netbanking, or wallet on the next screen.
                  </Text>
                </View>

                {/* Checkout Trigger */}
                <TouchableOpacity
                  onPress={handlePay}
                  activeOpacity={0.85}
                  style={styles.payBtn}
                >
                  <Text style={styles.payBtnText}>
                    Pay ₹{selectedPlan.price.toLocaleString()}
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

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.foreground,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
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
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  standardCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuredCard: {
    backgroundColor: isDark ? colors.surfaceDark : colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  popBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: colors.foreground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  popBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.background,
    textTransform: 'uppercase',
  },
  tierName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  textWhite: {
    color: colors.foreground,
  },
  textMuted: {
    color: colors.mutedForeground,
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
    backgroundColor: colors.border,
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
    backgroundColor: colors.primary,
  },
  subscribeBtnElite: {
    backgroundColor: colors.foreground,
  },
  subscribeBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  subscribeTextStandard: {
    color: '#FFFFFF',
  },
  subscribeTextElite: {
    color: colors.background,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetBody: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderColor: colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
  },
  sheetClose: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  checkoutAmountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
  },
  checkoutPlanSub: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  checkoutAmountVal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: 2,
  },
  checkoutAmountPeriod: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  checkoutGatewayBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkoutGatewayText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  methodDetailBox: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  methodDetailNote: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '600',
    lineHeight: 17,
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
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
  loadingState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  activePlanCard: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  activeBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activePlanBtnContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePlanBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activePlanBtnSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 2,
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
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
});
