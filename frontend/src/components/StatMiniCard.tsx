import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { radii } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';

interface StatMiniCardProps {
  icon: React.ReactNode;
  iconBgColor?: string;
  value: string;
  label: string;
  style?: ViewStyle;
}

export function StatMiniCard({
  icon,
  iconBgColor = 'rgba(255, 255, 255, 0.08)',
  value,
  label,
  style,
}: StatMiniCardProps) {
  const { colors: themeColors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? themeColors.bgElevated : '#FFFFFF',
          borderColor: themeColors.surfaceBorder,
        },
        style,
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <Text style={[styles.valueText, { color: themeColors.textPrimary }]}>{value}</Text>
      <Text style={[styles.labelText, { color: isDark ? themeColors.textSecondary : '#4B5563' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '800',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
