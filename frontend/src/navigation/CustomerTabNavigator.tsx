import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { BookScreen } from '../screens/BookScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/tokens';
import { Home, Compass, QrCode, BarChart2, User } from 'lucide-react-native';

import { GymInfoScreen } from '../screens/GymInfoScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const springConfig = {
  damping: 18,
  stiffness: 160,
  mass: 0.6,
};

const TabButton = React.memo(({ isFocused, label, IconComponent, onPress }: any) => {
  const { isDark, colors: themeColors } = useTheme();
  const focusedProgress = useSharedValue(isFocused ? 1 : 0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    focusedProgress.value = withSpring(isFocused ? 1 : 0, springConfig);
  }, [isFocused]);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.92, { damping: 12, stiffness: 220 });
  };
  const handlePressOut = () => {
    buttonScale.value = withSpring(1.0, springConfig);
  };

  const AnimatedIcon = useMemo(() => Animated.createAnimatedComponent(IconComponent), [IconComponent]);

  const activeColor = themeColors.accent || (isDark ? '#B6FF00' : '#96D600');
  const inactiveColor = isDark ? '#9CA3AF' : '#6B7280';

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(focusedProgress.value, [0, 1], [1.0, 1.1], Extrapolation.CLAMP) },
      ],
      color: interpolateColor(
        focusedProgress.value,
        [0, 1],
        [inactiveColor, activeColor]
      ),
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(focusedProgress.value, [0.3, 1], [0.65, 1], Extrapolation.CLAMP),
      color: interpolateColor(
        focusedProgress.value,
        [0, 1],
        [inactiveColor, activeColor]
      ),
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    };
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={animatedButtonStyle}>
        <View style={styles.iconContainer}>
          {isFocused ? (
            <View
              style={[
                styles.activeGlowPill,
                { backgroundColor: isDark ? 'rgba(182, 255, 0, 0.18)' : 'rgba(132, 204, 22, 0.18)' },
              ]}
            />
          ) : null}
          <AnimatedIcon
            size={22}
            style={animatedIconStyle}
            strokeWidth={isFocused ? 2.4 : 1.8}
          />
        </View>
        <Animated.Text style={[styles.tabLabel, animatedLabelStyle]} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
});

function CustomTabBar({ state, navigation }: any) {
  const { isDark, colors: themeColors } = useTheme();

  return (
    <View style={styles.tabBarContainer}>
      <View
        style={[
          styles.glassShell,
          {
            backgroundColor: isDark ? themeColors.bgElevated || '#141414' : '#FFFFFF',
            borderColor: isDark ? themeColors.surfaceBorder || '#2A2A2A' : '#E5E7EB',
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.35 : 0.08,
            shadowRadius: isDark ? 14 : 10,
            elevation: isDark ? 8 : 4,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          if (route.name === 'GymInfo') return null;

          const isFocused = state.index === index;
          let label = 'Home';
          let icon = Home;

          if (route.name === 'HomeTab') {
            label = 'Home';
            icon = Home;
          } else if (route.name === 'ExploreTab') {
            label = 'Explore';
            icon = Compass;
          } else if (route.name === 'BookTab') {
            label = 'Book';
            icon = QrCode;
          } else if (route.name === 'ProgressTab') {
            label = 'Progress';
            icon = BarChart2;
          } else if (route.name === 'ProfileTab') {
            label = 'Profile';
            icon = User;
          }

          return (
            <TabButton
              key={route.key}
              isFocused={isFocused}
              label={label}
              IconComponent={icon}
              onPress={() => navigation.navigate(route.name)}
            />
          );
        })}
      </View>
    </View>
  );
}

export function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="ExploreTab" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="BookTab" component={BookScreen} options={{ title: 'Book' }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Tab.Screen name="GymInfo" component={GymInfoScreen} options={{ title: 'Gym Information' }} />
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
    paddingBottom: Platform.OS === 'ios' ? 22 : 12,
    paddingHorizontal: 12,
  },
  glassShell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: 36,
    paddingHorizontal: 6,
    height: 68,
    width: width - 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 68,
  },
  iconContainer: {
    width: 46,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeGlowPill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    backgroundColor: 'rgba(132, 204, 22, 0.18)',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
});
