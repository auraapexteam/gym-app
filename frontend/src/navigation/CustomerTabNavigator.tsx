import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
  Extrapolation,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { HomeScreen } from '../screens/HomeScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { Home, BookOpen, CreditCard, User, QrCode } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// 1. Premium spring physics config
const premiumSpringConfig = {
  damping: 20,
  stiffness: 150,
  mass: 0.6,
};

// 2. Custom Tab Button with Micro-Interactions
const TabButton = React.memo(({ isFocused, label, IconComponent, activeColor, isDark, onPress }: any) => {
  const focusedProgress = useSharedValue(isFocused ? 1 : 0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    focusedProgress.value = withSpring(isFocused ? 1 : 0, premiumSpringConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs by design
  }, [isFocused]);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.94, { damping: 12, stiffness: 220 });
  };
  const handlePressOut = () => {
    buttonScale.value = withSpring(1.0, premiumSpringConfig);
  };

  const AnimatedIcon = Animated.createAnimatedComponent(IconComponent);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(focusedProgress.value, [0, 1], [1.0, 1.12], Extrapolation.CLAMP) },
        { translateY: interpolate(focusedProgress.value, [0, 1], [0, -3.5], Extrapolation.CLAMP) },
      ],
      color: interpolateColor(focusedProgress.value, [0, 1], [isDark ? '#a1a5b7' : '#5b5f70', activeColor]),
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(focusedProgress.value, [0.3, 1], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(focusedProgress.value, [0, 1], [6, 0], Extrapolation.CLAMP) }],
    };
  });

  const animatedButtonContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
    };
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.tabButton}
    >
      <Animated.View style={animatedButtonContainerStyle}>
        <AnimatedIcon
          size={20}
          style={animatedIconStyle}
          fill="none"
          strokeWidth={isFocused ? 2.6 : 2.0}
        />
        <Animated.Text
          style={[
            {
              color: activeColor,
              fontSize: 9.5,
              fontWeight: '800',
              position: 'absolute',
              bottom: 4,
            },
            animatedLabelStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
});

// 3. Custom Tab Bar with Gliding & Morphing Pill Background
function CustomTabBar({ state, navigation }: any) {
  const { colors, isDark } = useTheme();
  const containerWidth = useSharedValue(0);

  // Map state index (0, 1, 2, 3) to 5-column grid index (0, 1, 3, 4)
  const getColIndex = (idx: number) => (idx < 2 ? idx : idx + 1);
  const targetCol = getColIndex(state.index);
  const activeColIndex = useSharedValue(targetCol);

  useEffect(() => {
    activeColIndex.value = withSpring(targetCol, premiumSpringConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs by design
  }, [state.index, targetCol]);

  // Center QR Pulse Animation using Reanimated shared values
  const pulseVal = useSharedValue(0);
  useEffect(() => {
    pulseVal.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1, // Infinite loops
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values are stable refs by design
  }, []);

  const animatedPillStyle = useAnimatedStyle(() => {
    if (containerWidth.value === 0) return { opacity: 0 };
    
    const padding = 12; // matching styles.glassShell.paddingHorizontal
    const contentWidth = containerWidth.value - padding * 2;
    const colWidth = contentWidth / 5;
    const basePillWidth = 58;

    // Organic stretch based on target vs current animated index
    const diff = activeColIndex.value - targetCol;
    const stretchX = 1 + Math.min(Math.abs(diff) * 0.45, 0.35); // Stretches width up to 1.35x
    const currentPillWidth = basePillWidth * stretchX;

    // Mathematically corrected offset accounting for horizontal padding
    const leftOffset = padding + activeColIndex.value * colWidth + (colWidth - currentPillWidth) / 2;
    return {
      width: currentPillWidth,
      transform: [{ translateX: leftOffset }],
    };
  });

  const fabPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(pulseVal.value, [0, 1], [0.8, 1.25]) }],
      opacity: interpolate(pulseVal.value, [0, 1], [0.8, 0]),
    };
  });

  return (
    <View style={styles.tabBarContainer}>
      <View
        onLayout={(e) => (containerWidth.value = e.nativeEvent.layout.width)}
        style={[
          styles.glassShell,
          {
            backgroundColor: isDark ? 'rgba(28, 36, 58, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: colors.border,
            shadowColor: isDark ? '#000000' : 'rgba(0, 0, 0, 0.08)',
          }
        ]}
      >
        {/* Sliding Pill Background */}
        <Animated.View
          style={[
            styles.pillBackground,
            animatedPillStyle,
            {
              backgroundColor: colors.primary,
              borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(79, 70, 229, 0.25)',
              opacity: isDark ? 0.20 : 0.12,
            }
          ]}
        />

        {/* Tab 0: Home */}
        <TabButton
          isFocused={state.index === 0}
          label="Home"
          IconComponent={Home}
          activeColor={colors.primary}
          isDark={isDark}
          onPress={() => navigation.navigate(state.routes[0].name)}
        />

        {/* Tab 1: Logbook */}
        <TabButton
          isFocused={state.index === 1}
          label="Logbook"
          IconComponent={BookOpen}
          activeColor={colors.primary}
          isDark={isDark}
          onPress={() => navigation.navigate(state.routes[1].name)}
        />

        {/* Column 2: Center Gap for QR Checkin FAB */}
        <View style={{ flex: 1 }} />

        {/* Tab 2: Plans */}
        <TabButton
          isFocused={state.index === 2}
          label="Plans"
          IconComponent={CreditCard}
          activeColor={colors.primary}
          isDark={isDark}
          onPress={() => navigation.navigate(state.routes[2].name)}
        />

        {/* Tab 3: Profile */}
        <TabButton
          isFocused={state.index === 3}
          label="Profile"
          IconComponent={User}
          activeColor={colors.primary}
          isDark={isDark}
          onPress={() => navigation.navigate(state.routes[3].name)}
        />
      </View>

      {/* Floating Check-In Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('QRCheckIn')}
        activeOpacity={0.85}
        style={styles.fabButton}
      >
        <Animated.View style={[styles.fabGlowRing, fabPulseStyle]} />
        <QrCode size={26} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

export function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressScreen}
        options={{ title: 'Logbook' }}
      />
      <Tab.Screen
        name="PlansTab"
        component={PlansScreen}
        options={{ title: 'Plans' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 16,
  },
  glassShell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(28, 36, 58, 0.95)', // Translucent premium navy slate surface
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    height: 70,
    width: width - 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
  },
  pillBackground: {
    position: 'absolute',
    height: 48,
    borderRadius: 24,
    top: 11, // centers mathematically (height 70, (70 - 48) / 2 = 11)
    backgroundColor: '#6366f1',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.35)', // glowing borders
    opacity: 0.20, // visible premium backdrop highlight
  },
  fabButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 36,
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  fabGlowRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
});
