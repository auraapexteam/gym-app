import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/useAuthStore';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { accessToken, userProfile, setSession, loading } = useAuthStore();

  useEffect(() => {
    // 1. Check active session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  if (loading && !accessToken) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // Determine user role
  const isStaff = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {accessToken ? (
          // App Stack (Authenticated Users)
          isStaff ? (
            // Staff / Gym Owner Stack
            <Stack.Screen 
              name="OwnerDashboard" 
              component={OwnerDashboardScreen} 
              options={{ title: 'Owner Dashboard', headerShown: false }} 
            />
          ) : (
            // Customer / Member Stack
            <>
              <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Customer Dashboard' }} />
              <Stack.Screen name="Plans" component={PlansScreen} options={{ title: 'Subscription Plans' }} />
            </>
          )
        ) : (
          // Auth Stack (Unauthenticated Users)
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
});
