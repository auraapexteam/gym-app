import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import {
  Dumbbell,
  Activity,
  Apple,
  ChevronDown,
  Clock,
  Phone,
  Mail,
  Building2,
} from 'lucide-react-native';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const formatTime = (t?: string) => {
  if (!t) return '--';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

interface Guide {
  id: string;
  category: 'Workout' | 'Posture' | 'Nutrition';
  title: string;
  body: string;
}

const GUIDES: Guide[] = [
  {
    id: 'warmup',
    category: 'Workout',
    title: 'Warm up before every session',
    body: 'Spend 5–10 minutes on light cardio and dynamic stretches before lifting. It raises your heart rate and prepares your joints, lowering injury risk.',
  },
  {
    id: 'fullbody',
    category: 'Workout',
    title: 'A full-body beginner routine',
    body: '3 sets of 8–12 reps each: squats, push-ups, rows, and planks. Rest 60–90 seconds between sets and focus on form over weight for the first few weeks.',
  },
  {
    id: 'progressive-overload',
    category: 'Workout',
    title: 'Progress gradually',
    body: 'Add small amounts of weight or reps week over week once a movement feels easy. Consistent small increases beat occasional big jumps.',
  },
  {
    id: 'posture-squat',
    category: 'Posture',
    title: 'Squat form basics',
    body: 'Keep your chest up, weight through your heels, and knees tracking over your toes. Go as low as comfortable while keeping your back neutral.',
  },
  {
    id: 'posture-deadlift',
    category: 'Posture',
    title: 'Deadlift safety',
    body: 'Keep the bar close to your shins, brace your core, and drive through your heels. Never round your lower back to lift more weight.',
  },
  {
    id: 'posture-desk',
    category: 'Posture',
    title: 'Undoing a day of sitting',
    body: 'Chest-opener and hip-flexor stretches before training help counter a day of sitting and improve range of motion during lifts.',
  },
  {
    id: 'nutrition-protein',
    category: 'Nutrition',
    title: 'How much protein do you need?',
    body: 'A common guideline for active adults is roughly 1.6–2.2g of protein per kg of bodyweight per day, spread across your meals.',
  },
  {
    id: 'nutrition-meals',
    category: 'Nutrition',
    title: 'Pre- and post-workout meals',
    body: 'Eat a balanced meal with carbs and protein 1–2 hours before training, and refuel with protein plus carbs within a couple of hours after.',
  },
  {
    id: 'nutrition-water',
    category: 'Nutrition',
    title: 'Staying hydrated',
    body: 'Aim to drink water throughout the day, not just during workouts. Thirst is a lagging signal — sip regularly rather than waiting to feel thirsty.',
  },
];

const CATEGORY_META: Record<Guide['category'], { icon: any; color: string }> = {
  Workout: { icon: Dumbbell, color: '#6366f1' },
  Posture: { icon: Activity, color: '#10b981' },
  Nutrition: { icon: Apple, color: '#f87171' },
};

export function BeginnerGuideScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { userProfile } = useAuthStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gym, setGym] = useState<any>(null);
  const [loadingGym, setLoadingGym] = useState(true);

  useEffect(() => {
    if (!userProfile?.gym_id) {
      setLoadingGym(false);
      return;
    }
    apiClient
      .get('/gyms/me')
      .then((res) => {
        if (res.data?.success) setGym(res.data.data);
      })
      .catch((err) => console.warn('Failed to load gym schedule:', err))
      .finally(() => setLoadingGym(false));
  }, [userProfile?.gym_id]);

  const categories: Guide['category'][] = ['Workout', 'Posture', 'Nutrition'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Beginner Guide</Text>
        <Text style={styles.subtitle}>Everything you need to get started, safely.</Text>

        {categories.map((category) => {
          const meta = CATEGORY_META[category];
          const CategoryIcon = meta.icon;
          return (
            <View key={category} style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconBadge, { backgroundColor: meta.color + '26' }]}>
                  <CategoryIcon size={14} color={meta.color} />
                </View>
                <Text style={styles.sectionTitle}>{category}</Text>
              </View>

              <View style={styles.card}>
                {GUIDES.filter((g) => g.category === category).map((guide, idx, arr) => {
                  const isOpen = expandedId === guide.id;
                  return (
                    <View key={guide.id}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.guideRow}
                        onPress={() => setExpandedId(isOpen ? null : guide.id)}
                      >
                        <Text style={styles.guideTitle}>{guide.title}</Text>
                        <ChevronDown
                          size={16}
                          color={colors.mutedForeground}
                          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                        />
                      </TouchableOpacity>
                      {isOpen && <Text style={styles.guideBody}>{guide.body}</Text>}
                      {idx < arr.length - 1 && <View style={styles.divider} />}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Gym Schedule & Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: colors.primarySoft }]}>
              <Building2 size={14} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Gym Schedule & Support</Text>
          </View>

          <View style={styles.card}>
            {loadingGym ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
            ) : gym ? (
              <>
                {WEEKDAYS.map((day) => {
                  const isOff = (gym.weeklyOff || []).includes(day);
                  const t = gym.timings?.[day];
                  return (
                    <View key={day} style={styles.timingRow}>
                      <Text style={styles.timingDay}>{capitalize(day)}</Text>
                      <Text style={[styles.timingHours, isOff && { color: colors.destructive }]}>
                        {isOff ? 'Closed' : t ? `${formatTime(t.open)} – ${formatTime(t.close)}` : 'Not set'}
                      </Text>
                    </View>
                  );
                })}

                {(!!gym.phone || !!gym.email) && <View style={styles.divider} />}

                {!!gym.phone && (
                  <View style={styles.supportRow}>
                    <Phone size={14} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                    <Text style={styles.supportText}>{gym.phone}</Text>
                  </View>
                )}
                {!!gym.email && (
                  <View style={[styles.supportRow, { marginTop: gym.phone ? 6 : 0 }]}>
                    <Mail size={14} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                    <Text style={styles.supportText}>{gym.email}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyGymRow}>
                <Clock size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <Text style={styles.supportText}>Join a gym to see its schedule and support contact.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.foreground,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  guideTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    marginRight: 12,
  },
  guideBody: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 19,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timingDay: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  timingHours: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  supportText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyGymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
});
