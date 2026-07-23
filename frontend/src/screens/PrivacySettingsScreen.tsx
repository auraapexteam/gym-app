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
import { ChevronRight, Trash2 } from 'lucide-react-native';

export function PrivacySettingsScreen() {
  const { colors } = useTheme();
  
  // Privacy states
  const [dataSharing, setDataSharing] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  const handlePlaceholderAction = (action: string) => {
    Alert.alert(action, `You requested the ${action} section. In production, this opens a web viewer displaying your terms or sends a request to the backend.`, [{ text: 'OK' }]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠ Delete Account',
      'Are you absolutely sure you want to delete your Aura Apex account? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Request Submitted', 'Your account deletion request has been submitted to the admin panel.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Control how your gym membership data is collected, shared, and stored.
        </Text>

        {/* Legal Docs Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Documents</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Data collection</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Share weight progress</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Allow your linked personal trainer to view your logbook charts.
                </Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={setDataSharing}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.primary }}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Anonymous analytics</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Help us improve app features by sending usage metrics anonymously.
                </Text>
              </View>
              <Switch
                value={analytics}
                onValueChange={setAnalytics}
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
              onPress={() => handlePlaceholderAction('Request Account Data Export')}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Request account data export</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Receive a file containing your active subscriptions and logs.
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
});
