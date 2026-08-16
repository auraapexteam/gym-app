import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { useGymStore, PublicGym } from '../store/useGymStore';
import { Search, Building2, MapPin, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react-native';

const GYM_COVER_FALLBACKS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
];

export function GymDirectoryScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { loadUserProfile } = useAuthStore();
  const {
    directory,
    directoryLoading,
    directoryError,
    myRequest,
    requestStatusLoading,
    submitting,
    fetchDirectory,
    fetchMyRequestStatus,
    submitJoinRequest,
  } = useGymStore();

  const [search, setSearch] = useState('');
  // After a rejected request the user can still browse and apply elsewhere.
  const [browseAfterRejection, setBrowseAfterRejection] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchMyRequestStatus();
    fetchDirectory();
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch; store actions are stable
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => fetchDirectory(text), 300);
  };

  const handleJoin = async (gym: PublicGym) => {
    const result = await submitJoinRequest(gym.id);
    if (result.success) {
      setBrowseAfterRejection(false);
      Alert.alert('Request Sent', `Your join request has been sent to ${gym.name}.`);
      await loadUserProfile();
    } else {
      Alert.alert('Request Failed', result.message || 'Failed to submit request.');
    }
  };

  const handleRefreshStatus = async () => {
    await fetchMyRequestStatus();
    await loadUserProfile();
  };

  const isApproved = myRequest?.status === 'approved';
  const isRejected = myRequest?.status === 'rejected';
  const gymName = myRequest?.gyms?.name || 'the gym';

  if (requestStatusLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (myRequest && !(isRejected && browseAfterRejection)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.statusWrapper}>
          <View
            style={[
              styles.statusIconBadge,
              {
                backgroundColor: isApproved
                  ? colors.successSoft
                  : isRejected
                  ? colors.destructiveSoft
                  : colors.infoSoft,
              },
            ]}
          >
            {isApproved ? (
              <CheckCircle2 size={44} color={colors.success} />
            ) : isRejected ? (
              <XCircle size={44} color={colors.destructive} />
            ) : (
              <Clock size={44} color={colors.info} />
            )}
          </View>

          <Text style={styles.statusTitle}>
            {isApproved ? "You're in!" : isRejected ? 'Request declined' : 'Request pending'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isApproved
              ? `Your membership with ${gymName} is confirmed. Head back to set up your plan.`
              : isRejected
              ? `${gymName} declined your join request.`
              : `Waiting for ${gymName} to review your join request. This usually takes a day or two.`}
          </Text>

          <TouchableOpacity activeOpacity={0.85} style={styles.refreshBtn} onPress={handleRefreshStatus}>
            <Text style={styles.refreshBtnText}>Check for updates</Text>
          </TouchableOpacity>

          {isApproved ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
            >
              <Text style={styles.primaryBtnText}>Go to Home</Text>
            </TouchableOpacity>
          ) : isRejected ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
              onPress={() => setBrowseAfterRejection(true)}
            >
              <Building2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnText}>Browse Other Gyms</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'PlansTab', params: { gymId: myRequest.gym_id } })}
            >
              <Building2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnText}>View Plans & Join Instantly</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find your gym</Text>
        <Text style={styles.subtitle}>Browse gyms and request to join one.</Text>

        <View style={styles.searchBox}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder="Search by name or location"
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>
      </View>

      {directoryLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={directory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const coverImage = (item as any).coverUrl || (item as any).cover_url || (Array.isArray((item as any).images) && (item as any).images[0]) || GYM_COVER_FALLBACKS[index % GYM_COVER_FALLBACKS.length];
            const logoUrl = item.logoUrl;

            return (
              <View style={styles.card}>
                {/* Gym Cover Banner */}
                <View style={styles.cardBannerWrapper}>
                  <Image source={{ uri: coverImage }} style={styles.cardBannerImage} resizeMode="cover" />
                  <View style={styles.cardBannerOverlay} />
                  
                  <View style={styles.partnerBadge}>
                    <ShieldCheck size={12} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={styles.partnerBadgeText}>Verified Partner</Text>
                  </View>
                </View>

                {/* Content Section */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.cardLogoImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.cardIconBadge}>
                        <Building2 size={20} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.cardTitleGroup}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      {!!item.address && (
                        <View style={styles.addressRow}>
                          <MapPin size={11} color={colors.mutedForeground} />
                          <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {!!item.description && (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.viewPlansBtn}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'PlansTab', params: { gymId: item.id } })}
                  >
                    <Building2 size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.viewPlansBtnText}>View Plans & Join</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.joinBtnSecondary}
                    disabled={submitting}
                    onPress={() => handleJoin(item)}
                  >
                    <Text style={styles.joinBtnSecondaryText}>Or request manual approval</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              {directoryError ? (
                <>
                  <Text style={styles.emptyText}>{directoryError}</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.primaryBtn, { marginTop: 16 }]}
                    onPress={() => fetchDirectory(search)}
                  >
                    <Text style={styles.primaryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptyText}>No gyms found.</Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 8,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.foreground },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginTop: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.foreground },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBannerWrapper: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  },
  cardBannerImage: {
    width: '100%',
    height: '100%',
  },
  cardBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  partnerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  cardContent: {
    padding: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  cardTitleGroup: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '800', color: colors.foreground },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardAddress: { fontSize: 12, color: colors.mutedForeground, flex: 1 },
  cardDesc: { fontSize: 12, color: colors.mutedForeground, marginTop: 10, lineHeight: 17 },
  joinBtn: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  viewPlansBtn: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewPlansBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  joinBtnSecondary: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  joinBtnSecondaryText: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground },
  emptyText: { color: colors.mutedForeground, fontSize: 14 },
  statusWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  statusIconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: { fontSize: 22, fontWeight: '800', color: colors.foreground, textAlign: 'center' },
  statusSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  refreshBtn: {
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshBtnText: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 48,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
