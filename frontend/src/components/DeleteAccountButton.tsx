import React, { useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';

export function DeleteAccountButton() {
  const { deleteAccount, deletingAccount } = useAuthStore();
  const confirmationOpen = useRef(false);

  const confirmDeletion = () => {
    if (confirmationOpen.current || deletingAccount) return;
    confirmationOpen.current = true;
    const closeConfirmation = () => { confirmationOpen.current = false; };
    Alert.alert(
      'Permanently delete your account?',
      'This cannot be undone. Your Aura Apex account, profile, memberships, attendance and logbook history (including notes, sleep and progress logs) will be permanently deleted. You will lose access to your account and memberships.',
      [
        { text: 'Cancel', style: 'cancel', onPress: closeConfirmation },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            closeConfirmation();
            try {
              const { localCleanupFailed } = await deleteAccount();
              Alert.alert(
                'Account deleted',
                localCleanupFailed
                  ? 'Your account was deleted, but this device could not clear all saved sign-in data. Please clear the app storage or reinstall the app before using it again.'
                  : 'Your account has been permanently deleted. You have been signed out.'
              );
            } catch (error: any) {
              const status = error?.response?.status;
              const message = status === 401
                ? 'Your session has expired. Please sign in again, then retry account deletion.'
                : status === 403
                  ? 'This account cannot be self-deleted. Please contact support.'
                  : !error?.response && (error?.isAxiosError || error?.code === 'ECONNABORTED')
                    ? 'We could not confirm deletion because the connection failed. Check your connection and try again. If you can no longer sign in, contact support to confirm your account status.'
                    : 'Account deletion was not confirmed. Please try again or contact support.';
              Alert.alert('Deletion not confirmed', message);
            }
          },
        },
      ],
      { cancelable: true, onDismiss: closeConfirmation }
    );
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Delete account permanently"
      accessibilityState={{ disabled: deletingAccount, busy: deletingAccount }}
      disabled={deletingAccount}
      activeOpacity={0.8}
      style={[styles.button, deletingAccount && styles.busy]}
      onPress={confirmDeletion}
    >
      {deletingAccount ? <ActivityIndicator color="#f87171" /> : <Trash2 size={16} color="#f87171" />}
      <Text style={styles.label}>{deletingAccount ? 'Deleting account…' : 'Delete account permanently'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 18, minHeight: 52,
    padding: 12, gap: 8, justifyContent: 'center', alignItems: 'center',
    marginTop: 28, marginBottom: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  busy: { opacity: 0.6 },
  label: { color: '#f87171', fontSize: 15, fontWeight: '700' },
});
