import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { useGymStore, PublicGym } from '../store/useGymStore';
import { Search, Building2, MapPin, Clock, Send, CheckCircle2, XCircle } from 'lucide-react-native';

export function GymDirectoryScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { loadUserProfile } = useAuthStore();
  const {
    directory,
    directoryLoading,
    myRequest,
    requestStatusLoading,
    submitting,
    fetchDirectory,
    fetchMyRequestStatus,
    submitJoinRequest,
  } = useGymStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMyRequestStatus();
    fetchDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch; store actions are stable
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchDirectory(text);
  };

  const handleJoin = (gym: PublicGym) => {
    Alert.alert(
      `Request to join ${gym.name}?`,
      "The gym owner will review your request. You'll see the status here once submitted.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            const result = await submitJoinRequest(gym.id);
            if (!result.success) {
              Alert.alert('Request Failed', result.message || 'Could not submit your request.');
            }
          },
        },
      ]
    );
  };

  const handleRefreshStatus = async () => {
    await fetchMyRequestStatus();
    await loadUserProfile();
  };

  // Once a request exists, hide the browsing directory entirely per spec.
  if (requestStatusLoading && !myRequest) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (myRequest) {
    const isApproved = myRequest.status === 'approved';
    const isRejected = myRequest.status === 'rejected';
    const gymName = myRequest.gyms?.name || 'the gym';

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
              <CheckCircle2 size={40} color={colors.success} />
            ) : isRejected ? (
              <XCircle size={40} color={colors.destructive} />
            ) : (
              <Clock size={40} color={colors.info} />
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

          {isApproved && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
            >
              <Text style={styles.primaryBtnText}>Go to Home</Text>
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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardIconBadge}>
                  <Building2 size={20} color={colors.primary} />
                </View>
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
                style={styles.joinBtn}
                disabled={submitting}
                onPress={() => handleJoin(item)}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.joinBtnText}>Request to Join</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No gyms found.</Text>
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
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
