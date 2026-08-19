import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Zap, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function AppSplashScreen() {
  const scale = useSharedValue(0.92);
  const glowOpacity = useSharedValue(0.4);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for logo badge
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 })
      ),
      -1,
      true
    );

    // Bottom progress line animation
    progressWidth.value = withTiming(width * 0.7, {
      duration: 2200,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E11" />

      {/* Center Brand Cluster */}
      <View style={styles.centerCluster}>
        {/* Glow backdrop behind badge */}
        <Animated.View style={[styles.glowRing, animatedGlowStyle]} />

        {/* Neon Green Icon Box */}
        <Animated.View style={[styles.logoBadge, animatedBadgeStyle]}>
          <Zap size={44} color="#000000" fill="#000000" strokeWidth={2.5} />
        </Animated.View>

        {/* Brand Name */}
        <View style={styles.brandTitleRow}>
          <Activity size={24} color="#84CC16" style={{ marginRight: 8 }} />
          <Text style={styles.brandTitleText}>AURA APEX</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.taglineText}>INDIA'S FITNESS ECOSYSTEM</Text>
      </View>

      {/* Bottom Progress Loading Bar */}
      <View style={styles.bottomProgressTrack}>
        <Animated.View style={[styles.bottomProgressFill, animatedProgressStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0E11', // Dark luxury theme
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCluster: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(132, 204, 22, 0.25)', // Neon green glow
    top: -24,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: '#84CC16', // Vibrant neon lime
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#84CC16',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 32,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#84CC16',
    letterSpacing: 3,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 2.5,
  },

  // Bottom Progress Track
  bottomProgressTrack: {
    position: 'absolute',
    bottom: 24,
    width: width * 0.7,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bottomProgressFill: {
    height: '100%',
    backgroundColor: '#84CC16',
    borderRadius: 2,
    shadowColor: '#84CC16',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});
