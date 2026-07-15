import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../theme/tokens';
import { Award, Clock, Calendar, ShieldCheck, XCircle } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function SubscriptionHistoryScreen() {
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
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, item.status === 'active' ? styles.activeCard : styles.inactiveCard]}>
              <View style={styles.headerRow}>
                <Award size={18} color={item.status === 'active' ? COLORS.success : COLORS.textSecondary} />
                <Text style={styles.planName}>{item.plans?.name || 'Gym Plan'}</Text>
                <Text style={[styles.statusText, item.status === 'active' ? styles.activeText : styles.inactiveText]}>
                  {item.status?.toUpperCase()}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Calendar size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.dateText}>
                  {formatDate(item.start_date)} - {formatDate(item.end_date)}
                </Text>
              </View>

              {item.status === 'active' && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancelSubscription(item.id)}
                >
                  <XCircle size={14} color={COLORS.danger} style={{ marginRight: 6 }} />
                  <Text style={styles.cancelText}>Cancel Subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  activeCard: { borderLeftWidth: 4, borderLeftColor: COLORS.success },
  inactiveCard: { borderLeftWidth: 4, borderLeftColor: COLORS.textSecondary },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  activeText: { color: COLORS.success },
  inactiveText: { color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 13, color: COLORS.textPrimary },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.danger + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelText: { fontSize: 12, fontWeight: '700', color: COLORS.danger },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
