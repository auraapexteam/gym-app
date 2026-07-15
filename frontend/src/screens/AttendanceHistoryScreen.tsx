import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, SHADOWS } from '../theme/tokens';
import { Clock, Calendar } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function AttendanceHistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/attendance/me');
      if (res.data?.success) {
        setHistory(res.data.data.items || res.data.data || []);
      }
    } catch (err: any) {
      console.warn('Failed to load attendance history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
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
            <View style={styles.card}>
              <View style={styles.row}>
                <Calendar size={16} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={styles.dateText}>{formatDate(item.attendance_date || item.created_at)}</Text>
              </View>
              <View style={[styles.row, { marginTop: 6 }]}>
                <Clock size={14} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
                <Text style={styles.methodText}>Method: {(item.method || 'qr').toUpperCase()}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No attendance history found.</Text>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  methodText: { fontSize: 13, color: COLORS.textSecondary },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
