import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image, SafeAreaView } from 'react-native';
import { COLORS, SHADOWS } from '../theme/tokens';
import { BookOpen, Sparkles, ShieldCheck, Heart } from 'lucide-react-native';

export function BeginnerGuideScreen() {
  const sections = [
    {
      title: '1. Welcome to Aura Apex',
      desc: 'Embark on your fitness journey with precision tracking. Your mobile app allows you to link with your gym, scan attendance QR codes, track daily hydration/protein/weight, and manage your active subscriptions.',
      icon: <Sparkles size={20} color={COLORS.primary} />,
    },
    {
      title: '2. QR Attendance Logging',
      desc: 'Check-in automatically at the reception desk. Scan the active daily QR code from the front display screen using the built-in scanner to securely log your daily attendance.',
      icon: <ShieldCheck size={20} color={COLORS.success} />,
    },
    {
      title: '3. Progress Tracking Logbook',
      desc: 'Keep daily logs of your body weight (kg), water intake (ml), and protein consumption (g). Consistency is key to building healthy, long-lasting fitness habits.',
      icon: <Heart size={20} color={COLORS.danger} />,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <BookOpen size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.title}>Beginner's Guide</Text>
          <Text style={styles.subtitle}>Get started with Aura Apex Gym Management</Text>
        </View>

        {sections.map((sec, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              {sec.icon}
              <Text style={styles.cardTitle}>{sec.title}</Text>
            </View>
            <Text style={styles.cardDesc}>{sec.desc}</Text>
          </View>
        ))}

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Quick Fitness Tips</Text>
          <Text style={styles.tipText}>• Stay hydrated: Aim for at least 2.5 - 3 liters of water daily.</Text>
          <Text style={styles.tipText}>• High protein: Try to consume 1.6g - 2.2g of protein per kg of body weight.</Text>
          <Text style={styles.tipText}>• Rest & Recovery: Get 7-8 hours of quality sleep for muscle growth.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 8 },
  cardDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  tipsContainer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '1A',
  },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 10 },
  tipText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20, marginBottom: 4 },
});
