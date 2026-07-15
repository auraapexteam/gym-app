import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, SafeAreaView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../theme/tokens';
import { Building2, Clock, Calendar, Phone, Mail, Award, X } from 'lucide-react-native';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

export function GymInfoScreen() {
  const { userProfile } = useAuthStore();
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGymInfo = async () => {
    if (!userProfile?.gym_id) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/gyms/${userProfile.gym_id}`);
      if (res.data?.success) {
        setGym(res.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load gym info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGymInfo();
  }, [userProfile?.gym_id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No gym information available.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Building2 size={44} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.title}>{gym.name}</Text>
          <Text style={styles.subtitle}>{gym.address || 'Address not listed'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🕒 Operating Timings</Text>
          <View style={styles.row}>
            <Clock size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>Weekdays: 06:00 AM - 10:00 PM</Text>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Calendar size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>Weekly Off: Sunday</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📞 Contact Information</Text>
          {!!gym.phone && (
            <View style={styles.row}>
              <Phone size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>{gym.phone}</Text>
            </View>
          )}
          {!!gym.email && (
            <View style={[styles.row, { marginTop: 6 }]}>
              <Mail size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>{gym.email}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 14, color: COLORS.textPrimary },
  errorText: { color: COLORS.textSecondary, fontSize: 15 },
});
