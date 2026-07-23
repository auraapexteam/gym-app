import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ChevronRight, ShieldCheck } from 'lucide-react-native';

export function AppSettingsScreen() {
  const { colors } = useTheme();
  const [cacheSize, setCacheSize] = useState('14.2 MB');
  const [clearing, setClearing] = useState(false);

  const permissionsList = [
    { label: 'Camera Permission', status: 'Granted' },
    { label: 'Storage Access', status: 'Granted' },
    { label: 'Notifications Access', status: 'Granted' },
  ];

  const handleClearCache = () => {
    if (cacheSize === '0.0 KB') {
      Alert.alert('Cache Clean', 'App cache is already cleared.');
      return;
    }
    
    setClearing(true);
    setTimeout(() => {
      setClearing(false);
      setCacheSize('0.0 KB');
      Alert.alert('Success', 'Cache cleared successfully.');
    }, 1200);
  };

  const handlePlaceholderAction = (action: string) => {
    Alert.alert(action, `This action represents the ${action} config screen, which will integrate with native device APIs.`, [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Storage & Cache</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage disk space, clear cached images, and check device permissions.
        </Text>

        {/* Cache management card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Cache management</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>App cache size</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Temporary image assets and session cache.
                </Text>
              </View>
              <Text style={[styles.valueLabel, { color: colors.foreground }]}>{cacheSize}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.clearRow}
              onPress={handleClearCache}
              disabled={clearing}
            >
              {clearing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.clearText, { color: colors.primary }]}>Clear cached assets</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Storage stats Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Storage details</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Total space used</Text>
              <Text style={[styles.valueLabel, { color: colors.foreground }]}>84.0 MB</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Manage Storage Preferences')}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Storage settings</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Permissions Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>App permissions</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {permissionsList.map((perm, idx) => (
              <View key={idx}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowLabel, { color: colors.foreground }]}>{perm.label}</Text>
                  </View>
                  <View style={styles.badgeRow}>
                    <ShieldCheck size={14} color={colors.success} style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: colors.success }]}>{perm.status}</Text>
                  </View>
                </View>
                {idx < permissionsList.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
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
  clearRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '800',
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
  valueLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
