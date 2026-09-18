import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radii } from '../theme/tokens';
import { PrimaryButton } from '../components/PrimaryButton';
import { Zap } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    tag: 'DISCOVER',
    title1: 'Find Your',
    title2: 'Perfect Gym',
    sub: 'Access 500+ premium gyms across India. Book in seconds.',
    bgImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '2',
    tag: 'FLEXIBILITY',
    title1: 'Train On',
    title2: 'Your Terms',
    sub: 'Day passes, monthly plans or long-term memberships.',
    bgImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '3',
    tag: 'AI COACHING',
    title1: 'Your Personal',
    title2: 'AI Coach',
    sub: 'Real-time feedback, smart recovery and personalised plans.',
    bgImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80',
  },
];

export function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
    } catch (e) {
      console.warn('Failed to save onboarding state:', e);
    }
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
    } else {
      handleFinish();
    }
  };

  const renderSlide = ({ item }: { item: (typeof SLIDES)[0] }) => {
    return (
      <View style={styles.slideContainer}>
        {/* Background Image filling ~65% height */}
        <ImageBackground
          source={{ uri: item.bgImage }}
          style={styles.heroBackground}
          resizeMode="cover"
        >
          <View style={styles.darkGradientOverlay} />
        </ImageBackground>
      </View>
    );
  };

  const currentSlide = SLIDES[currentIndex];
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 8;

  return (
    <View style={styles.container}>
      {/* Header Bar overlay on top */}
      <View style={[styles.headerSafeArea, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Zap size={22} color={colors.accent} fill={colors.accent} />
            <Text style={styles.logoText}>AURA APEX</Text>
          </View>
          <TouchableOpacity onPress={handleFinish} style={styles.skipButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Slides Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom Content Sheet Overlay */}
      <View style={styles.bottomSheet}>
        <View style={styles.tagChip}>
          <Text style={styles.tagChipText}>{currentSlide.tag}</Text>
        </View>

        <Text style={styles.headlineTitle}>
          <Text style={styles.accentText}>{currentSlide.title1}</Text>
          {'\n'}
          <Text style={styles.whiteText}>{currentSlide.title2}</Text>
        </Text>

        <Text style={styles.subtext}>{currentSlide.sub}</Text>

        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Primary Button */}
        <PrimaryButton
          title={currentIndex < SLIDES.length - 1 ? 'Next →' : 'Get Started →'}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 6,
  },
  skipButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  skipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  slideContainer: {
    width: width,
    height: height * 0.65,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  darkGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 10, 10, 0.45)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  tagChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 12,
  },
  tagChipText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headlineTitle: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 8,
  },
  accentText: {
    color: colors.accent,
  },
  whiteText: {
    color: colors.white,
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.accent,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: colors.surfaceBorder,
  },
});

