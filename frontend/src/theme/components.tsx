import React from 'react';
import { View, Text as RNText, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';
import { typography } from './typography';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: theme.spacing(4) }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Text({
  children,
  variant = 'body',
  color,
  style,
  ...props
}: {
  children: React.ReactNode;
  variant?: keyof typeof typography;
  color?: string;
  style?: TextStyle;
  [key: string]: any;
}) {
  const { theme } = useTheme();
  const textStyle = typography[variant] || typography.body;
  return (
    <RNText
      style={[
        textStyle,
        { color: color || theme.colors.textPrimary },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.bgElevated,
          borderRadius: theme.radii.lg,
          padding: theme.spacing(4),
          borderWidth: 1,
          borderColor: theme.colors.surfaceBorder,
        },
        theme.shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Pill({
  children,
  active = false,
  style,
}: {
  children: React.ReactNode;
  active?: boolean;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing(3),
          paddingVertical: theme.spacing(1.5),
          backgroundColor: active ? theme.colors.accent : theme.colors.surface,
          borderWidth: 1,
          borderColor: active ? theme.colors.accent : theme.colors.surfaceBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  const { theme } = useTheme();
  return <View style={[{ height: 1, backgroundColor: theme.colors.divider }, style]} />;
}
