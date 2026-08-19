import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  CreditCard,
  X,
  Building2,
  Sparkles,
} from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { useGymStore, PublicGym } from '../store/useGymStore';
import { apiClient } from '../api/client';

const { width } = Dimensions.get('window');

const GYM_HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
];

const DEFAULT_TAGS = ['Pool', 'Sauna', 'CrossFit', 'Parking', 'Lockers', 'PT Sessions'];

export interface GymPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  billingInterval: 'day' | 'month' | 'quarter' | 'year';
  isPopular?: boolean;
  features: string[];
}

export function GymInfoScreen({ route, navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const { user, userProfile, loadUserProfile, loadSubscription, subscription } = useAuthStore();
  const { directory } = useGymStore();

  const gymId = route?.params?.gymId;
  const initialGymParam = route?.params?.gym;

  const [gym, setGym] = useState<PublicGym | null>(initialGymParam || null);
  const [gymLoading, setGymLoading] = useState(false);
  const [plans, setPlans] = useState<GymPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Payment modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payPhase, setPayPhase] = useState<'form' | 'loading' | 'success'>('form');
  const payingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Fetch Gym details and plans
  useEffect(() => {
    const targetId = gymId || (directory.length > 0 ? directory[0].id : null);
    if (targetId) {
      loadGymAndPlans(targetId);
    }
  }, [gymId, directory]);

  const loadGymAndPlans = async (id: string) => {
    try {
      setPlansLoading(true);

      // 1. Fetch live Gym profile if not cached
      const cached = directory.find((g) => g.id === id);
      if (cached) {
        setGym(cached);
      } else {
        setGymLoading(true);
        try {
          const gymRes = await apiClient.get(`/gyms/${id}`);
          if (gymRes.data?.success && gymRes.data?.data) {
            setGym(gymRes.data.data);
          }
        } catch (e) {
          console.warn('Failed to load gym info:', e);
        } finally {
          setGymLoading(false);
        }
      }

      // 2. Fetch live Plans for this Gym
      const plansRes = await apiClient.get(`/plans?gymId=${id}`);
      if (plansRes.data?.success && Array.isArray(plansRes.data.data)) {
        const rawList = plansRes.data.data;
        const formatted: GymPlan[] = rawList.map((p: any) => {
          const durationDays = Number(p.duration_days ?? p.durationDays) || 30;
          let interval: 'day' | 'month' | 'quarter' | 'year' = 'month';
          if (durationDays <= 3) interval = 'day';
          else if (durationDays >= 75 && durationDays <= 120) interval = 'quarter';
          else if (durationDays >= 365) interval = 'year';

          const nameLower = (p.name || '').toLowerCase();
          const isPopular = nameLower.includes('monthly') || durationDays === 30;

          return {
            id: p.id,
            name: p.name || 'Membership Plan',
            description: p.description || '',
            price: Number(p.price) || 0,
            durationDays,
            billingInterval: interval,
            isPopular,
            features: Array.isArray(p.features) && p.features.length > 0
              ? p.features
              : [p.description || 'Full Gym & Equipment Access', 'Digital QR Check-In'],
          };
        });

        setPlans(formatted);
        // Default select popular or first plan
        const defaultPlan = formatted.find((p) => p.isPopular) || formatted[0];
        if (defaultPlan) setSelectedPlanId(defaultPlan.id);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.warn('Failed to load plans:', err);
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0] || null;
  }, [plans, selectedPlanId]);

  // Razorpay Checkout Trigger
  const handleInitiatePayment = async () => {
    if (!selectedPlan) {
      Alert.alert('Select a Plan', 'Please select a membership plan to continue.');
      return;
    }
    if (payingRef.current) return;
    payingRef.current = true;

    try {
      setCheckoutOpen(true);
      setPayPhase('loading');

      // 1. Backend Order Creation
      const orderRes = await apiClient.post('/payments/orders', {
        planId: selectedPlan.id,
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Order creation failed');
      }

      const { orderId, amountInPaise, currency, razorpayKeyId } = orderRes.data.data;

      // 2. Razorpay SDK Call
      const options = {
        description: `${selectedPlan.name} - ${gym?.name || 'Aura Gym'}`,
        currency: currency || 'INR',
        key: razorpayKeyId,
        amount: amountInPaise,
        order_id: orderId,
        name: gym?.name || 'Aura Apex Gym',
        prefill: {
          email: user?.email || '',
          contact: userProfile?.phone || '',
          name: userProfile?.full_name || '',
        },
        theme: { color: '#84CC16' }, // Modern Lime accent matching mockup
      };

      const sdkResult = await RazorpayCheckout.open(options);

      // 3. Backend Verification
      const verifyRes = await apiClient.post('/payments/verify', {
        orderId: sdkResult.razorpay_order_id,
        paymentId: sdkResult.razorpay_payment_id,
        signature: sdkResult.razorpay_signature,
      });

      if (!verifyRes.data?.success) {
        throw new Error(verifyRes.data?.message || 'Payment verification failed');
      }

      setPayPhase('success');
      await loadUserProfile();
      await loadSubscription();

      timerRef.current = setTimeout(() => {
        setCheckoutOpen(false);
        navigation.navigate('MainTabs', { screen: 'HomeTab' });
      }, 1600);
    } catch (err: any) {
      setCheckoutOpen(false);
      setPayPhase('form');
      const msg = err.response?.data?.message || err.description || err.message || 'Payment was cancelled.';
      Alert.alert('Payment Status', msg);
    } finally {
      payingRef.current = false;
    }
  };

  const coverUrl =
    (gym as any)?.coverUrl ||
    (gym as any)?.cover_url ||
    GYM_HERO_FALLBACKS[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Hero Header Section with Overlay */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: coverUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />

          {/* Back Button */}
          <SafeAreaView style={styles.heroHeaderSafeArea}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Gym Header Meta */}
          <View style={styles.heroMetaBox}>
            <Text style={styles.gymTitle}>{gym?.name || 'Cult.fit Koramangala'}</Text>
            <View style={styles.metaBadgeRow}>
              <View style={styles.ratingBadge}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
              <View style={styles.distanceBadge}>
                <MapPin size={12} color="#9CA3AF" style={{ marginRight: 3 }} />
                <Text style={styles.distanceText}>0.4 km</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Open Now</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Facility Tag Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsScroll}
        >
          {DEFAULT_TAGS.map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={styles.tagPillText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 3. Membership Plans Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membership Plans</Text>
        </View>

        {/* 4. Plans List */}
        {plansLoading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Loading membership plans…</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Building2 size={32} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No Active Plans</Text>
            <Text style={styles.emptySub}>This gym has not published plans yet.</Text>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map((item) => {
              const isSelected = selectedPlanId === item.id;
              const durationLabel =
                item.durationDays === 1
                  ? '1 day'
                  : item.durationDays === 30
                  ? '30 days'
                  : `${item.durationDays} days`;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    item.isPopular && styles.planCardPopularBorder,
                  ]}
                  onPress={() => setSelectedPlanId(item.id)}
                >
                  <View style={styles.planCardTop}>
                    <View style={styles.planTitleCol}>
                      {item.isPopular && (
                        <View style={styles.popularBadge}>
                          <Sparkles size={10} color="#000000" style={{ marginRight: 3 }} />
                          <Text style={styles.popularBadgeText}>POPULAR</Text>
                        </View>
                      )}
                      <Text style={styles.planName}>{item.name}</Text>
                      <Text style={styles.planDuration}>{durationLabel}</Text>
                    </View>

                    <View style={styles.planRightCol}>
                      <Text style={styles.planPrice}>₹{item.price.toLocaleString()}</Text>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={[
                          styles.pickBtn,
                          isSelected && styles.pickBtnSelected,
                        ]}
                        onPress={() => setSelectedPlanId(item.id)}
                      >
                        <Text style={[styles.pickBtnText, isSelected && styles.pickBtnTextSelected]}>
                          {isSelected ? 'Picked' : 'Pick'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 5. Fixed Bottom Action Bar: Book Now Button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.bookNowBtn}
            onPress={handleInitiatePayment}
          >
            <Text style={styles.bookNowBtnText}>
              {selectedPlan ? `Book Now · ₹${selectedPlan.price.toLocaleString()}` : 'Book Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* 6. Checkout Progress Modal */}
      <Modal animationType="slide" transparent visible={checkoutOpen}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            {payPhase === 'loading' && (
              <View style={styles.modalState}>
                <ActivityIndicator size="large" color="#84CC16" />
                <Text style={styles.modalStateText}>Connecting to Razorpay Secure Gateway…</Text>
              </View>
            )}

            {payPhase === 'success' && (
              <View style={styles.modalState}>
                <View style={styles.successBadgeCircle}>
                  <Check size={36} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text style={styles.successTitleText}>Payment Successful!</Text>
                <Text style={styles.successSubText}>
                  Your membership with {gym?.name || 'the gym'} is now active.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0D0E11', // Dark luxury backdrop matching Cult.fit aesthetic
    },
    scrollContent: {
      paddingBottom: 180,
    },

    // Hero Section
    heroWrapper: {
      height: 260,
      width: '100%',
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    heroHeaderSafeArea: {
      position: 'absolute',
      top: Platform.OS === 'android' ? 12 : 0,
      left: 16,
      zIndex: 10,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroMetaBox: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
    },
    gymTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    metaBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 12,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    distanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    distanceText: {
      color: '#9CA3AF',
      fontSize: 13,
      fontWeight: '500',
    },
    statusBadge: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    statusText: {
      color: '#10B981',
      fontSize: 12,
      fontWeight: '700',
    },

    // Facility Tag Pills
    tagsScroll: {
      paddingHorizontal: 20,
      paddingVertical: 18,
      gap: 8,
    },
    tagPill: {
      backgroundColor: 'rgba(132, 204, 22, 0.12)', // Neon green pill tint
      borderWidth: 1,
      borderColor: 'rgba(132, 204, 22, 0.35)',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    tagPillText: {
      color: '#A3E635',
      fontSize: 13,
      fontWeight: '700',
    },

    // Section Header
    sectionHeader: {
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    // Plans List
    plansList: {
      paddingHorizontal: 20,
      gap: 14,
    },
    planCard: {
      backgroundColor: '#16181D',
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    planCardSelected: {
      borderColor: '#84CC16',
      backgroundColor: '#1C2114',
    },
    planCardPopularBorder: {
      borderColor: '#84CC16',
    },
    planCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    planTitleCol: {
      flex: 1,
    },
    popularBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#84CC16',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    popularBadgeText: {
      color: '#000000',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    planName: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    planDuration: {
      fontSize: 12.5,
      color: '#9CA3AF',
      marginTop: 2,
    },
    planRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    planPrice: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    pickBtn: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      paddingHorizontal: 18,
      paddingVertical: 8,
    },
    pickBtnSelected: {
      backgroundColor: '#84CC16',
    },
    pickBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    pickBtnTextSelected: {
      color: '#000000',
      fontWeight: '900',
    },

    // Empty & Loader
    loaderBox: {
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loaderText: {
      color: '#9CA3AF',
      fontSize: 13,
      marginTop: 10,
    },
    emptyCard: {
      marginHorizontal: 20,
      padding: 30,
      borderRadius: 18,
      backgroundColor: '#16181D',
      alignItems: 'center',
    },
    emptyTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      marginTop: 10,
    },
    emptySub: {
      color: '#9CA3AF',
      fontSize: 13,
      marginTop: 4,
    },

    // Fixed Bottom Action Bar
    bottomSafeArea: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 92 : 82,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
    },
    bottomBar: {
      paddingHorizontal: 20,
      paddingVertical: 6,
    },
    bookNowBtn: {
      backgroundColor: '#84CC16', // Neon vibrant green matching mockup
      borderRadius: 16,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#84CC16',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    bookNowBtnText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '900',
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalBody: {
      backgroundColor: '#16181D',
      borderRadius: 24,
      padding: 30,
      width: width - 40,
      alignItems: 'center',
    },
    modalState: {
      alignItems: 'center',
    },
    modalStateText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
      marginTop: 16,
      textAlign: 'center',
    },
    successBadgeCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#84CC16',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    successTitleText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '800',
    },
    successSubText: {
      color: '#9CA3AF',
      fontSize: 13,
      marginTop: 6,
      textAlign: 'center',
    },
  });
