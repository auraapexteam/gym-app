import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS } from '../theme/tokens';

// Screens & Navigators
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { QRCheckInScreen } from '../screens/QRCheckInScreen';
import { BeginnerGuideScreen } from '../screens/BeginnerGuideScreen';
import { GymInfoScreen } from '../screens/GymInfoScreen';
import { SubscriptionHistoryScreen } from '../screens/SubscriptionHistoryScreen';
import { AttendanceHistoryScreen } from '../screens/AttendanceHistoryScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ThemeSettingsScreen } from '../screens/ThemeSettingsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { LanguageSettingsScreen } from '../screens/LanguageSettingsScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { PrivacySettingsScreen } from '../screens/PrivacySettingsScreen';
import { AppSettingsScreen } from '../screens/AppSettingsScreen';
import { HelpSettingsScreen } from '../screens/HelpSettingsScreen';
import { AboutSettingsScreen } from '../screens/AboutSettingsScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { accessToken, userProfile, setSession, loading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  if (accessToken && !userProfile && loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isStaffOrOwner =
    userProfile?.role === 'owner' ||
    userProfile?.role === 'staff' ||
    userProfile?.role === 'admin';

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: true }}>
          {accessToken ? (
            isStaffOrOwner ? (
              <Stack.Screen
                name="OwnerDashboard"
                component={OwnerDashboardScreen}
                options={{ headerShown: false }}
              />
            ) : (
              // Customer stack
              <>
                <Stack.Screen
                  name="MainTabs"
                  component={CustomerTabNavigator}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="QRCheckIn"
                  component={QRCheckInScreen}
                  options={{ title: 'QR Check-in' }}
                />
                <Stack.Screen
                  name="BeginnerGuide"
                  component={BeginnerGuideScreen}
                  options={{ title: 'Beginner Guide' }}
                />
                <Stack.Screen
                  name="GymInfo"
                  component={GymInfoScreen}
                  options={{ title: 'Gym Information' }}
                />
                <Stack.Screen
                  name="SubscriptionHistory"
                  component={SubscriptionHistoryScreen}
                  options={{ title: 'Subscription History' }}
                />
                <Stack.Screen
                  name="AttendanceHistory"
                  component={AttendanceHistoryScreen}
                  options={{ title: 'Attendance History' }}
                />
                <Stack.Screen
                  name="Notifications"
                  component={NotificationsScreen}
                  options={{ title: 'Notifications' }}
                />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={{ title: 'Settings' }}
                />
                <Stack.Screen
                  name="ThemeSettings"
                  component={ThemeSettingsScreen}
                  options={{ title: 'Appearance' }}
                />
                <Stack.Screen
                  name="NotificationSettings"
                  component={NotificationSettingsScreen}
                  options={{ title: 'Notifications' }}
                />
                <Stack.Screen
                  name="LanguageSettings"
                  component={LanguageSettingsScreen}
                  options={{ title: 'Language' }}
                />
                <Stack.Screen
                  name="SecuritySettings"
                  component={SecuritySettingsScreen}
                  options={{ title: 'Security' }}
                />
                <Stack.Screen
                  name="PrivacySettings"
                  component={PrivacySettingsScreen}
                  options={{ title: 'Privacy' }}
                />
                <Stack.Screen
                  name="AppSettings"
                  component={AppSettingsScreen}
                  options={{ title: 'Storage & Cache' }}
                />
                <Stack.Screen
                  name="HelpSettings"
                  component={HelpSettingsScreen}
                  options={{ title: 'Help & Support' }}
                />
                <Stack.Screen
                  name="AboutSettings"
                  component={AboutSettingsScreen}
                  options={{ title: 'About Aura Apex' }}
                />
              </>
            )
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
