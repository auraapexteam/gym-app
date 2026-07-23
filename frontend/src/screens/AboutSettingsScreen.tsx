import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, ChevronRight, Globe, Share2, Star } from 'lucide-react-native';

export function AboutSettingsScreen() {
  const { colors } = useTheme();

  const handlePlaceholderAction = (action: string) => {
    Alert.alert(action, `This action triggers the ${action} system flow or opens the web link in the browser.`, [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Giant Logo/Brand card */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <Sparkles size={40} color={colors.primary} />
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>Aura Apex</Text>
          <Text style={[styles.brandMeta, { color: colors.mutedForeground }]}>
            Premium Gym Management Platform
          </Text>
        </View>

        {/* System parameters card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Version</Text>
            <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Build Number</Text>
            <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>102</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Developer</Text>
            <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>Apex Solutions Ltd</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Copyright</Text>
            <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>© 2026 Aura Gyms</Text>
          </View>
        </View>

        {/* Action triggers Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Actions</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Visit Website')}
            >
              <View style={styles.rowLeft}>
                <Globe size={15} color={colors.primary} />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Visit Website</Text>
              </View>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Rate App')}
            >
              <View style={styles.rowLeft}>
                <Star size={15} color="#fbbf24" />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Rate on App Store / Play Store</Text>
              </View>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Share App')}
            >
              <View style={styles.rowLeft}>
                <Share2 size={15} color="#10b981" />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Share Aura Apex app</Text>
              </View>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => handlePlaceholderAction('Open Source Software Licenses')}
            >
              <View style={styles.rowLeft}>
                <Globe size={15} color="#8b5cf6" />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Open source licenses</Text>
              </View>
              <ChevronRight size={14} color={colors.mutedForeground} />
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  brandMeta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  valueLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
});
