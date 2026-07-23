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
import { Theme } from '../theme/Theme';
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
const TabButton = React.memo(({ isFocused, label, IconComponent, activeColor, onPress }: any) => {
  const focusedProgress = useSharedValue(isFocused ? 1 : 0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    focusedProgress.value = withSpring(isFocused ? 1 : 0, premiumSpringConfig);
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
        { scale: interpolate(focusedProgress.value, [0, 1], [1.0, 1.15], Extrapolation.CLAMP) },
        { translateY: interpolate(focusedProgress.value, [0, 1], [0, -7], Extrapolation.CLAMP) },
      ],
      color: interpolateColor(focusedProgress.value, [0, 1], ['#a1a5b7', activeColor]),
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(focusedProgress.value, [0.3, 1], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(focusedProgress.value, [0, 1], [12, 0], Extrapolation.CLAMP) }],
    };
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.tabButton}
    >
      <Animated.View style={{ transform: [{ scale: buttonScale.value }], alignItems: 'center' }}>
        <AnimatedIcon size={20} style={animatedIconStyle} />
        <Animated.Text
          style={[
            {
              color: activeColor,
              fontSize: 10,
              fontWeight: '800',
              position: 'absolute',
              bottom: -12,
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
function CustomTabBar({ state, descriptors, navigation }: any) {
  const containerWidth = useSharedValue(0);

  // Map state index (0, 1, 2, 3) to 5-column grid index (0, 1, 3, 4)
  const getColIndex = (idx: number) => (idx < 2 ? idx : idx + 1);
  const targetCol = getColIndex(state.index);
  const activeColIndex = useSharedValue(targetCol);

  useEffect(() => {
    activeColIndex.value = withSpring(targetCol, premiumSpringConfig);
  }, [state.index, targetCol]);

  // Center QR Pulse Animation using Reanimated shared values
  const pulseVal = useSharedValue(0);
  useEffect(() => {
    pulseVal.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1, // Infinite loops
      false
    );
  }, []);

  const scale = interpolate(pulseVal.value, [0, 1], [0.8, 1.25]);
  const opacity = interpolate(pulseVal.value, [0, 1], [0.8, 0]);

  const animatedPillStyle = useAnimatedStyle(() => {
    if (containerWidth.value === 0) return { opacity: 0 };
    const totalCols = 5;
    const colWidth = containerWidth.value / totalCols;
    const basePillWidth = 54;

    // Organic stretch based on target vs current animated index
    const diff = activeColIndex.value - targetCol;
    const stretchX = 1 + Math.min(Math.abs(diff) * 0.45, 0.35); // Stretches width up to 1.35x
    const currentPillWidth = basePillWidth * stretchX;

    const leftOffset = activeColIndex.value * colWidth + (colWidth - currentPillWidth) / 2;
    return {
      width: currentPillWidth,
      transform: [{ translateX: leftOffset }],
    };
  });

  const fabPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.tabBarContainer}>
      <View
        onLayout={(e) => (containerWidth.value = e.nativeEvent.layout.width)}
        style={styles.glassShell}
      >
        {/* Sliding Pill Background */}
        <Animated.View style={[styles.pillBackground, animatedPillStyle]} />

        {/* Tab 0: Home */}
        <TabButton
          isFocused={state.index === 0}
          label="Home"
          IconComponent={Home}
          activeColor={Theme.colors.primary}
          onPress={() => navigation.navigate(state.routes[0].name)}
        />

        {/* Tab 1: Logbook */}
        <TabButton
          isFocused={state.index === 1}
          label="Logbook"
          IconComponent={BookOpen}
          activeColor={Theme.colors.primary}
          onPress={() => navigation.navigate(state.routes[1].name)}
        />

        {/* Column 2: Center Gap for QR Checkin FAB */}
        <View style={{ flex: 1 }} />

        {/* Tab 2: Plans */}
        <TabButton
          isFocused={state.index === 2}
          label="Plans"
          IconComponent={CreditCard}
          activeColor={Theme.colors.primary}
          onPress={() => navigation.navigate(state.routes[2].name)}
        />

        {/* Tab 3: Profile */}
        <TabButton
          isFocused={state.index === 3}
          label="Profile"
          IconComponent={User}
          activeColor={Theme.colors.primary}
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
    backgroundColor: '#141a2a', // Premium dark surface theme matching the rest of the app
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    height: 50,
  },
  pillBackground: {
    position: 'absolute',
    height: 44,
    borderRadius: 22,
    top: 11, // centers mathematically (height 50 + padding 8*2 = 66, (66 - 44) / 2 = 11)
    backgroundColor: Theme.colors.primary,
    opacity: 0.16, // soft soft overlay look
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
