import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface ProgressRingProps {
  percentage: number; // 0 to 100
  color: string;
  size?: number;
  strokeWidth?: number;
  centerText: string;
  subLabel: string;
}

export function ProgressRing({
  percentage,
  color,
  size = 84,
  strokeWidth = 7,
  centerText,
  subLabel,
}: ProgressRingProps) {
  const { colors: themeColors, isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percentage))) / 100;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? '#262626' : '#E5E7EB'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View pointerEvents="none" style={styles.centerContent}>
          <Text style={[styles.centerText, { color: themeColors.textPrimary }]}>{centerText}</Text>
        </View>
      </View>
      <Text style={[styles.subLabel, { color: isDark ? themeColors.textSecondary : '#4B5563' }]}>{subLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  subLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
});
