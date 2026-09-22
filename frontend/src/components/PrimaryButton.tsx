import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';

interface PrimaryButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  title,
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: PrimaryButtonProps) {
  const displayText = title || label || '';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.button,
        isDisabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.black} size="small" />
      ) : (
        <>
          <Text style={[styles.text, isDisabled && styles.disabledText, textStyle]} numberOfLines={1} adjustsFontSizeToFit>
            {displayText}
          </Text>
          {icon ? icon : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    backgroundColor: colors.accent,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#263211',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledText: {
    color: '#6B7280',
  },
});
