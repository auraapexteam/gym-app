import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Calendar, QrCode } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function AttendanceHistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/attendance/me');
      if (res.data?.success) {
        setHistory(res.data.data.items || res.data.data || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load attendance history.');
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
                <Calendar size={18} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.dateText}>{formatDate(item.attendance_date || item.created_at)}</Text>
                <View style={styles.methodRow}>
                  <QrCode size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                  <Text style={styles.methodText}>Method: {(item.method || 'qr').toUpperCase()}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              {error ? (
                <>
                  <Text style={styles.emptyText}>{error}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchAttendance}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptyText}>No attendance history found.</Text>
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
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0 : 0.04,
    shadowRadius: 8,
    elevation: isDark ? 0 : 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  dateText: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  methodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  methodText: { fontSize: 12, color: colors.mutedForeground, fontWeight: '600' },
  emptyText: { color: colors.mutedForeground, fontSize: 15, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
