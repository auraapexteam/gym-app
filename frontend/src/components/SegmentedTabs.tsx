import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';

export interface TabOption {
  key?: string;
  id?: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedTabsProps {
  options?: TabOption[];
  tabs?: TabOption[];
  activeKey?: string;
  activeTab?: string;
  onChange?: (key: string) => void;
  onTabChange?: (key: string) => void;
  onSelect?: (key: string) => void;
  style?: ViewStyle;
}

export function SegmentedTabs({
  options,
  tabs,
  activeKey,
  activeTab,
  onChange,
  onTabChange,
  onSelect,
  style,
}: SegmentedTabsProps) {
  const items = options || tabs || [];
  const currentKey = activeKey || activeTab || '';
  const handleChange = onChange || onTabChange || onSelect || (() => {});

  return (
    <View style={[styles.container, style]}>
      {items.map((option, index) => {
        const optionKey = option.key || option.id || `tab-${index}`;
        const isActive = optionKey === currentKey;
        return (
          <TouchableOpacity
            key={optionKey}
            onPress={() => handleChange(optionKey)}
            activeOpacity={0.85}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            {option.icon ? (
              <View style={styles.iconContainer}>{option.icon}</View>
            ) : null}
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  iconContainer: {
    marginRight: 6,
  },
  tabText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.black,
    fontWeight: '800',
  },
});
