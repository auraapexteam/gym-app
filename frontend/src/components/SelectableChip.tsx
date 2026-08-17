import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';
import { Check } from 'lucide-react-native';

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  showCheck?: boolean;
  style?: ViewStyle;
}

export function SelectableChip({
  label,
  selected,
  onPress,
  showCheck = false,
  style,
}: SelectableChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, selected && styles.selectedChip, style]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
      {selected && showCheck ? (
        <Check size={16} color={colors.black} style={styles.checkIcon} strokeWidth={2.5} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.black,
    fontWeight: '800',
  },
  checkIcon: {
    marginLeft: 6,
  },
});
