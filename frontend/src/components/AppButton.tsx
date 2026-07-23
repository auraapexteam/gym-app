import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Theme } from '../theme/Theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIconText?: string;
  rightIconText?: string;
  fullWidth?: boolean;
  children: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AppButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIconText,
  rightIconText,
  fullWidth = false,
  children,
  style,
  textStyle,
  disabled,
  ...props
}: AppButtonProps) {
  const isButtonDisabled = disabled || loading;

  // Resolve backgrounds and colors
  let buttonStyle: ViewStyle = {};
  let labelStyle: TextStyle = {};

  switch (variant) {
    case 'primary':
      buttonStyle = {
        backgroundColor: Theme.colors.primary,
        ...Theme.shadow.soft,
      };
      labelStyle = { color: '#FFFFFF' };
      break;
    case 'secondary':
      buttonStyle = {
        backgroundColor: Theme.colors.secondary,
        ...Theme.shadow.soft,
      };
      labelStyle = { color: '#FFFFFF' };
      break;
    case 'destructive':
      buttonStyle = {
        backgroundColor: Theme.colors.destructive,
        ...Theme.shadow.soft,
      };
      labelStyle = { color: '#FFFFFF' };
      break;
    case 'outline':
      buttonStyle = {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
      };
      labelStyle = { color: Theme.colors.foreground };
      break;
    case 'ghost':
      buttonStyle = {
        backgroundColor: 'transparent',
      };
      labelStyle = { color: Theme.colors.foreground };
      break;
  }

  // Resolve sizes
  let sizeStyle: ViewStyle = {};
  let sizeText: TextStyle = {};
  switch (size) {
    case 'sm':
      sizeStyle = { height: 40, paddingHorizontal: 16 };
      sizeText = { fontSize: 13 };
      break;
    case 'md':
      sizeStyle = { height: 48, paddingHorizontal: 24 };
      sizeText = { fontSize: 14 };
      break;
    case 'lg':
      sizeStyle = { height: 56, paddingHorizontal: 28 };
      sizeText = { fontSize: 16 };
      break;
  }

  return (
    <TouchableOpacity
      disabled={isButtonDisabled}
      style={[
        styles.baseButton,
        buttonStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        isButtonDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={labelStyle.color || '#FFFFFF'} size="small" />
      ) : (
        <>
          {leftIconText && <Text style={[styles.iconLeft, labelStyle]}>{leftIconText}</Text>}
          <Text style={[styles.labelText, labelStyle, sizeText, textStyle]}>
            {children}
          </Text>
          {rightIconText && <Text style={[styles.iconRight, labelStyle]}>{rightIconText}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.radius.round,
    marginVertical: 4,
  },
  labelText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
    fontSize: 16,
  },
  iconRight: {
    marginLeft: 8,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
});
