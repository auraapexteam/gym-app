import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Theme } from '../theme/Theme';
import { useTheme } from '../context/ThemeContext';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIconText?: string;  // Unicode emoji or symbol like '✉', '🔒'
  passwordToggle?: boolean;
}

export function TextField({
  label,
  error,
  leftIconText,
  passwordToggle,
  secureTextEntry,
  style,
  ...props
}: TextFieldProps) {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isSecure = passwordToggle ? !showPassword : secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: colors.surfaceDark },
          isFocused && [styles.inputFocused, { borderColor: colors.primary, backgroundColor: colors.surface }],
          error && [styles.inputError, { borderColor: colors.destructive }],
        ]}
      >
        {leftIconText && <Text style={[styles.leftIcon, { color: colors.mutedForeground }]}>{leftIconText}</Text>}
        <TextInput
          style={[styles.input, { color: colors.foreground }, style]}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {passwordToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleButtonText}>
              {showPassword ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.radius.round,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {},
  inputError: {},
  leftIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    paddingVertical: 0,
  },
  toggleButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 8,
  },
});
