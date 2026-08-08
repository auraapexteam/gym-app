import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuthStore } from '../store/useAuthStore';
import { useGymStore } from '../store/useGymStore';
import { apiClient } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { uploadPersonalImage } from '../utils/upload';
import {
  User as UserIcon,
  Phone,
  Save,
  LogOut,
  ChevronRight,
  Bell,
  Dumbbell,
  Receipt,
  Settings,
  Camera,
} from 'lucide-react-native';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ProfileScreen({ navigation }: any) {
  const { userProfile, signOut, loadUserProfile, subscription } = useAuthStore();
  const { myRequest, fetchMyRequestStatus } = useGymStore();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);

  // Toggle editing fields
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  useEffect(() => {
    fetchMyRequestStatus();
    apiClient
      .get('/attendance/me')
      .then((res) => {
        if (res.data?.success) {
          const items = res.data.data.items || res.data.data || [];
          setAttendanceDates(items.map((i: any) => String(i.attendance_date || i.created_at).slice(0, 10)));
        }
      })
      .catch((err) => console.warn('Failed to load attendance for profile stats:', err));
  }, [fetchMyRequestStatus]);

  const streak = useMemo(() => {
    const dateSet = new Set(attendanceDates);
    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    let count = 0;
    let cursor = new Date();
    if (!dateSet.has(toIso(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (dateSet.has(toIso(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [attendanceDates]);

  const memberSince = useMemo(() => {
    if (!userProfile?.created_at) return '—';
    const d = new Date(userProfile.created_at);
    return `${MONTH_ABBR[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
  }, [userProfile?.created_at]);

  const gymName = userProfile?.gym_id ? myRequest?.gyms?.name || 'My Gym' : null;

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
        setIsEditing(false);
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Failed to update profile info.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1200, maxHeight: 1200 });
    if (result.didCancel || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    try {
      setUploadingAvatar(true);
      const publicUrl = await uploadPersonalImage(
        { uri: asset.uri, fileName: asset.fileName, type: asset.type, fileSize: asset.fileSize },
        'avatar'
      );
      const res = await apiClient.patch('/auth/me', { avatarUrl: publicUrl });
      if (res.data?.success) {
        await loadUserProfile();
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err.response?.data?.message || err.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const menuItems = [
    { icon: Bell, label: 'Notifications', meta: '', id: 'Notifications' },
    { icon: Dumbbell, label: 'Linked gym', meta: gymName || 'Not linked', id: gymName ? 'GymInfo' : 'GymDirectory' },
    { icon: Receipt, label: 'Subscription history', meta: '', id: 'SubscriptionHistory' },
    { icon: Settings, label: 'Settings', meta: '', id: 'Settings' },
  ];

  const isSubscribed = subscription?.status === 'active';
  const planName = subscription?.plans?.name;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Profile Header Block */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
                style={[styles.avatarCircle, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : userProfile?.avatar_url ? (
                  <Image source={{ uri: userProfile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.foreground }]}>
                    {(fullName || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
                <View style={[styles.avatarCameraBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                  <Camera size={11} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <View style={styles.userMeta}>
                <Text style={[styles.userName, { color: colors.foreground }]}>{fullName || 'Athlete'}</Text>
                <View style={styles.badgeRow}>
                  {isSubscribed ? (
                    <>
                      <View style={[styles.badgeIndigo, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.badgeIndigoText, { color: colors.primary }]}>{planName || 'Member'}</Text>
                      </View>
                      <View style={styles.badgeMint}>
                        <Text style={styles.badgeMintText}>Active</Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.badgeIndigo, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                      <Text style={[styles.badgeIndigoText, { color: colors.mutedForeground }]}>No active plan</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Settings Icon on top right */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Settings')}
              style={[styles.headerGearBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Settings size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statsValue, { color: colors.foreground }]}>{attendanceDates.length}</Text>
              <Text style={[styles.statsLabel, { color: colors.mutedForeground }]}>Check-ins</Text>
            </View>
            <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statsValue, { color: colors.foreground }]}>{streak}</Text>
              <Text style={[styles.statsLabel, { color: colors.mutedForeground }]}>Streak</Text>
            </View>
            <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statsValue, { color: colors.foreground }]}>{memberSince}</Text>
              <Text style={[styles.statsLabel, { color: colors.mutedForeground }]}>Member since</Text>
            </View>
          </View>

          {/* Menu Items Glass Box */}
          <View style={[styles.glassCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {menuItems.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View key={idx}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.menuRow}
                    onPress={() => {
                      if (item.id) {
                        navigation.navigate(item.id);
                      }
                    }}
                  >
                    <View style={styles.menuRowLeft}>
                      <View style={[styles.menuIconWrapper, { backgroundColor: colors.primarySoft }]}>
                        <IconComp size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                    </View>
                    <View style={styles.menuRowRight}>
                      {item.meta !== '' && <Text style={[styles.menuMeta, { color: colors.mutedForeground }]}>{item.meta}</Text>}
                      <ChevronRight size={14} color={colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                  {idx < menuItems.length - 1 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
                </View>
              );
            })}
          </View>

          {/* Account Edit Block */}
          {isEditing ? (
            <View style={[styles.glassCard, styles.editCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Edit Account Info</Text>

              <View style={styles.inputLabelRow}>
                <UserIcon size={14} color={colors.mutedForeground} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Full Name</Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceDark },
                ]}
                placeholder="Full Name"
                placeholderTextColor={colors.mutedForeground}
                value={fullName}
                onChangeText={setFullName}
              />

              <View style={styles.inputLabelRow}>
                <Phone size={14} color={colors.mutedForeground} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Phone Number</Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceDark },
                ]}
                placeholder="Phone Number"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.editActionRow}>
                <TouchableOpacity
                  style={[
                    styles.editBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                  ]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={[styles.saveText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={[styles.saveText, { color: '#FFFFFF' }]}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsEditing(true)}
              style={[styles.triggerEditBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.triggerEditText, { color: colors.foreground }]}>Edit Profile Details</Text>
            </TouchableOpacity>
          )}

          {/* Destructive Log out */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={signOut}
            activeOpacity={0.8}
          >
            <LogOut size={16} color="#f87171" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 24, // clear top notch/status bar on Android
    paddingBottom: 120, // increased padding to avoid tabbar overlaps
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
  },
  userMeta: {
    justifyContent: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badgeIndigo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeIndigoText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeMint: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeMintText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  headerGearBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statsLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  glassCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 8,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
  triggerEditBtn: {
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  triggerEditText: {
    fontSize: 13,
    fontWeight: '700',
  },
  editCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '700',
  },
});
