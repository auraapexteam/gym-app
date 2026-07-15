import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { apiClient } from '../api/client';
import { COLORS, SHADOWS } from '../theme/tokens';
import { Bell, Check, Eye } from 'lucide-react-native';

export function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.items || res.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await apiClient.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post('/notifications/read-all');
      if (res.data?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        Alert.alert('Success', 'All notifications marked as read.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some((n) => !n.isRead) && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Check size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          onRefresh={() => {
            setRefreshing(true);
            fetchNotifications();
          }}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <View style={[styles.card, item.isRead && styles.readCard]}>
              <View style={styles.cardHeader}>
                <Bell size={18} color={item.isRead ? COLORS.textSecondary : COLORS.primary} />
                <Text style={[styles.cardTitle, item.isRead && styles.readText]}>
                  {item.title || 'System Notification'}
                </Text>
                {!item.isRead && (
                  <TouchableOpacity onPress={() => handleMarkRead(item.id)} style={styles.readBtn}>
                    <Eye size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.cardBody, item.isRead && styles.readText]}>
                {item.message}
              </Text>
              <Text style={styles.cardTime}>
                {new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>You have no notifications.</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  markAllBtn: { flexDirection: 'row', alignItems: 'center' },
  markAllText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  readCard: { opacity: 0.65, backgroundColor: COLORS.background },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginLeft: 8 },
  readText: { color: COLORS.textSecondary },
  readBtn: { padding: 4 },
  cardBody: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20, marginBottom: 8 },
  cardTime: { fontSize: 11, color: COLORS.textSecondary },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
