import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronRight, FileText, X } from 'lucide-react-native';
import { DeleteAccountButton } from '../components/DeleteAccountButton';
import { openPrivacyPolicy } from '../components/PrivacyPolicyLink';

export function PrivacySettingsScreen() {
  const { colors, isDark } = useTheme();
  const { user, userProfile, subscription } = useAuthStore();

  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handlePlaceholderAction = (action: string) => {
    Alert.alert(
      action,
      'This document is not available in this build.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy & Data Protection</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Review your account details and privacy information.
        </Text>

        {/* Legal Docs Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Legal & Compliance</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              accessibilityRole="link"
              accessibilityLabel="Privacy policy"
              onPress={openPrivacyPolicy}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Privacy policy</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Terms & Conditions')}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Terms & conditions</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Data Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Manage Account Data</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => setExportModalOpen(true)}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>View account summary</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  View your profile and current plan. This is not a complete data export.
                </Text>
              </View>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Account Button */}
        <DeleteAccountButton />
      </ScrollView>

      {/* Account Data Export Modal */}
      <Modal visible={exportModalOpen} transparent={true} animationType="slide" onRequestClose={() => setExportModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <FileText size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Account Data Summary</Text>
              </View>
              <TouchableOpacity onPress={() => setExportModalOpen(false)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              <View style={[styles.exportCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                <View style={styles.exportRow}>
                  <Text style={[styles.exportLabel, { color: colors.mutedForeground }]}>Registered Member:</Text>
                  <Text style={[styles.exportVal, { color: colors.foreground }]}>{userProfile?.full_name || 'Member'}</Text>
                </View>
                <View style={styles.exportRow}>
                  <Text style={[styles.exportLabel, { color: colors.mutedForeground }]}>Account Email:</Text>
                  <Text style={[styles.exportVal, { color: colors.foreground }]}>{user?.email || 'N/A'}</Text>
                </View>
                <View style={styles.exportRow}>
                  <Text style={[styles.exportLabel, { color: colors.mutedForeground }]}>Phone:</Text>
                  <Text style={[styles.exportVal, { color: colors.foreground }]}>{userProfile?.phone || 'Not provided'}</Text>
                </View>
                <View style={styles.exportRow}>
                  <Text style={[styles.exportLabel, { color: colors.mutedForeground }]}>Gym Status:</Text>
                  <Text style={[styles.exportVal, { color: colors.foreground }]}>{userProfile?.gym_id ? 'Linked to Gym' : 'Not Linked'}</Text>
                </View>
                <View style={styles.exportRow}>
                  <Text style={[styles.exportLabel, { color: colors.mutedForeground }]}>Active Plan:</Text>
                  <Text style={[styles.exportVal, { color: colors.foreground }]}>{subscription?.plans?.name || 'Standard'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setExportModalOpen(false);
                }}
              >
                <Text style={styles.doneBtnText}>Close summary</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLeft: {
    flex: 1,
    paddingRight: 16,
    gap: 3,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  deleteBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  deleteText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  exportCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  exportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportLabel: { fontSize: 13, fontWeight: '600' },
  exportVal: { fontSize: 13, fontWeight: '700' },
  doneBtn: {
    height: 48,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
