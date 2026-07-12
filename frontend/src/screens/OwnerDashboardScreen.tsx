import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export function OwnerDashboardScreen() {
  const { userProfile, signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gym Owner Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {userProfile?.full_name || 'Admin'}</Text>
        <Text style={styles.roleBadge}>Role: {userProfile?.role?.toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Owner Analytics (Placeholder)</Text>
        <Text style={styles.cardText}>• Active Members: 1,245</Text>
        <Text style={styles.cardText}>• Today's Check-ins: 312</Text>
        <Text style={styles.cardText}>• Monthly Revenue: ₹1,85,000</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 5,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 40,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
