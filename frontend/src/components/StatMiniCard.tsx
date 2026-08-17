import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';

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
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <Text style={styles.valueText}>{value}</Text>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  labelText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
