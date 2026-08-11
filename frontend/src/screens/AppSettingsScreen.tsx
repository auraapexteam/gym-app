import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  PermissionsAndroid,
  Platform,
  AppState,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, ShieldAlert, ExternalLink } from 'lucide-react-native';

type PermissionStatus = 'granted' | 'denied' | 'unknown';

export function AppSettingsScreen() {
  const { colors } = useTheme();
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('unknown');
  const [notifStatus, setNotifStatus] = useState<PermissionStatus>('unknown');

  const checkPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const camera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      setCameraStatus(camera ? 'granted' : 'denied');
    } catch {
      setCameraStatus('unknown');
    }
    try {
      // POST_NOTIFICATIONS only exists on Android 13+; older versions grant implicitly.
      if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
        const notif = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        setNotifStatus(notif ? 'granted' : 'denied');
      } else {
        setNotifStatus('granted');
      }
    } catch {
      setNotifStatus('unknown');
    }
  }, []);

  useEffect(() => {
    checkPermissions();
    // Re-check when returning from the system settings screen.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermissions();
    });
    return () => sub.remove();
  }, [checkPermissions]);

  const permissionsList: { label: string; desc: string; status: PermissionStatus }[] = [
    { label: 'Camera', desc: 'Used to scan gym check-in QR codes.', status: cameraStatus },
    { label: 'Notifications', desc: 'Allows gym announcements to alert you.', status: notifStatus },
  ];

  const statusLabel = (s: PermissionStatus) =>
    s === 'granted' ? 'Granted' : s === 'denied' ? 'Not granted' : '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Storage & Permissions</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Review the device permissions this app uses and manage its storage from system settings.
        </Text>

        {/* Permissions Card — real, live statuses. */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>App permissions</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {permissionsList.map((perm, idx) => {
              const granted = perm.status === 'granted';
              return (
                <View key={perm.label}>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{perm.label}</Text>
                      <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{perm.desc}</Text>
                    </View>
                    <View
                      style={[
                        styles.badgeRow,
                        { backgroundColor: granted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(251, 191, 36, 0.12)' },
                      ]}
                    >
                      {granted ? (
                        <ShieldCheck size={14} color={colors.success} style={{ marginRight: 4 }} />
                      ) : (
                        <ShieldAlert size={14} color={colors.secondary} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.badgeText,
                          { color: granted ? colors.success : colors.secondary },
                        ]}
                      >
                        {statusLabel(perm.status)}
                      </Text>
                    </View>
                  </View>
                  {idx < permissionsList.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* System settings link — storage and cache are managed by Android. */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Storage</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => Linking.openSettings()}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Open system app settings</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  View storage usage, clear cache, or change permissions from Android settings.
                </Text>
              </View>
              <ExternalLink size={16} color={colors.mutedForeground} />
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
  },
});
