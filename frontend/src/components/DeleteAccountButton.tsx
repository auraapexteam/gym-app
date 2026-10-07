import React, { useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { accountDeletionFailureMessage } from '../api/accountDeletion';

const RETAINED_RECORDS_NOTICE = 'Necessary gym membership, payment, attendance and accounting records, including identifying details needed for those records, are retained for legal obligations or resolving payment disputes.';
const LOCAL_CLEANUP_NOTICE = 'This device could not clear all saved sign-in data. Please clear the app storage before sharing the device, and contact support if cleanup remains unavailable.';

export function DeleteAccountButton() {
  const { deleteAccount, deletingAccount } = useAuthStore();
  const confirmationOpen = useRef(false);

  const confirmDeletion = () => {
    if (confirmationOpen.current || deletingAccount) return;
    confirmationOpen.current = true;
    const closeConfirmation = () => { confirmationOpen.current = false; };
    Alert.alert(
      'Request permanent account deletion?',
      'Once accepted, your account will be signed out and become unavailable while permanent deletion continues in the background. This cannot be undone. Your app profile, personal fitness history and private profile and progress photos will be deleted through this process.\n\n' +
        RETAINED_RECORDS_NOTICE + '\n\n' +
        'Deleting your account does not issue a refund. Contact your gym owner about unused membership fees or payment disputes. Gym ownership, Apple sign-in access, or recurring payment mandates may need to be resolved before the request can be accepted. This does not affect any rights you have under applicable law.',
      [
        { text: 'Cancel', style: 'cancel', onPress: closeConfirmation },
        {
          text: 'Request deletion',
          style: 'destructive',
          onPress: async () => {
            closeConfirmation();
            try {
              const result = await deleteAccount();
              if (result.status === 'pending') {
                Alert.alert(
                  'Deletion requested',
                  `Your request has been accepted. Permanent cleanup is pending for your app profile, personal fitness history and private profile and progress photos.\n\n${RETAINED_RECORDS_NOTICE}\n\nRequest reference: ${result.requestId}\n\nKeep this reference and contact contact@auraapex.in for updates. You have been signed out.` +
                    (result.localCleanupFailed ? `\n\n${LOCAL_CLEANUP_NOTICE}` : '')
                );
                return;
              }
              Alert.alert(
                'Account deleted',
                `Your app account has been deleted. You have been signed out.\n\n${RETAINED_RECORDS_NOTICE}` +
                  (result.localCleanupFailed ? `\n\n${LOCAL_CLEANUP_NOTICE}` : '')
              );
            } catch (error: any) {
              Alert.alert('Deletion request not confirmed', accountDeletionFailureMessage(error));
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
      accessibilityLabel="Request permanent account deletion"
      accessibilityState={{ disabled: deletingAccount, busy: deletingAccount }}
      disabled={deletingAccount}
      activeOpacity={0.8}
      style={[styles.button, deletingAccount && styles.busy]}
      onPress={confirmDeletion}
    >
      {deletingAccount ? <ActivityIndicator color="#f87171" /> : <Trash2 size={16} color="#f87171" />}
      <Text style={styles.label}>{deletingAccount ? 'Requesting deletion…' : 'Request account deletion'}</Text>
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
