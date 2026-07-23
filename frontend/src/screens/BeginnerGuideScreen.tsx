import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Theme } from '../theme/Theme';
import { Dumbbell, Sparkles, QrCode, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function BeginnerGuideScreen({ navigation }: any) {
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [
    {
      icon: Dumbbell,
      title: 'Train with intent',
      body: 'Track sessions, set streaks, and stay consistent — your gym in one place.',
      color: '#6366f1',
    },
    {
      icon: Sparkles,
      title: 'See your progress',
      body: 'Weight, water, protein and photos captured beautifully every day.',
      color: '#10b981',
    },
    {
      icon: QrCode,
      title: 'One-tap check-in',
      body: "Skip the front desk. Scan your Aura Apex QR and you're in.",
      color: '#0d94f8',
    },
  ];

  const currentSlide = slides[slideIndex];
  const IconComponent = currentSlide.icon;

  const handleNext = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      // Finished onboarding, go back to main screen
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>Aura Apex</Text>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Slide Content */}
      <View style={styles.contentContainer}>
        {/* Giant Circle Icon Wrapper */}
        <View style={[styles.iconContainer, { backgroundColor: Theme.colors.surface }]}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <IconComponent size={64} color={currentSlide.color} />
          </View>
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <Text style={styles.slideTitle}>{currentSlide.title}</Text>
          <Text style={styles.slideBody}>{currentSlide.body}</Text>
        </View>

        {/* Page Indicators */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicatorDot,
                index === slideIndex
                  ? styles.indicatorDotActive
                  : styles.indicatorDotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>
            {slideIndex < slides.length - 1 ? 'Next' : 'Get Started'}
          </Text>
          <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 24,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f5f6fa',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a5b7',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 170,
    height: 170,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f5f6fa',
    textAlign: 'center',
  },
  slideBody: {
    fontSize: 14,
    color: '#a1a5b7',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 280,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  indicatorDot: {
    height: 6,
    borderRadius: 3,
  },
  indicatorDotActive: {
    width: 24,
    backgroundColor: '#6366f1',
  },
  indicatorDotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  footer: {
    paddingBottom: 32,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 9999,
    paddingVertical: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
