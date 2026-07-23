import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Smartphone, Check } from 'lucide-react-native';

export function ThemeSettingsScreen() {
  const { theme, colors, setTheme } = useTheme();

  const options = [
    {
      id: 'light',
      label: 'Light Mode',
      desc: 'Sleek, light appearance suitable for daytime workouts.',
      icon: Sun,
      color: '#eab308',
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      desc: 'Classic premium dark style, optimized for low light.',
      icon: Moon,
      color: '#6366f1',
    },
    {
      id: 'system',
      label: 'System Default',
      desc: 'Match your device appearance settings automatically.',
      icon: Smartphone,
      color: '#64748b',
    },
  ] as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Appearance</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose how Aura Apex appears on your device.
        </Text>

        <View style={styles.cardContainer}>
          {options.map((opt) => {
            const isSelected = theme === opt.id;
            const IconComp = opt.icon;

            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setTheme(opt.id)}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: opt.color + '1A' }]}>
                    <IconComp size={18} color={opt.color} />
                  </View>
                  <View style={styles.details}>
                    <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                      {opt.desc}
                    </Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
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
  cardContainer: {
    marginTop: 28,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
