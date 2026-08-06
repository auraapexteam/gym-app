import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldAlert,
  Smartphone,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';

export function SecuritySettingsScreen() {
  const { colors } = useTheme();
  
  // Toggles
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometric, setBiometric] = useState(true);

  const activeSessions = [
    { device: 'Redmi Note 12 Pro (This Device)', location: 'Bengaluru, India', date: 'Active now' },
    { device: 'Windows PC · Chrome Browser', location: 'Bengaluru, India', date: '2 days ago' },
  ];

  const handlePlaceholderAction = (action: string) => {
    Alert.alert(action, `This action represents the ${action} secure flow, which will integrate with your authentication backend API.`, [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Security</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage your account credentials, security preferences, and device logins.
        </Text>

        {/* Credentials Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Credentials</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Change Password')}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Change password</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Update Security PIN')}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Update security PIN</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Options Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Authentication</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Two-factor authentication</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Require verification code sent to your phone.
                </Text>
              </View>
              <Switch
                value={twoFactor}
                onValueChange={setTwoFactor}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.primary }}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Biometric login</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Log in using fingerprint sensor or face unlock.
                </Text>
              </View>
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Sessions Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Active Sessions</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {activeSessions.map((sess, idx) => (
              <View key={idx}>
                <View style={styles.sessionRow}>
                  <View style={[styles.sessionIconBg, { backgroundColor: colors.primarySoft }]}>
                    {idx === 0 ? (
                      <Smartphone size={16} color={colors.primary} />
                    ) : (
                      <ShieldAlert size={16} color={colors.secondary} />
                    )}
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionDevice, { color: colors.foreground }]}>{sess.device}</Text>
                    <Text style={[styles.sessionLocation, { color: colors.mutedForeground }]}>
                      {sess.location} · {sess.date}
                    </Text>
                  </View>
                </View>
                {idx < activeSessions.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Log Out All Devices Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.logoutAllBtn, { backgroundColor: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.25)' }]}
          onPress={() => handlePlaceholderAction('Logout from all devices')}
        >
          <LogOut size={16} color="#f87171" style={{ marginRight: 8 }} />
          <Text style={styles.logoutAllText}>Logout from all other devices</Text>
        </TouchableOpacity>
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
});
