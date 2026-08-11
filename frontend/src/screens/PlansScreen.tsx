import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useGymStore, PublicGym } from '../store/useGymStore';
import { useTheme } from '../context/ThemeContext';
import {
  Check,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  X,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  billing_interval: 'month' | 'year';
  features?: string[];
}

const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const formatTime12h = (t?: string) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (!Number.isFinite(h)) return null;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, '0')} ${period}`;
};

export function PlansScreen({ route, navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const { user, userProfile, loadUserProfile, loadSubscription, subscription } = useAuthStore();
  const { directory, fetchDirectory } = useGymStore();

  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [gymDetails, setGymDetails] = useState<PublicGym | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [gymLoading, setGymLoading] = useState(false);

  // Checkout modal states
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payPhase, setPayPhase] = useState<'form' | 'loading' | 'success'>('form');
  const payingRef = useRef(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // 1. Initial Gym Directory Fetch
  useEffect(() => {
    fetchDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount fetch
  }, []);

  // Update selectedGymId from params or profile or first directory gym
  useEffect(() => {
    const paramId = route?.params?.gymId;
    const profileId = userProfile?.gym_id;
    const initialId = paramId || profileId || (directory.length > 0 ? directory[0].id : null);

    if (initialId && initialId !== selectedGymId) {
      setSelectedGymId(initialId);
    } else if (!selectedGymId && directory.length > 0) {
      setSelectedGymId(directory[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedGymId is compared, not depended on
  }, [route?.params?.gymId, userProfile?.gym_id, directory]);

  // 2. Fetch Live Gym Profile & Plans whenever selectedGymId changes
  useEffect(() => {
    if (selectedGymId) {
      loadGymData(selectedGymId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadGymData is stable per render pass
  }, [selectedGymId]);

  const loadGymData = async (gymId: string) => {
    try {
      setGymLoading(true);
      setLoading(true);

      // Check directory cache or fetch public profile from live API
      const localGym = directory.find((g) => g.id === gymId);
      if (localGym) {
        setGymDetails(localGym);
      } else {
        try {
          const gymRes = await apiClient.get(`/gyms/${gymId}`);
          if (gymRes.data?.success && gymRes.data.data) {
            setGymDetails(gymRes.data.data);
          }
        } catch {
          // Non-fatal: the plans list below still renders without the hero card.
          setGymDetails(null);
        }
      }

      // Fetch live database plans for this gym
      const plansRes = await apiClient.get(`/plans?gymId=${gymId}`);
      if (plansRes.data && plansRes.data.success) {
        const rawPlans = plansRes.data.data || [];
        const liveList: Plan[] = rawPlans.map((p: any) => {
          let planFeatures: string[] = [];
          if (Array.isArray(p.features) && p.features.length > 0) {
            planFeatures = p.features;
          } else if (p.description) {
            planFeatures = [p.description];
          } else {
            planFeatures = ['Standard Gym Access', 'Digital QR Check-In'];
          }

          const durationDays = Number(p.duration_days ?? p.durationDays) || 30;
          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            durationDays,
            billing_interval: durationDays >= 365 ? 'year' : 'month',
            features: planFeatures,
          };
        });
        setPlans(liveList);
      } else {
        setPlans([]);
      }
    } catch (err: any) {
      console.warn('Failed to load gym plans:', err);
      setPlans([]);
    } finally {
      setGymLoading(false);
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
    if (payingRef.current) return; // block double taps while a payment is in flight
    payingRef.current = true;

    try {
      setPayPhase('loading');

      // 1. Create a Razorpay order on backend for this live plan
      const orderRes = await apiClient.post('/payments/orders', {
        planId: selectedPlan.id,
      });

      if (!orderRes.data || !orderRes.data.success) {
        throw new Error(orderRes.data?.message || 'Failed to create payment order');
      }

      const { orderId, amountInPaise, currency, razorpayKeyId } = orderRes.data.data;

      // 2. Open Razorpay native SDK checkout
      const options = {
        description: `${selectedPlan.name} Membership`,
        currency: currency || 'INR',
        key: razorpayKeyId,
        amount: amountInPaise,
        order_id: orderId,
        name: gymDetails?.name || 'Aura Apex Gym',
        prefill: {
          email: user?.email || '',
          contact: userProfile?.phone || '',
          name: userProfile?.full_name || '',
        },
        theme: { color: colors.primary },
      };

      const result = await RazorpayCheckout.open(options);

      // 3. Verify signature server-side to activate subscription & link gym
      const verifyRes = await apiClient.post('/payments/verify', {
        orderId: result.razorpay_order_id,
        paymentId: result.razorpay_payment_id,
        signature: result.razorpay_signature,
      });

      if (!verifyRes.data || !verifyRes.data.success) {
        throw new Error(verifyRes.data?.message || 'Payment verification failed');
      }

      setPayPhase('success');
      await loadUserProfile();
      await loadSubscription();

      // Delayed close and navigate to HomeTab
      successTimerRef.current = setTimeout(() => {
        setCheckoutOpen(false);
        navigation.navigate('HomeTab');
      }, 1600);
    } catch (error: any) {
      setPayPhase('form');
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || error.description || error.message || 'Checkout was cancelled or failed.'
      );
    } finally {
      payingRef.current = false;
    }
  };

  // Ignore dismiss gestures while the payment/verification is in flight so
  // the sheet can't be closed into an ambiguous state mid-checkout.
  const handleCloseCheckout = () => {
    if (payPhase === 'loading') return;
    setCheckoutOpen(false);
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

  const getRemainingDays = (): number | null => {
    if (!activeSub) return null;
    const subEndDate = activeSub.end_date || activeSub.endDate;
    if (!subEndDate) return null; // unknown — show "Active Access" instead of a made-up count
    return Math.max(0, Math.ceil((new Date(subEndDate).getTime() - Date.now()) / (1000 * 3600 * 24)));
  };

  // Helper for Initials
  const getGymInitials = (name?: string) => {
    if (!name) return 'GY';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Screen Header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Choose your plan</Text>
          <Text style={styles.screenSubtitle}>Select and activate your membership tier.</Text>
        </View>

        {/* 1. Gym Switcher Pills (if multiple gyms exist in directory) */}
        {directory.length > 1 && (
          <View style={styles.gymSelectorWrapper}>
            <Text style={styles.gymSelectorLabel}>SELECT PARTNER GYM</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gymPillsScroll}>
              {directory.map((gym) => {
                const isSelected = gym.id === selectedGymId;
                return (
                  <TouchableOpacity
                    key={gym.id}
                    activeOpacity={0.8}
                    style={[styles.gymPill, isSelected && styles.gymPillActive]}
                    onPress={() => setSelectedGymId(gym.id)}
                  >
                    <Building2 size={13} color={isSelected ? '#FFFFFF' : colors.mutedForeground} style={{ marginRight: 6 }} />
                    <Text style={[styles.gymPillText, isSelected && styles.gymPillTextActive]}>
                      {gym.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 2. Live Gym Info Banner */}
        {gymDetails && (
          <View style={styles.gymHeroCard}>
            <View style={styles.gymHeroTop}>
              {gymDetails.logoUrl ? (
                <Image source={{ uri: gymDetails.logoUrl }} style={styles.gymHeroLogo} />
              ) : (
                <View style={styles.gymAvatar}>
                  <Text style={styles.gymAvatarText}>{getGymInitials(gymDetails.name)}</Text>
                </View>
              )}

              <View style={styles.gymHeroInfo}>
                <Text style={styles.gymHeroName} numberOfLines={1}>
                  {gymDetails.name}
                </Text>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedText}>Partner Gym</Text>
                </View>
              </View>
            </View>

            {/* Address & Info */}
            <View style={styles.gymDetailsList}>
              {!!gymDetails.address && (
                <View style={styles.gymDetailItem}>
                  <MapPin size={13} color={colors.primary} style={{ marginRight: 7, marginTop: 1 }} />
                  <Text style={styles.gymDetailText} numberOfLines={2}>
                    {gymDetails.address}
                  </Text>
                </View>
              )}

              {(() => {
                // Real hours from the gym profile — no invented schedule.
                const todayKey = WEEKDAY_KEYS[new Date().getDay()];
                const isOffToday = (gymDetails.weeklyOff || []).includes(todayKey);
                const today = gymDetails.timings?.[todayKey];
                const open = formatTime12h(today?.open);
                const close = formatTime12h(today?.close);
                if (isOffToday) {
                  return (
                    <View style={styles.gymDetailItem}>
                      <Clock size={13} color={colors.primary} style={{ marginRight: 7, marginTop: 1 }} />
                      <Text style={styles.gymDetailText}>Closed today (weekly off)</Text>
                    </View>
                  );
                }
                if (!open || !close) return null;
                return (
                  <View style={styles.gymDetailItem}>
                    <Clock size={13} color={colors.primary} style={{ marginRight: 7, marginTop: 1 }} />
                    <Text style={styles.gymDetailText}>{`${open} – ${close} · Today`}</Text>
                  </View>
                );
              })()}

              {!!gymDetails.description && (
                <Text style={styles.gymDescText} numberOfLines={2}>
                  {gymDetails.description}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* 3. Live Membership Plans Section */}
        <View style={styles.plansSectionHeader}>
          <Text style={styles.plansSectionTitle}>Available Packages</Text>
          <Text style={styles.plansSectionSubtitle}>Live membership tiers for {gymDetails?.name || 'this gym'}</Text>
        </View>

        {loading || gymLoading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderLabel}>Loading plans…</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.noGymCard}>
            <View style={styles.noGymIconBadge}>
              <Building2 size={36} color={colors.primary} />
            </View>
            <Text style={styles.noGymTitle}>No Plans Available</Text>
            <Text style={styles.noGymSubtitle}>
              {gymDetails?.name || 'This gym'} has not published any membership tiers yet. Browse other partner gyms in our network.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.browseGymsBtn}
              onPress={() => navigation.navigate('GymDirectory')}
            >
              <Building2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.browseGymsBtnText}>Explore Gym Directory</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={width * 0.78 + 12}
            contentContainerStyle={styles.carouselContainer}
          >
            {plans.map((p) => {
              const isCurrent = isCurrentPlan(p);
              const remDays = isCurrent ? getRemainingDays() : null;

              return (
                <View
                  key={p.id}
                  style={[
                    styles.planCard,
                    isCurrent ? styles.activePlanCard : styles.standardCard,
                  ]}
                >
                  {isCurrent && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE MEMBERSHIP</Text>
                    </View>
                  )}

                  <Text style={styles.tierName}>
                    {p.name.toUpperCase()}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.tierPrice}>₹{p.price.toLocaleString()}</Text>
                    <Text style={styles.tierInterval}>{getIntervalLabel(p)}</Text>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.featuresContainer}>
                    {p.features?.map((f, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Check size={14} color="#10B981" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  {isCurrent ? (
                    <View style={styles.activePlanBtnContainer}>
                      <Text style={styles.activePlanBtnTitle}>✓ ONGOING ACTIVE PLAN</Text>
                      <Text style={styles.activePlanBtnSubtext}>
                        {remDays != null && remDays > 0 ? `${remDays} Days Remaining` : 'Active Access'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleOpenCheckout(p)}
                      activeOpacity={0.85}
                      style={styles.subscribeBtn}
                    >
                      <CreditCard size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.subscribeBtnText}>Select & Pay via Razorpay</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>

      {/* Slide-Up Checkout Drawer Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={checkoutOpen}
        onRequestClose={handleCloseCheckout}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.dismissOverlay}
            activeOpacity={1}
            onPress={handleCloseCheckout}
          />
          <View style={styles.sheetBody}>
            {payPhase === 'form' && selectedPlan && (
              <View style={styles.sheetContent}>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Membership Checkout</Text>
                    <Text style={styles.sheetSubtitle}>{gymDetails?.name || 'Aura Apex'}</Text>
                  </View>
                  <TouchableOpacity onPress={handleCloseCheckout} style={styles.closeIconBtn}>
                    <X size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* Plan Summary Card — shows exactly what the backend will charge. */}
                <View style={styles.checkoutAmountCard}>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Selected Package</Text>
                    <Text style={styles.invoiceValue}>{selectedPlan.name}</Text>
                  </View>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Validity</Text>
                    <Text style={styles.invoiceValue}>{selectedPlan.durationDays} days</Text>
                  </View>

                  <View style={styles.invoiceDivider} />

                  <View style={styles.invoiceTotalRow}>
                    <Text style={styles.invoiceTotalLabel}>Total Payable</Text>
                    <Text style={styles.invoiceTotalValue}>
                      ₹{selectedPlan.price.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.securityBadge}>
                  <ShieldCheck size={14} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={styles.securityBadgeText}>
                    Secured by Razorpay · UPI, Cards, NetBanking supported
                  </Text>
                </View>

                {/* Direct Checkout Trigger */}
                <TouchableOpacity
                  onPress={handlePay}
                  activeOpacity={0.85}
                  style={styles.payBtn}
                >
                  <CreditCard size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.payBtnText}>
                    Proceed to Pay ₹{selectedPlan.price.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {payPhase === 'loading' && (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Initializing Razorpay Secure Checkout…</Text>
              </View>
            )}

            {payPhase === 'success' && selectedPlan && (
              <View style={styles.successState}>
                <View style={styles.successCircle}>
                  <Check size={38} color="#FFFFFF" strokeWidth={3.5} />
                </View>
                <Text style={styles.successTitle}>Welcome to {gymDetails?.name || 'the Gym'}!</Text>
                <Text style={styles.successSubtitle}>
                  Your {selectedPlan.name} membership has been activated successfully.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 36 : 16,
      paddingBottom: 120,
    },
    screenHeader: {
      marginBottom: 16,
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.foreground,
    },
    screenSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
    },

    // Gym Quick Selector Bar
    gymSelectorWrapper: {
      marginBottom: 16,
    },
    gymSelectorLabel: {
      fontSize: 10.5,
      fontWeight: '800',
      color: colors.mutedForeground,
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    gymPillsScroll: {
      gap: 8,
    },
    gymPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 99,
      backgroundColor: isDark ? colors.surfaceDark : colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gymPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    gymPillText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.foreground,
    },
    gymPillTextActive: {
      color: '#FFFFFF',
    },

    // Rich Gym Hero Card
    gymHeroCard: {
      backgroundColor: isDark ? colors.surfaceDark : colors.surface,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    gymHeroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    gymHeroLogo: {
      width: 48,
      height: 48,
      borderRadius: 14,
      marginRight: 12,
    },
    gymAvatar: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    gymAvatarText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    gymHeroInfo: {
      flex: 1,
    },
    gymHeroName: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.foreground,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    verifiedText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#10B981',
    },
    gymDetailsList: {
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    gymDetailItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    gymDetailText: {
      fontSize: 12.5,
      color: colors.foreground,
      flex: 1,
      lineHeight: 17,
    },
    gymDescText: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 4,
      lineHeight: 16,
    },

    // Plans Section
    plansSectionHeader: {
      marginBottom: 14,
    },
    plansSectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.foreground,
    },
    plansSectionSubtitle: {
      fontSize: 12.5,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    centerLoader: {
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 10,
    },

    // Empty Gym
    noGymCard: {
      backgroundColor: isDark ? colors.surfaceDark : colors.surface,
      borderRadius: 22,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 20,
    },
    noGymIconBadge: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.primarySoft || 'rgba(99, 102, 241, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    noGymTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.foreground,
      marginBottom: 6,
    },
    noGymSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 18,
    },
    browseGymsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
    },
    browseGymsBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    // Carousel Cards
    carouselContainer: {
      paddingRight: 30,
      gap: 14,
    },
    planCard: {
      width: width * 0.76,
      borderRadius: 24,
      padding: 20,
      minHeight: 320,
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 5,
    },
    standardCard: {
      backgroundColor: isDark ? colors.surfaceDark : colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activePlanCard: {
      backgroundColor: isDark ? colors.surfaceDark : colors.surface,
      borderColor: '#10B981',
      borderWidth: 2,
    },
    activeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#10B981',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 99,
      marginBottom: 8,
    },
    activeBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.8,
    },
    tierName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 1.2,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: 6,
    },
    tierPrice: {
      fontSize: 32,
      fontWeight: '900',
      color: colors.foreground,
    },
    tierInterval: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.mutedForeground,
      marginLeft: 4,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 14,
    },
    featuresContainer: {
      flex: 1,
      gap: 9,
      marginBottom: 18,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    featureText: {
      fontSize: 12.5,
      color: colors.foreground,
      flex: 1,
      lineHeight: 17,
    },
    subscribeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    subscribeBtnText: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '700',
    },
    activePlanBtnContainer: {
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderRadius: 14,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    activePlanBtnTitle: {
      color: '#10B981',
      fontSize: 11.5,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    activePlanBtnSubtext: {
      color: '#10B981',
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },

    // Sheet Modal
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    dismissOverlay: {
      flex: 1,
    },
    sheetBody: {
      backgroundColor: isDark ? colors.surfaceDark : '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    sheetContent: {},
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    sheetTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.foreground,
    },
    sheetSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    closeIconBtn: {
      padding: 4,
    },
    checkoutAmountCard: {
      backgroundColor: isDark ? '#141724' : '#F9FAFB',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      gap: 8,
    },
    invoiceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    invoiceLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
    },
    invoiceValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
    },
    invoiceDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    invoiceTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    invoiceTotalLabel: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.foreground,
    },
    invoiceTotalValue: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.primary,
    },
    securityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    securityBadgeText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.mutedForeground,
    },
    payBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    payBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    loadingState: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 14,
      fontWeight: '600',
    },
    successState: {
      paddingVertical: 36,
      alignItems: 'center',
    },
    successCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.foreground,
      textAlign: 'center',
    },
    successSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 6,
      textAlign: 'center',
    },
  });
