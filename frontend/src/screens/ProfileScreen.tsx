import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import { COLORS, SHADOWS } from '../theme/tokens';
import { User, Phone, Save, LogOut } from 'lucide-react-native';

export function ProfileScreen() {
  const { userProfile, signOut, loadUserProfile } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please fill in your full name.');
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.patch('/auth/me', {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      });

      if (res.data?.success) {
        Alert.alert('Profile Saved', 'Your profile details have been updated.');
        await loadUserProfile();
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Failed to update profile info.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(fullName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userEmail}>{userProfile?.email}</Text>
            <Text style={styles.userRole}>
              Role: {(userProfile?.role || 'Customer').toUpperCase()}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            <View style={styles.inputLabelRow}>
              <User size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>Full Name</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />

            <View style={styles.inputLabelRow}>
              <Phone size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>Phone Number</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <>
                  <Save size={18} color={COLORS.surface} style={{ marginRight: 8 }} />
                  <Text style={styles.saveText}>Save Profile</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
            <LogOut size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20 },
  header: { alignItems: 'center', marginVertical: 24 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.small,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  userEmail: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  userRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    marginBottom: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.danger + '33',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
});
