import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { Award, Calendar, XCircle, FileText, CheckCircle2, Building2, CreditCard, X } from 'lucide-react-native';
import { apiClient } from '../api/client';

export function SubscriptionHistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { userProfile } = useAuthStore();

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/subscriptions/me');
      if (res.data?.success) {
        setHistory(res.data.data.items || res.data.data || []);
      }
    } catch (err: any) {
      console.warn('Failed to load subscription history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCancelSubscription = async (id: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription? This will stop access at the end of the current billing cycle.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await apiClient.post(`/subscriptions/${id}/cancel`);
              if (res.data?.success) {
                Alert.alert('Cancelled', 'Your subscription was cancelled successfully.');
                fetchHistory();
              }
            } catch (err: any) {
              Alert.alert('Failed', err.response?.data?.message || 'Failed to cancel subscription.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && history.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isActive = item.status === 'active';
            const invNumber = `INV-${item.id.slice(0, 8).toUpperCase()}`;
            const planPrice = Number(item.plan?.price ?? item.plans?.price ?? item.amount ?? 499);
            const planName = item.plan?.name ?? item.plans?.name ?? item.planName ?? 'Gym Membership';
            const startDate = item.startDate ?? item.start_date ?? item.createdAt ?? item.created_at;
            const endDate = item.endDate ?? item.end_date;
            const durationDays = item.plan?.durationDays ?? item.plan?.duration_days ?? 30;

            return (
              <View style={styles.card}>
                <View style={styles.headerRow}>
                  <View style={[styles.iconBadge, { backgroundColor: isActive ? colors.successSoft : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]}>
                    <Award size={16} color={isActive ? colors.success : colors.mutedForeground} />
                  </View>
                  <View style={styles.headerTitles}>
                    <Text style={styles.planName}>{planName}</Text>
                    <Text style={styles.invoiceNumberText}>{invNumber}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: isActive ? colors.successSoft : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]}>
                    <Text style={[styles.statusText, { color: isActive ? colors.success : colors.mutedForeground }]}>
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>AMOUNT PAID</Text>
                    <Text style={styles.detailValue}>₹{planPrice.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>BILLING CYCLE</Text>
                    <Text style={styles.detailValue}>{durationDays >= 365 ? 'Annual (365 Days)' : `${durationDays} Days (Monthly)`}</Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <Calendar size={13} color={colors.mutedForeground} style={{ marginRight: 6 }} />
                  <Text style={styles.dateText}>
                    {formatDate(startDate)} — {formatDate(endDate)}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.invoiceBtn}
                    onPress={() => setSelectedInvoice(item)}
                  >
                    <FileText size={14} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.invoiceBtnText}>View Invoice Slip</Text>
                  </TouchableOpacity>

                  {isActive && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelSubscription(item.id)}
                    >
                      <XCircle size={14} color={colors.destructive} style={{ marginRight: 4 }} />
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No subscription history found.</Text>
            </View>
          }
        />
      )}

      {/* Invoice Receipt Slip Modal */}
      <Modal
        visible={!!selectedInvoice}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <Building2 size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Tax Invoice Receipt</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {selectedInvoice && (() => {
                const total = Number(selectedInvoice.plan?.price ?? selectedInvoice.plans?.price ?? selectedInvoice.amount ?? 499);
                const base = Math.round((total / 1.18) * 100) / 100;
                const gst = Math.round((total - base) * 100) / 100;
                const planTitle = selectedInvoice.plan?.name ?? selectedInvoice.plans?.name ?? selectedInvoice.planName ?? 'Gym Membership';
                const sDate = selectedInvoice.startDate ?? selectedInvoice.start_date ?? selectedInvoice.createdAt ?? selectedInvoice.created_at;
                const eDate = selectedInvoice.endDate ?? selectedInvoice.end_date;

                return (
                  <>
                    <View style={styles.invoiceHero}>
                      <Text style={styles.invoiceHeroLabel}>TOTAL AMOUNT PAID</Text>
                      <Text style={styles.invoiceHeroTotal}>₹{total.toLocaleString()}</Text>
                      <View style={styles.paidBadge}>
                        <CheckCircle2 size={12} color="#10b981" style={{ marginRight: 4 }} />
                        <Text style={styles.paidBadgeText}>PAYMENT VERIFIED (SUCCESS)</Text>
                      </View>
                    </View>

                    <View style={styles.receiptSection}>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Invoice Number:</Text>
                        <Text style={styles.receiptVal}>INV-{selectedInvoice.id.slice(0, 8).toUpperCase()}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Transaction Date:</Text>
                        <Text style={styles.receiptVal}>{formatDateTime(sDate)}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Billed To:</Text>
                        <Text style={styles.receiptVal}>{userProfile?.full_name || 'Customer'}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Package:</Text>
                        <Text style={styles.receiptVal}>{planTitle}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Validity Period:</Text>
                        <Text style={styles.receiptVal}>{formatDate(sDate)} — {formatDate(eDate)}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Payment Gateway:</Text>
                        <Text style={styles.receiptVal}>Razorpay Online (UPI/Card)</Text>
                      </View>
                    </View>

                    <View style={styles.taxBreakdown}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Base Membership Fee:</Text>
                        <Text style={styles.breakdownVal}>₹{base.toFixed(2)}</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>GST (18% Goods & Services Tax):</Text>
                        <Text style={styles.breakdownVal}>₹{gst.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                        <Text style={styles.breakdownTotalLabel}>Net Total Paid:</Text>
                        <Text style={styles.breakdownTotalVal}>₹{total.toFixed(2)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => setSelectedInvoice(null)}
                    >
                      <Text style={styles.doneBtnText}>Close Receipt</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0 : 0.04,
    shadowRadius: 8,
    elevation: isDark ? 0 : 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitles: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '800', color: colors.foreground },
  invoiceNumberText: { fontSize: 11, color: colors.mutedForeground, marginTop: 1, fontWeight: '600' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailItem: { gap: 2 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: colors.mutedForeground, letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontWeight: '800', color: colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dateText: { fontSize: 13, color: colors.mutedForeground, fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  invoiceBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.destructiveSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cancelText: { fontSize: 12, fontWeight: '700', color: colors.destructive },
  emptyText: { color: colors.mutedForeground, fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.foreground },
  invoiceHero: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    marginBottom: 20,
  },
  invoiceHeroLabel: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  invoiceHeroTotal: { fontSize: 32, fontWeight: '900', color: colors.foreground, marginVertical: 4 },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  paidBadgeText: { fontSize: 10, fontWeight: '800', color: '#10b981', letterSpacing: 0.5 },
  receiptSection: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 10,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { fontSize: 12, color: colors.mutedForeground, fontWeight: '600' },
  receiptVal: { fontSize: 12, color: colors.foreground, fontWeight: '700' },
  taxBreakdown: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    gap: 8,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 12, color: colors.mutedForeground, fontWeight: '500' },
  breakdownVal: { fontSize: 12, color: colors.foreground, fontWeight: '600' },
  breakdownTotalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  breakdownTotalLabel: { fontSize: 13, color: colors.foreground, fontWeight: '800' },
  breakdownTotalVal: { fontSize: 15, color: colors.primary, fontWeight: '900' },
  doneBtn: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
