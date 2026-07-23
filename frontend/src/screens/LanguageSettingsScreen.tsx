import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Check } from 'lucide-react-native';

export function LanguageSettingsScreen() {
  const { colors } = useTheme();
  const [selectedLang, setSelectedLang] = useState('en');

  const languages = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
    { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  ];

  // Load saved language preference
  useEffect(() => {
    AsyncStorage.getItem('user-language').then((saved) => {
      if (saved) {
        setSelectedLang(saved);
      }
    });
  }, []);

  const handleSelectLanguage = async (code: string) => {
    setSelectedLang(code);
    await AsyncStorage.setItem('user-language', code);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Language</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose your default language for the Aura Apex app interface.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {languages.map((lang, idx) => {
            const isSelected = selectedLang === lang.code;

            return (
              <View key={lang.code}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.row}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      {lang.label}
                    </Text>
                    <Text style={[styles.nativeLabel, { color: colors.mutedForeground }]}>
                      {lang.nativeLabel}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
                {idx < languages.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    marginTop: 28,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
  nativeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
  },
});
