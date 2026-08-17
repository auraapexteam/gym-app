import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';
import { Check } from 'lucide-react-native';

interface SelectableCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function SelectableCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
  style,
}: SelectableCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, selected && styles.selectedCard, style]}
    >
      <View style={styles.contentRow}>
        {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
        <View style={styles.textContainer}>
          <Text style={[styles.title, selected && styles.selectedTitle]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, selected && styles.selectedSubtitle]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {selected ? (
          <View style={styles.checkBadge}>
            <Check size={18} color={colors.black} strokeWidth={2.5} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 10,
  },
  selectedCard: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  selectedTitle: {
    color: colors.black,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  selectedSubtitle: {
    color: '#1A2E05',
    fontWeight: '500',
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
