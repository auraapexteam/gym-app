import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View, StyleSheet, Platform, PermissionsAndroid, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../api/supabase';
import { completeOAuthCallback } from '../api/oauthCallback';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS } from '../theme/tokens';

// Screens & Navigators
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { QRCheckInScreen } from '../screens/QRCheckInScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { BeginnerGuideScreen } from '../screens/BeginnerGuideScreen';
import { GymInfoScreen } from '../screens/GymInfoScreen';
import { GymDirectoryScreen } from '../screens/GymDirectoryScreen';
import { SubscriptionHistoryScreen } from '../screens/SubscriptionHistoryScreen';
import { AttendanceHistoryScreen } from '../screens/AttendanceHistoryScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ThemeSettingsScreen } from '../screens/ThemeSettingsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { LanguageSettingsScreen } from '../screens/LanguageSettingsScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { PrivacySettingsScreen } from '../screens/PrivacySettingsScreen';
import { AppSettingsScreen } from '../screens/AppSettingsScreen';
import { HelpSettingsScreen } from '../screens/HelpSettingsScreen';
import { AboutSettingsScreen } from '../screens/AboutSettingsScreen';

import { AppSplashScreen } from '../components/AppSplashScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { accessToken, userProfile, setSession, initializing } = useAuthStore();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if onboarding was already completed on this device
    AsyncStorage.getItem('has_seen_onboarding')
      .then((val) => setHasSeenOnboarding(val === 'true'))
      .catch(() => setHasSeenOnboarding(false));

    // Request notification permission on Android 13+ (API 33+) on app launch
    const requestNotificationPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        } catch (err) {
          // ignore
        }
      }
    };
    requestNotificationPermission();

    // Both Google and Apple return through the same authenticated callback.
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      try {
        const session = await completeOAuthCallback(url);
        if (session) await setSession(session);
      } catch {
        Alert.alert('Sign-in incomplete', 'Sign-in was cancelled or could not be completed. Please try again.');
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const linkSubscription = Linking.addEventListener('url', (e) => handleDeepLink(e.url));

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      linkSubscription.remove();
      subscription.unsubscribe();
    };
  }, [setSession]);

  if (initializing || hasSeenOnboarding === null || (accessToken && !userProfile)) {
    return <AppSplashScreen />;
  }

  const isStaffOrOwner = !!userProfile?.role && userProfile.role !== 'customer';
  const needsProfileSetup = !isStaffOrOwner && userProfile && !userProfile.onboarding_completed;

  const initialRoute = accessToken
    ? (isStaffOrOwner ? 'OwnerDashboard' : needsProfileSetup ? 'ProfileSetup' : 'MainTabs')
    : (hasSeenOnboarding ? 'Login' : 'Onboarding');

  const stackKey = accessToken
    ? (isStaffOrOwner ? 'owner-stack' : needsProfileSetup ? 'setup-stack' : 'customer-stack')
    : 'auth-stack';

  return (
    <NavigationContainer key={stackKey}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account', headerShown: true }} />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: 'Reset Password', headerShown: true }}
        />

        {/* Main App Screens */}
        <Stack.Screen name="MainTabs" component={CustomerTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="QRCheckIn" component={QRCheckInScreen} options={{ title: 'QR Check-in', headerShown: true }} />
        <Stack.Screen name="BeginnerGuide" component={BeginnerGuideScreen} options={{ title: 'Beginner Guide', headerShown: true }} />
        <Stack.Screen name="GymInfo" component={GymInfoScreen} options={{ title: 'Gym Information', headerShown: true }} />
        <Stack.Screen name="GymDirectory" component={GymDirectoryScreen} options={{ title: 'Find a Gym', headerShown: true }} />
        <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistoryScreen} options={{ title: 'Subscription History', headerShown: true }} />
        <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: 'Attendance History', headerShown: true }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', headerShown: true }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerShown: true }} />
        <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} options={{ title: 'Appearance', headerShown: true }} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notifications', headerShown: true }} />
        <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} options={{ title: 'Language', headerShown: true }} />
        <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: 'Security', headerShown: true }} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: 'Privacy', headerShown: true }} />
        <Stack.Screen name="AppSettings" component={AppSettingsScreen} options={{ title: 'Storage & Cache', headerShown: true }} />
        <Stack.Screen name="HelpSettings" component={HelpSettingsScreen} options={{ title: 'Help & Support', headerShown: true }} />
        <Stack.Screen name="AboutSettings" component={AboutSettingsScreen} options={{ title: 'About Aura Apex', headerShown: true }} />
      </Stack.Navigator>
    </NavigationContainer>
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
