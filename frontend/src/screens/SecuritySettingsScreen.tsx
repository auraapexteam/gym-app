import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../api/supabase';
import {
  Smartphone,
  ChevronRight,
  LogOut,
  Key,
  X,
} from 'lucide-react-native';

export function SecuritySettingsScreen() {
  const { colors, isDark } = useTheme();
  const { user, signOut } = useAuthStore();

  // Password modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async () => {
    // Mirror the signup policy so users can't set a weaker password here.
    const strongEnough =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;'/]/.test(newPassword);
    if (!strongEnough) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include an uppercase letter, a number, and a special symbol.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Alert.alert('Password Updated', 'Your account password has been changed successfully.');
      setPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    Alert.alert(
      'Global Logout',
      'This will invalidate all active sessions across all phones and web browsers. You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out Everywhere',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut({ scope: 'global' });
              await signOut();
            } catch {
              await signOut();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Security</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage your account credentials, security preferences, and active sessions.
        </Text>

        {/* Credentials Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Credentials</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => setPasswordModalOpen(true)}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Change password</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Update your master account login password.
                </Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sessions Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Active Sessions</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sessionRow}>
              <View style={[styles.sessionIconBg, { backgroundColor: colors.primarySoft }]}>
                <Smartphone size={16} color={colors.primary} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionDevice, { color: colors.foreground }]}>
                  {Platform.OS === 'android' ? 'Android Native Mobile' : 'iOS Apple Device'} (Current Device)
                </Text>
                <Text style={[styles.sessionLocation, { color: colors.mutedForeground }]}>
                  {user?.email || 'Logged In'} · Active Session
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Log Out All Devices Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.logoutAllBtn, { backgroundColor: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.25)' }]}
          onPress={handleLogoutAllDevices}
        >
          <LogOut size={16} color="#f87171" style={{ marginRight: 8 }} />
          <Text style={styles.logoutAllText}>Sign out from all devices</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal visible={passwordModalOpen} transparent={true} animationType="slide" onRequestClose={() => setPasswordModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Key size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Change Password</Text>
              </View>
              <TouchableOpacity onPress={() => setPasswordModalOpen(false)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>New Password (min 8 chars)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border, color: colors.foreground }]}
              placeholder="Enter new password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={true}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={[styles.inputLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border, color: colors.foreground }]}
              placeholder="Confirm new password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
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
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sessionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '700',
  },
  sessionLocation: {
    fontSize: 11,
    fontWeight: '500',
  },
  logoutAllBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  logoutAllText: {
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
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    height: 48,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
