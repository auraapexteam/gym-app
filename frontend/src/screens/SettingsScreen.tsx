import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import {
  ChevronRight,
  Palette,
  Bell,
  Globe,
  Lock,
  Eye,
  Settings,
  HelpCircle,
  Info,
  GraduationCap,
} from 'lucide-react-native';

export function SettingsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userProfile } = useAuthStore();

  const settingsGroups = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'ThemeSettings',
          label: 'Theme appearance',
          icon: Palette,
          color: colors.primary,
        },
        {
          id: 'NotificationSettings',
          label: 'Notifications',
          icon: Bell,
          color: colors.success,
        },
        {
          id: 'LanguageSettings',
          label: 'Language preference',
          icon: Globe,
          color: colors.info,
        },
      ],
    },
    {
      title: 'Security & Access',
      items: [
        {
          id: 'SecuritySettings',
          label: 'Security & login',
          icon: Lock,
          color: colors.secondary,
        },
        {
          id: 'PrivacySettings',
          label: 'Privacy policy',
          icon: Eye,
          color: colors.destructive,
        },
        {
          id: 'AppSettings',
          label: 'Storage & cache',
          icon: Settings,
          color: '#64748b',
        },
      ],
    },
    {
      title: 'Support & Info',
      items: [
        {
          id: 'BeginnerGuide',
          label: 'Beginner guide',
          icon: GraduationCap,
          color: '#22c55e',
        },
        {
          id: 'HelpSettings',
          label: 'Help & support',
          icon: HelpCircle,
          color: '#0ea5e9',
        },
        {
          id: 'AboutSettings',
          label: 'About Aura Apex',
          icon: Info,
          color: '#8b5cf6',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Simple User Portal Card Header */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.foreground }]}>
              {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
          <View style={styles.headerDetails}>
            <Text style={[styles.headerName, { color: colors.foreground }]}>
              {userProfile?.full_name || 'Athlete'}
            </Text>
            <Text style={[styles.headerEmail, { color: colors.mutedForeground }]}>
              {userProfile?.email || 'member@auraapex.com'}
            </Text>
          </View>
        </View>

        {/* Settings categories groups rendering */}
        {settingsGroups.map((group, gIdx) => (
          <View key={gIdx} style={styles.groupContainer}>
            <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>
              {group.title}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {group.items.map((item, iIdx) => {
                const IconComp = item.icon;
                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.rowBtn}
                      onPress={() => navigation.navigate(item.id)}
                    >
                      <View style={styles.rowLeft}>
                        <View style={[styles.iconWrapper, { backgroundColor: item.color + '1A' }]}>
                          <IconComp size={16} color={item.color} />
                        </View>
                        <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                          {item.label}
                        </Text>
                      </View>
                      <ChevronRight size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                    {iIdx < group.items.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          Aura Apex · Version 1.0.0 (102)
        </Text>
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerDetails: {
    marginLeft: 14,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerEmail: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupTitle: {
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
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  rowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
