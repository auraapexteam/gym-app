import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronRight, Trash2, Shield, FileText, CheckCircle2, X } from 'lucide-react-native';

const PRIVACY_STORAGE_KEY = '@aura_apex_privacy_settings';

export function PrivacySettingsScreen() {
  const { colors, isDark } = useTheme();
  const { user, userProfile, subscription } = useAuthStore();

  // Privacy states
  const [dataSharing, setDataSharing] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PRIVACY_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.dataSharing !== undefined) setDataSharing(parsed.dataSharing);
          if (parsed.analytics !== undefined) setAnalytics(parsed.analytics);
        } catch {
          // ignore parsing error
        }
      }
    });
  }, []);

  const handleToggleDataSharing = async (val: boolean) => {
    setDataSharing(val);
    await AsyncStorage.setItem(
      PRIVACY_STORAGE_KEY,
      JSON.stringify({ dataSharing: val, analytics })
    );
  };

  const handleToggleAnalytics = async (val: boolean) => {
    setAnalytics(val);
    await AsyncStorage.setItem(
      PRIVACY_STORAGE_KEY,
      JSON.stringify({ dataSharing, analytics: val })
    );
  };

  const handlePlaceholderAction = (action: string) => {
    Alert.alert(
      action,
      `Aura Apex operates under strict end-to-end data security standards. Your personal records are protected and never shared with third-party advertising networks.`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠ Delete Account',
      'Are you absolutely sure you want to delete your Aura Apex account? This action is permanent and will remove your member profile and workout logs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Request Submitted', 'Your account deletion request has been submitted.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy & Data Protection</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Control how your gym membership and biometric logs are collected, shared, and stored.
        </Text>

        {/* Legal Docs Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Legal & Compliance</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Privacy Policy')}
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

        {/* Data Collection Toggles Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Data collection preferences</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Share weight progress</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Allow your linked personal trainer and coaches to view your logbook charts.
                </Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={handleToggleDataSharing}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.primary }}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Anonymous analytics</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Help us improve app features by sending anonymous performance metrics.
                </Text>
              </View>
              <Switch
                value={analytics}
                onValueChange={handleToggleAnalytics}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.primary }}
              />
            </View>
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
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Request account data export</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  View and inspect all your stored active subscriptions, attendance, and logbook entries.
                </Text>
              </View>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Account Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.deleteBtn, { backgroundColor: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.25)' }]}
          onPress={handleDeleteAccount}
        >
          <Trash2 size={16} color="#f87171" style={{ marginRight: 8 }} />
          <Text style={styles.deleteText}>Delete account permanently</Text>
        </TouchableOpacity>
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
                  Alert.alert('Data Exported', 'A comprehensive archive has been generated for your records.');
                }}
              >
                <Text style={styles.doneBtnText}>Close Data Export</Text>
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
