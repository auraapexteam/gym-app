import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Building2, Phone, Mail } from 'lucide-react-native';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatTime = (t?: string) => {
  if (!t) return '--';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

export function GymInfoScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { userProfile } = useAuthStore();
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGymInfo = async () => {
    if (!userProfile?.gym_id) return;
    try {
      setLoading(true);
      // /gyms/me resolves to the authenticated member's own linked gym and
      // includes contact fields — the public /gyms/:id endpoint deliberately
      // omits phone/email for directory browsing.
      const res = await apiClient.get('/gyms/me');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch only when gym_id changes
  }, [userProfile?.gym_id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIconBadge}>
            <Building2 size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>{gym.name}</Text>
          <Text style={styles.subtitle}>{gym.address || 'Address not listed'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Operating Timings</Text>
          {WEEKDAYS.map((day, idx) => {
            const isOff = (gym.weeklyOff || []).includes(day);
            const t = gym.timings?.[day];
            return (
              <View key={day} style={[styles.timingRow, idx === WEEKDAYS.length - 1 && { marginBottom: 0 }]}>
                <Text style={styles.timingDay}>{capitalize(day)}</Text>
                <Text style={[styles.timingHours, isOff && styles.timingClosed]}>
                  {isOff ? 'Closed' : t ? `${formatTime(t.open)} – ${formatTime(t.close)}` : 'Not set'}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {!!gym.phone && (
            <View style={styles.row}>
              <View style={[styles.iconBadge, { backgroundColor: colors.successSoft }]}>
                <Phone size={16} color={colors.success} />
              </View>
              <View style={styles.rowTextGroup}>
                <Text style={styles.infoText}>Phone</Text>
                <Text style={styles.infoSubtext}>{gym.phone}</Text>
              </View>
            </View>
          )}
          {!!gym.email && (
            <View style={[styles.row, { marginTop: gym.phone ? 12 : 0 }]}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
                <Mail size={16} color={colors.primary} />
              </View>
              <View style={styles.rowTextGroup}>
                <Text style={styles.infoText}>Email</Text>
                <Text style={styles.infoSubtext}>{gym.email}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  headerIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.foreground, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0 : 0.04,
    shadowRadius: 8,
    elevation: isDark ? 0 : 1,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timingDay: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  timingHours: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground },
  timingClosed: { color: colors.destructive },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowTextGroup: { justifyContent: 'center' },
  infoText: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  infoSubtext: { fontSize: 12, color: colors.mutedForeground, marginTop: 1, fontWeight: '500' },
  errorText: { color: colors.mutedForeground, fontSize: 15 },
});
