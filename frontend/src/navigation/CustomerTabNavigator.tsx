import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../theme/tokens';
import { Home, CreditCard, Calendar, Bell, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'HomeTab':
              return <Home size={size} color={color} />;
            case 'PlansTab':
              return <CreditCard size={size} color={color} />;
            case 'ProgressTab':
              return <Calendar size={size} color={color} />;
            case 'NotificationsTab':
              return <Bell size={size} color={color} />;
            case 'ProfileTab':
              return <User size={size} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="PlansTab"
        component={PlansScreen}
        options={{ title: 'Plans', headerShown: true }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressScreen}
        options={{ title: 'Progress', headerShown: true }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
