import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { apiClient } from '../api/client';
import { COLORS, SHADOWS } from '../theme/tokens';
import { Calendar, ChevronLeft, ChevronRight, Save, Scale, Sparkles, CupSoda, Beef } from 'lucide-react-native';

interface LogSummary {
  weightLogs: { weight: number; log_date: string }[];
  waterLogs: { amount_ml: number; log_date: string }[];
  proteinLogs: { amount_g: number; log_date: string }[];
  imageLogs: { image_url: string; log_date: string }[];
}

export function ProgressScreen() {
  const [loading, setLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-indexed

  // Daily inputs
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('');
  const [water, setWater] = useState('');
  const [protein, setProtein] = useState('');

  const [summary, setSummary] = useState<LogSummary>({
    weightLogs: [],
    waterLogs: [],
    proteinLogs: [],
    imageLogs: [],
  });

  useEffect(() => {
    fetchMonthSummary();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    // Populate fields when selected date changes
    const dWeight = summary.weightLogs.find((l) => l.log_date === selectedDate)?.weight;
    const dWater = summary.waterLogs.find((l) => l.log_date === selectedDate)?.amount_ml;
    const dProtein = summary.proteinLogs.find((l) => l.log_date === selectedDate)?.amount_g;

    setWeight(dWeight ? String(dWeight) : '');
    setWater(dWater ? String(dWater) : '');
    setProtein(dProtein ? String(dProtein) : '');
  }, [selectedDate, summary]);

  const fetchMonthSummary = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/progress/month', {
        params: { year: String(currentYear), month: String(currentMonth) },
      });
      if (res.data && res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load summary stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLogs = async () => {
    if (selectedDate > new Date().toISOString().slice(0, 10)) {
      Alert.alert('Invalid Date', 'You cannot log metrics for future dates.');
      return;
    }

    try {
      setLoading(true);
      const promises = [];

      if (weight) {
        promises.push(
          apiClient.post('/progress/weight', {
            weight: Number(weight),
            logDate: selectedDate,
          })
        );
      }
      if (water) {
        promises.push(
          apiClient.post('/progress/water', {
            amountMl: Number(water),
            logDate: selectedDate,
          })
        );
      }
      if (protein) {
        promises.push(
          apiClient.post('/progress/protein', {
            amountG: Number(protein),
            logDate: selectedDate,
          })
        );
      }

      await Promise.all(promises);
      Alert.alert('Saved', 'Your progress logs have been updated.');
      fetchMonthSummary();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save logs.');
    } finally {
      setLoading(false);
    }
  };

  // Helper stats calculations
  const totalWaterLitres = (summary.waterLogs.reduce((acc, l) => acc + l.amount_ml, 0) / 1000).toFixed(1);
  const totalProteinG = summary.proteinLogs.reduce((acc, l) => acc + l.amount_g, 0);
  const avgWeight =
    summary.weightLogs.length > 0
      ? (summary.weightLogs.reduce((acc, l) => acc + l.weight, 0) / summary.weightLogs.length).toFixed(1)
      : '0.0';

  const daysLoggedSet = new Set([
    ...summary.weightLogs.map((l) => l.log_date),
    ...summary.waterLogs.map((l) => l.log_date),
    ...summary.proteinLogs.map((l) => l.log_date),
  ]);

  // Calendar Helper functions
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  const calendarDays = [];
  // Empty blocks for padding start of month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Scale size={20} color={COLORS.primary} />
              <Text style={styles.statVal}>{avgWeight} kg</Text>
              <Text style={styles.statLabel}>Avg Weight</Text>
            </View>

            <View style={styles.statCard}>
              <CupSoda size={20} color={COLORS.primary} />
              <Text style={styles.statVal}>{totalWaterLitres} L</Text>
              <Text style={styles.statLabel}>Total Water</Text>
            </View>

            <View style={styles.statCard}>
              <Beef size={20} color={COLORS.primary} />
              <Text style={styles.statVal}>{totalProteinG} g</Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>
          </View>

          {/* Calendar Card */}
          <View style={styles.card}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={handlePrevMonth}>
                <ChevronLeft size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.calTitle}>
                {monthNames[currentMonth - 1]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth}>
                <ChevronRight size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Week Labels */}
            <View style={styles.weekLabels}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <Text key={idx} style={styles.weekText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.grid}>
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={styles.gridCell} />;
                }

                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;
                const hasLogged = daysLoggedSet.has(dateStr);
                const isFuture = dateStr > new Date().toISOString().slice(0, 10);

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.gridCell,
                      isSelected && styles.selectedCell,
                      isFuture && styles.futureCell,
                    ]}
                    onPress={() => !isFuture && setSelectedDate(dateStr)}
                    disabled={isFuture}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isFuture && styles.futureDayText,
                      ]}
                    >
                      {day}
                    </Text>
                    {hasLogged && <View style={[styles.loggedDot, isSelected && styles.selectedLoggedDot]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Log Entry Panel */}
          <View style={styles.card}>
            <View style={styles.panelHeader}>
              <Calendar size={18} color={COLORS.primary} style={styles.panelIcon} />
              <Text style={styles.panelTitle}>Logs for {selectedDate}</Text>
            </View>

            <View style={styles.formRow}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 74.5"
                placeholderTextColor={COLORS.textSecondary}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.inputLabel}>Water (ml)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2500"
                placeholderTextColor={COLORS.textSecondary}
                value={water}
                onChangeText={setWater}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 140"
                placeholderTextColor={COLORS.textSecondary}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveLogs} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <>
                  <Save size={18} color={COLORS.surface} style={styles.saveIcon} />
                  <Text style={styles.saveText}>Save Daily Logs</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    ...SHADOWS.small,
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekText: {
    width: '14.2%',
    textAlign: 'center',
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '14.2%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: COLORS.primary,
  },
  futureCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  selectedDayText: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  futureDayText: {
    color: COLORS.textSecondary,
  },
  loggedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  selectedLoggedDot: {
    backgroundColor: COLORS.surface,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelIcon: {
    marginRight: 8,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  input: {
    width: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
