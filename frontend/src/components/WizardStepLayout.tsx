import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme/tokens';
import { ChevronLeft } from 'lucide-react-native';
import { PrimaryButton } from './PrimaryButton';

interface WizardStepLayoutProps {
  currentStep: number;
  totalSteps?: number;
  emoji: string;
  title: string;
  subtitle: string;
  onBack: () => void;
  onNext: () => void;
  canContinue?: boolean;
  nextButtonLabel?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export function WizardStepLayout({
  currentStep,
  totalSteps = 11,
  emoji,
  title,
  subtitle,
  onBack,
  onNext,
  canContinue = true,
  nextButtonLabel = 'Continue →',
  loading = false,
  children,
}: WizardStepLayoutProps) {
  const insets = useSafeAreaInsets();
  const progressPercent = (currentStep / totalSteps) * 100;
  const stepText = `${String(currentStep).padStart(2, '0')} / ${totalSteps}`;

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 4;
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}>
      {/* Top Header Chrome */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={styles.stepText}>{stepText}</Text>
      </View>

      {/* Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Emoji */}
        <Text style={styles.emojiText}>{emoji}</Text>

        {/* Title & Subtitle */}
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.subtitleText}>{subtitle}</Text>

        {/* Step Control */}
        <View style={styles.stepControlWrapper}>{children}</View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.bottomFooter}>
        <PrimaryButton
          title={nextButtonLabel}
          onPress={onNext}
          disabled={!canContinue}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceBorder,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  stepText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  emojiText: {
    fontSize: 40,
    marginBottom: 12,
  },
  titleText: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitleText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  stepControlWrapper: {
    marginTop: 8,
  },
  bottomFooter: {
    paddingVertical: 16,
    backgroundColor: colors.bg,
  },
});
