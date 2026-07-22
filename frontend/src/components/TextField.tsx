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
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isSecure = passwordToggle ? !showPassword : secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {leftIconText && <Text style={styles.leftIcon}>{leftIconText}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Theme.colors.mutedForeground}
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
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    color: Theme.colors.foreground,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEBE6', // Light gray background matching var(--surface-1)
    borderRadius: Theme.radius.round,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.surface,
  },
  inputError: {
    borderColor: Theme.colors.destructive,
  },
  leftIcon: {
    fontSize: 16,
    marginRight: 8,
    color: Theme.colors.mutedForeground,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Theme.colors.foreground,
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
    color: Theme.colors.destructive,
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 8,
  },
});
