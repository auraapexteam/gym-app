export type AccountDeletionReceipt =
  | { status: 'pending'; requestId: string }
  | { status: 'completed' };
export type AccountDeletionResult = AccountDeletionReceipt & { localCleanupFailed: boolean };

/** Accept only the documented durable receipt, or the previous completed 200 response. */
export function readAccountDeletionReceipt(response: { status: number; data?: any }): AccountDeletionReceipt {
  if (response.data?.success === true) {
    if (response.status === 202 && response.data.data?.status === 'pending' &&
      typeof response.data.data.requestId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(response.data.data.requestId)) {
      return { status: 'pending', requestId: response.data.data.requestId };
    }
    if (response.status === 200 && response.data.data == null) return { status: 'completed' };
  }
  throw new Error('Your account deletion request was not confirmed. Please retry or contact support.');
}

export function accountDeletionFailureMessage(error: any): string {
  const status = error?.response?.status;
  const code = error?.response?.data?.error?.code;
  if (code === 'OWNERSHIP_HANDOFF_REQUIRED') {
    return 'Your account still owns a gym. Transfer gym ownership and have your account role updated before requesting deletion. Contact contact@auraapex.in for help.';
  }
  if (code === 'APPLE_REVOCATION_REQUIRED') {
    return 'Your Apple sign-in access must be revoked before the deletion request can be accepted. Contact contact@auraapex.in to complete this step, then retry.';
  }
  if (code === 'RECURRING_CANCELLATION_REQUIRED') {
    return 'A recurring payment mandate must be cancelled with the payment provider before deletion can be accepted. Contact contact@auraapex.in to verify cancellation. Cancelling a membership in the app alone does not cancel the mandate.';
  }
  if (code === 'ACCOUNT_DELETION_PENDING') {
    return 'Your account already has a pending deletion request. Contact contact@auraapex.in with your request reference for its status.';
  }
  if (code === 'ACCOUNT_DELETION_UNAVAILABLE' || status === 503) {
    return 'The deletion service could not confirm an accepted request. Your request is not confirmed. Please retry later or contact contact@auraapex.in.';
  }
  if (status === 401) return 'Your session has expired. Please sign in again, then retry account deletion.';
  if (status === 403) return 'This account cannot request deletion through the app. Contact contact@auraapex.in for help.';
  if (!error?.response && (error?.isAxiosError || error?.code === 'ECONNABORTED')) {
    return 'We could not confirm your deletion request because the connection failed. Check your connection and retry. If you can no longer sign in, contact contact@auraapex.in to confirm your account status.';
  }
  return 'Your account deletion request was not confirmed. Please retry or contact contact@auraapex.in.';
}
