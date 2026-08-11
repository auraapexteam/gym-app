import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ChevronDown, ChevronUp, ChevronRight, Mail, Phone, MessageSquare } from 'lucide-react-native';

export function HelpSettingsScreen() {
  const { colors } = useTheme();

  // FAQ Expand state
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How do gym check-ins work?',
      a: 'Tap the QR Code button in the center of the bottom navigation bar. Point your screen toward the reception display scanner to automatically check in and log your attendance.',
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Yes, you can pause or cancel your active subscription plan directly under the Plans Tab or contact gym support. Your active period will remain valid until the expiration date.',
    },
    {
      q: 'How do I log my daily fitness metrics?',
      a: 'Go to the Logbook tab (Progress) or click "+ Log Today" on the Home dashboard. You can log weight (kg), water (L), and protein (g). Log entries are saved locally and synced.',
    },
  ];

  const handleToggleFaq = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const SUPPORT_EMAIL = 'support@auraapex.com';
  const SUPPORT_PHONE = '+919876543210';

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unavailable', 'No app on this device can handle that action.');
    }
  };

  const handleContactAction = (method: 'email' | 'phone' | 'feedback') => {
    if (method === 'email') {
      openLink(`mailto:${SUPPORT_EMAIL}`);
    } else if (method === 'phone') {
      openLink(`tel:${SUPPORT_PHONE}`);
    } else {
      openLink(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Aura Apex — Feedback / Bug Report')}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Help & Support</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Find answers to frequently asked questions or contact our support team.
        </Text>

        {/* FAQs list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FAQ</Text>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <View
                key={idx}
                style={[
                  styles.faqCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.faqHeader}
                  onPress={() => handleToggleFaq(idx)}
                >
                  <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{faq.q}</Text>
                  {isExpanded ? (
                    <ChevronUp size={16} color={colors.mutedForeground} />
                  ) : (
                    <ChevronDown size={16} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
                {isExpanded && (
                  <View style={[styles.faqDivider, { backgroundColor: colors.border }]}>
                    <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>{faq.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact info list card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Contact support</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handleContactAction('email')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Mail size={15} color="#6366f1" />
                </View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Email Support</Text>
              </View>
              <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>support@auraapex.com</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handleContactAction('phone')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Phone size={15} color="#10b981" />
                </View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Call Help Desk</Text>
              </View>
              <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>+91 98765 43210</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handleContactAction('feedback')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                  <MessageSquare size={15} color="#fbbf24" />
                </View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Send Feedback / Bug Report</Text>
              </View>
              <ChevronRight size={14} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 10,
    marginBottom: 8,
  },
  faqCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: 16,
  },
  faqDivider: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
});
