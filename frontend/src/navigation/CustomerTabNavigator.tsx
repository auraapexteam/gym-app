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

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const springConfig = {
  damping: 18,
  stiffness: 160,
  mass: 0.6,
};

const TabButton = React.memo(({ isFocused, label, IconComponent, onPress }: any) => {
  const { isDark } = useTheme();
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

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(focusedProgress.value, [0, 1], [1.0, 1.15], Extrapolation.CLAMP) },
        { translateY: interpolate(focusedProgress.value, [0, 1], [0, -2], Extrapolation.CLAMP) },
      ],
      color: interpolateColor(
        focusedProgress.value,
        [0, 1],
        [isDark ? colors.textMuted : '#6B7280', colors.accent]
      ),
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(focusedProgress.value, [0.3, 1], [0.6, 1], Extrapolation.CLAMP),
      color: interpolateColor(
        focusedProgress.value,
        [0, 1],
        [isDark ? colors.textMuted : '#6B7280', colors.accent]
      ),
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      alignItems: 'center',
      justifyContent: 'center',
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
        {isFocused ? (
          <View style={styles.activeGlowPill} />
        ) : null}
        <AnimatedIcon
          size={20}
          style={animatedIconStyle}
          strokeWidth={isFocused ? 2.5 : 2.0}
        />
        <Animated.Text style={[styles.tabLabel, animatedLabelStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
});

function CustomTabBar({ state, navigation }: any) {
  const { isDark } = useTheme();

  return (
    <View style={styles.tabBarContainer}>
      <View
        style={[
          styles.glassShell,
          {
            backgroundColor: isDark ? colors.bgElevated : colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
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
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="ExploreTab" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="BookTab" component={BookScreen} options={{ title: 'Book' }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    paddingHorizontal: 12,
  },
  glassShell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: 32,
    paddingHorizontal: 8,
    height: 66,
    width: width - 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 66,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  activeGlowPill: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accentDim,
    top: -4,
  },
});
