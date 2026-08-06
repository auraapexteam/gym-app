import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export function NotificationSettingsScreen() {
  const { colors } = useTheme();

  // Settings states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [eventEnabled, setEventEnabled] = useState(true);
  const [emergencyEnabled, setEmergencyEnabled] = useState(true);
  const [communityEnabled, setCommunityEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Load preferences
  useEffect(() => {
    AsyncStorage.getItem('notif-preferences').then((saved) => {
      if (saved) {
        try {
          const config = JSON.parse(saved);
          if (config.push !== undefined) setPushEnabled(config.push);
          if (config.event !== undefined) setEventEnabled(config.event);
          if (config.emergency !== undefined) setEmergencyEnabled(config.emergency);
          if (config.community !== undefined) setCommunityEnabled(config.community);
          if (config.sound !== undefined) setSoundEnabled(config.sound);
          if (config.vibration !== undefined) setVibrationEnabled(config.vibration);
          if (config.email !== undefined) setEmailEnabled(config.email);
        } catch {
          console.warn('Failed to parse saved notification preferences');
        }
      }
    });
  }, []);

  // Save preference handler
  const savePreference = async (key: string, value: boolean) => {
    const config = {
      push: key === 'push' ? value : pushEnabled,
      event: key === 'event' ? value : eventEnabled,
      emergency: key === 'emergency' ? value : emergencyEnabled,
      community: key === 'community' ? value : communityEnabled,
      sound: key === 'sound' ? value : soundEnabled,
      vibration: key === 'vibration' ? value : vibrationEnabled,
      email: key === 'email' ? value : emailEnabled,
    };
    await AsyncStorage.setItem('notif-preferences', JSON.stringify(config));
  };

  const notificationSections = [
    {
      title: 'Alert types',
      items: [
        {
          id: 'push',
          label: 'Push Notifications',
          desc: 'Receive quick push pings for daily tracking and logs.',
          value: pushEnabled,
          setValue: (val: boolean) => {
            setPushEnabled(val);
            savePreference('push', val);
          },
        },
        {
          id: 'event',
          label: 'Event Notifications',
          desc: 'Get notified of upcoming workshops or workshops schedules.',
          value: eventEnabled,
          setValue: (val: boolean) => {
            setEventEnabled(val);
            savePreference('event', val);
          },
        },
        {
          id: 'emergency',
          label: 'Emergency Alerts',
          desc: 'Crucial facility closure announcements or critical warnings.',
          value: emergencyEnabled,
          setValue: (val: boolean) => {
            setEmergencyEnabled(val);
            savePreference('emergency', val);
          },
        },
        {
          id: 'community',
          label: 'Community Announcements',
          desc: 'Stay updated on community posts and member stories.',
          value: communityEnabled,
          setValue: (val: boolean) => {
            setCommunityEnabled(val);
            savePreference('community', val);
          },
        },
      ],
    },
    {
      title: 'Alert channels',
      items: [
        {
          id: 'sound',
          label: 'Sound Alerts',
          desc: 'Play standard notification ringtones upon alerts.',
          value: soundEnabled,
          setValue: (val: boolean) => {
            setSoundEnabled(val);
            savePreference('sound', val);
          },
        },
        {
          id: 'vibration',
          label: 'Vibration feedback',
          desc: 'Enable haptic vibrations on new incoming updates.',
          value: vibrationEnabled,
          setValue: (val: boolean) => {
            setVibrationEnabled(val);
            savePreference('vibration', val);
          },
        },
        {
          id: 'email',
          label: 'Email Notifications',
          desc: 'Send periodic summary digests to your registered email.',
          value: emailEnabled,
          setValue: (val: boolean) => {
            setEmailEnabled(val);
            savePreference('email', val);
          },
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Control which notifications you receive and how they alert you.
        </Text>

        {notificationSections.map((sec, sIdx) => (
          <View key={sIdx} style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {sec.title}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {sec.items.map((item, iIdx) => (
                <View key={item.id}>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                        {item.desc}
                      </Text>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={item.setValue}
                      trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.primary }}
                      thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                    />
                  </View>
                  {iIdx < sec.items.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
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
  sectionContainer: {
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
  divider: {
    height: 1,
  },
});
