import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Award, Calendar, XCircle } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function SubscriptionHistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/subscriptions/me');
      if (res.data?.success) {
        setHistory(res.data.data.items || res.data.data || []);
      }
    } catch (err: any) {
      console.warn('Failed to load subscription history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCancelSubscription = async (id: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription? This will stop access at the end of the current billing cycle.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await apiClient.post(`/subscriptions/${id}/cancel`);
              if (res.data?.success) {
                Alert.alert('Cancelled', 'Your subscription was cancelled successfully.');
                fetchHistory();
              }
            } catch (err: any) {
              Alert.alert('Failed', err.response?.data?.message || 'Failed to cancel subscription.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && history.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isActive = item.status === 'active';
            return (
              <View style={styles.card}>
                <View style={styles.headerRow}>
                  <View style={[styles.iconBadge, { backgroundColor: isActive ? colors.successSoft : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]}>
                    <Award size={16} color={isActive ? colors.success : colors.mutedForeground} />
                  </View>
                  <Text style={styles.planName}>{item.plans?.name || 'Gym Plan'}</Text>
                  <View style={[styles.statusPill, { backgroundColor: isActive ? colors.successSoft : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]}>
                    <Text style={[styles.statusText, { color: isActive ? colors.success : colors.mutedForeground }]}>
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <Calendar size={14} color={colors.mutedForeground} style={{ marginRight: 6 }} />
                  <Text style={styles.dateText}>
                    {formatDate(item.start_date)} - {formatDate(item.end_date)}
                  </Text>
                </View>

                {isActive && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelSubscription(item.id)}
                  >
                    <XCircle size={14} color={colors.destructive} style={{ marginRight: 6 }} />
                    <Text style={styles.cancelText}>Cancel Subscription</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No subscription history found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0 : 0.04,
    shadowRadius: 8,
    elevation: isDark ? 0 : 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  planName: { fontSize: 15, fontWeight: '700', color: colors.foreground, flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 13, color: colors.foreground, fontWeight: '600' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: colors.destructiveSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelText: { fontSize: 12, fontWeight: '700', color: colors.destructive },
  emptyText: { color: colors.mutedForeground, fontSize: 15 },
});
