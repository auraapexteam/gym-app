import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { PrimaryButton } from '../components/PrimaryButton';
import { apiClient } from '../api/client';
import { todayLocalDateString } from '../utils/date';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sun,
  Moon,
  Droplet,
  Beef,
  Footprints,
  Moon as SleepIcon,
  CheckCircle2,
} from 'lucide-react-native';

export function ProgressScreen() {
  const { isDark, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'stats' | 'log'>('stats');

  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayLocalDateString());

  // Input states
  const [weight, setWeight] = useState('0');
  const [water, setWater] = useState(0);
  const [waterInput, setWaterInput] = useState('0.00');
  const [protein, setProtein] = useState(0);
  const [proteinInput, setProteinInput] = useState('0');
  const [steps, setSteps] = useState(0);
  const [note, setNote] = useState('');
  const [sleepHours, setSleepHours] = useState('7');
  const [sleepMinutes, setSleepMinutes] = useState('45');
  const [sleepQuality, setSleepQuality] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');

  // Calendar month state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthLogs, setMonthLogs] = useState<
    Record<
      string,
      {
        weight?: number;
        water?: number;
        protein?: number;
        steps?: number;
        note?: string;
        sleep?: { durationMinutes: number; quality: string };
      }
    >
  >({});

  const handleWaterChange = (newVal: number) => {
    const clamped = Math.max(0, parseFloat(newVal.toFixed(2)));
    setWater(clamped);
    setWaterInput(clamped.toFixed(2));
  };

  const handleProteinChange = (newVal: number) => {
    const clamped = Math.max(0, Math.round(newVal));
    setProtein(clamped);
    setProteinInput(String(clamped));
  };

  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days: { day: number; dateStr: string; isToday: boolean; hasLog: boolean }[] = [];
    const todayStr = todayLocalDateString();

    while (date.getMonth() === month) {
      const d = date.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isToday: dateStr === todayStr,
        hasLog: !!monthLogs[dateStr],
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate, monthLogs]);

  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [workoutName, setWorkoutName] = useState('');
  const [exerciseDetails, setExerciseDetails] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const [progressRes, workoutRes] = await Promise.allSettled([
        apiClient.get('/progress/month', {
          params: {
            year: String(currentDate.getFullYear()),
            month: String(currentDate.getMonth() + 1),
          },
        }),
        apiClient.get('/workouts/history'),
      ]);

      if (progressRes.status === 'fulfilled' && progressRes.value.data?.success) {
        const data = progressRes.value.data.data;
        const logsMap: Record<
          string,
          {
            weight?: number;
            water?: number;
            protein?: number;
            steps?: number;
            note?: string;
            sleep?: { durationMinutes: number; quality: string };
          }
        > = {};

        (data?.weightLogs || []).forEach((w: any) => {
          const d = (w.log_date || w.logDate || '').slice(0, 10);
          if (d) logsMap[d] = { ...logsMap[d], weight: Number(w.weight) };
        });
        (data?.waterLogs || []).forEach((w: any) => {
          const d = (w.log_date || w.logDate || '').slice(0, 10);
          if (d) logsMap[d] = { ...logsMap[d], water: Number(w.amount_ml || w.amountMl) };
        });
        (data?.proteinLogs || []).forEach((p: any) => {
          const d = (p.log_date || p.logDate || '').slice(0, 10);
          if (d) logsMap[d] = { ...logsMap[d], protein: Number(p.amount_g || p.amountG) };
        });
        (data?.stepsLogs || []).forEach((s: any) => {
          const d = (s.log_date || s.logDate || '').slice(0, 10);
          if (d) logsMap[d] = { ...logsMap[d], steps: Number(s.steps) };
        });
        (data?.notesLogs || []).forEach((n: any) => {
          const d = (n.log_date || n.logDate || '').slice(0, 10);
          if (d) logsMap[d] = { ...logsMap[d], note: n.note };
        });
        (data?.sleepLogs || []).forEach((s: any) => {
          const d = (s.log_date || s.logDate || '').slice(0, 10);
          if (d) {
            logsMap[d] = {
              ...logsMap[d],
              sleep: {
                durationMinutes: Number(s.duration_minutes || s.durationMinutes || 0),
                quality: s.quality || 'Good',
              },
            };
          }
        });

        setMonthLogs(logsMap);
      }

      if (workoutRes.status === 'fulfilled' && workoutRes.value.data?.success) {
        setWorkoutHistory(workoutRes.value.data.data || []);
      }
    } catch (err) {
      console.log('Progress fetch fallback');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    const log = monthLogs[selectedDate];
    if (log) {
      if (log.weight !== undefined) setWeight(String(log.weight));
      if (log.water !== undefined) {
        const wVal = log.water / 1000;
        setWater(wVal);
        setWaterInput(wVal.toFixed(2));
      }
      if (log.protein !== undefined) {
        setProtein(log.protein);
        setProteinInput(String(log.protein));
      }
      if (log.steps !== undefined) setSteps(log.steps);
      if (log.note !== undefined) setNote(log.note);
      if (log.sleep !== undefined) {
        const hrs = Math.floor(log.sleep.durationMinutes / 60);
        const mins = log.sleep.durationMinutes % 60;
        setSleepHours(String(hrs));
        setSleepMinutes(String(mins));
        setSleepQuality((log.sleep.quality as any) || 'Good');
      }
    }
  }, [selectedDate, monthLogs]);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

  const handleSaveLogs = async () => {
    try {
      setLoading(true);
      const todayIso = new Date().toISOString().slice(0, 10);
      const targetDate = selectedDate <= todayIso ? selectedDate : todayIso;

      const promises: Promise<any>[] = [
        apiClient.post('/progress/water', { amountMl: Math.round(water * 1000), logDate: targetDate }),
        apiClient.post('/progress/protein', { amountG: Math.round(protein), logDate: targetDate }),
        apiClient.post('/progress/steps', { steps: Math.round(steps), logDate: targetDate }),
      ];

      const weightNum = parseFloat(weight);
      if (!isNaN(weightNum) && weightNum > 0) {
        promises.push(apiClient.post('/progress/weight', { weight: weightNum, logDate: targetDate }));
      }

      const totalSleepMins = (parseInt(sleepHours, 10) || 0) * 60 + (parseInt(sleepMinutes, 10) || 0);
      if (totalSleepMins > 0) {
        promises.push(
          apiClient.post('/progress/sleep', {
            durationMinutes: totalSleepMins,
            quality: sleepQuality,
            logDate: targetDate,
          })
        );
      }

      if (note.trim()) {
        promises.push(
          apiClient.post('/progress/note', {
            note: note.trim(),
            logDate: targetDate,
          })
        );
      }

      if (workoutName.trim()) {
        promises.push(
          apiClient.post('/workouts', {
            workoutName: workoutName.trim(),
            category: 'General Fitness',
            durationMin: 45,
            caloriesBurned: 350,
            logDate: targetDate,
            exercises: [
              {
                name: workoutName.trim(),
                sets: 3,
                reps: 10,
                notes: exerciseDetails || undefined,
              },
            ],
          })
        );
      }

      await Promise.all(promises);
      Alert.alert('Log Saved! 🎉', 'Your daily metrics and workout routines have been updated.');
      setWorkoutName('');
      setExerciseDetails('');
      fetchLogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not update daily log.';
      Alert.alert('Save Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const currentSleep = monthLogs[selectedDate]?.sleep;
  const sleepHrsDisplay = currentSleep
    ? Math.floor(currentSleep.durationMinutes / 60)
    : parseInt(sleepHours, 10) || 7;
  const sleepMinsDisplay = currentSleep
    ? currentSleep.durationMinutes % 60
    : parseInt(sleepMinutes, 10) || 45;
  const sleepQualityDisplay = currentSleep ? currentSleep.quality : sleepQuality;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg : '#F5F5F0' }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={[styles.headerTitle, { color: isDark ? colors.white : colors.black }]}>
          Logbook
        </Text>
        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
            style={styles.themeToggleBtn}
            activeOpacity={0.8}
          >
            {isDark ? (
              <Sun size={18} color={colors.white} />
            ) : (
              <Moon size={18} color={colors.black} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabContainerWrapper}>
        <SegmentedTabs
          tabs={[
            { id: 'stats', label: 'Stats / Log' },
            { id: 'log', label: 'Quick Log' },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as 'stats' | 'log')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'stats' ? (
          <>
            {/* Calendar Month Selector Card */}
            <View style={[styles.card, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() =>
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
                  }
                  style={styles.monthNavBtn}
                >
                  <ChevronLeft size={20} color={isDark ? colors.white : colors.black} />
                </TouchableOpacity>

                <Text style={[styles.monthLabelText, { color: isDark ? colors.white : colors.black }]}>
                  {monthYearLabel}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
                  }
                  style={styles.monthNavBtn}
                >
                  <ChevronRight size={20} color={isDark ? colors.white : colors.black} />
                </TouchableOpacity>
              </View>

              {/* Day Headers Row */}
              <View style={styles.weekHeadersRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <Text key={i} style={styles.weekHeaderDay}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {daysInMonth.map((item) => {
                  const isSelected = item.dateStr === selectedDate;
                  return (
                    <TouchableOpacity
                      key={item.dateStr}
                      onPress={() => setSelectedDate(item.dateStr)}
                      style={[
                        styles.dayCell,
                        item.isToday && styles.todayCell,
                        isSelected && styles.selectedDayCell,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          { color: isDark ? colors.white : colors.black },
                          isSelected && styles.selectedDayText,
                        ]}
                      >
                        {item.day}
                      </Text>
                      {item.hasLog ? <View style={styles.logDot} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected Date Summary Section */}
            <Text style={[styles.sectionTitle, { color: isDark ? colors.white : colors.black }]}>
              Metrics for {selectedDate}
            </Text>

            {/* 4 Metric Cards */}
            <View style={styles.metricsGrid}>
              {/* Water Card */}
              <View style={[styles.metricCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: colors.accentDim }]}>
                    <Droplet size={18} color={colors.accent} />
                  </View>
                  <Text style={styles.metricLabel}>Water</Text>
                </View>
                <Text style={[styles.metricValBig, { color: isDark ? colors.white : colors.black }]}>
                  {water.toFixed(1)} L
                </Text>
                <Text style={styles.metricSub}>Goal: 3.0 L</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${(water / 3.0) * 100}%`, backgroundColor: colors.accent }]} />
                </View>
              </View>

              {/* Protein Card */}
              <View style={[styles.metricCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: colors.accentDim }]}>
                    <Beef size={18} color={colors.accent} />
                  </View>
                  <Text style={styles.metricLabel}>Protein</Text>
                </View>
                <Text style={[styles.metricValBig, { color: isDark ? colors.white : colors.black }]}>
                  {protein} g
                </Text>
                <Text style={styles.metricSub}>Goal: 180 g</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${(protein / 180) * 100}%`, backgroundColor: colors.accent }]} />
                </View>
              </View>

              {/* Sleep Card */}
              <View style={[styles.metricCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                    <SleepIcon size={18} color="#A855F7" />
                  </View>
                  <Text style={styles.metricLabel}>Sleep</Text>
                </View>
                <Text style={[styles.metricValBig, { color: isDark ? colors.white : colors.black }]}>
                  {sleepHrsDisplay}h {sleepMinsDisplay}m
                </Text>
                <Text style={styles.metricSub}>Quality: {sleepQualityDisplay}</Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, Math.round(((sleepHrsDisplay * 60 + sleepMinsDisplay) / 480) * 100))}%`,
                        backgroundColor: '#A855F7',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Steps Card */}
              <View style={[styles.metricCard, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                    <Footprints size={18} color="#F59E0B" />
                  </View>
                  <Text style={styles.metricLabel}>Steps</Text>
                </View>
                <Text style={[styles.metricValBig, { color: isDark ? colors.white : colors.black }]}>
                  {steps.toLocaleString()}
                </Text>
                <Text style={styles.metricSub}>Goal: 10,000</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${(steps / 10000) * 100}%`, backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>

            {/* Note Entry Card */}
            <View style={[styles.card, { backgroundColor: isDark ? colors.bgElevated : colors.white, marginTop: 14 }]}>
              <Text style={[styles.cardHeaderTitle, { color: isDark ? colors.white : colors.black }]}>
                Daily Notes
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Write your workout thoughts or diet notes..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.noteInput, { color: isDark ? colors.white : colors.black }]}
              />
            </View>

            {/* Workout Log Breakdown Section */}
            <View style={[styles.card, { backgroundColor: isDark ? colors.bgElevated : colors.white, marginTop: 14 }]}>
              <Text style={[styles.cardHeaderTitle, { color: isDark ? colors.white : colors.black }]}>
                Workout History & Breakdown
              </Text>

              {workoutHistory.length > 0 ? (
                workoutHistory.map((item: any, idx: number) => (
                  <View key={item.id || idx} style={styles.workoutHistoryItem}>
                    <View style={styles.workoutHistoryTop}>
                      <Text style={[styles.workoutHistoryTitle, { color: isDark ? colors.white : colors.black }]}>
                        {item.title || item.workout_type || 'Push Day Routine'}
                      </Text>
                      <Text style={styles.workoutHistoryTime}>
                        {item.durationMinutes || item.duration || '45'} min · {item.caloriesBurned || item.calories || '350'} kcal
                      </Text>
                    </View>
                    {item.notes ? <Text style={styles.workoutHistoryNotes}>{item.notes}</Text> : null}
                    {item.exercises && Array.isArray(item.exercises) ? (
                      <View style={styles.exerciseChipsRow}>
                        {item.exercises.map((ex: any, exIdx: number) => (
                          <View key={exIdx} style={styles.exerciseChip}>
                            <Text style={styles.exerciseChipText}>
                              {ex.name || ex.title} ({ex.sets || 3}x{ex.reps || 10})
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))
              ) : (
                <View style={styles.emptyWorkoutBox}>
                  <Text style={styles.workoutHistoryNotes}>
                    No custom routines logged yet for this month.
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          /* Quick Log Input Screen */
          <View style={[styles.card, { backgroundColor: isDark ? colors.bgElevated : colors.white }]}>
            <Text style={[styles.cardHeaderTitle, { color: isDark ? colors.white : colors.black }]}>
              Log Today's Metrics
            </Text>
            <Text style={styles.cardSubTitle}>
              Record your daily water, protein, sleep, steps & weight.
            </Text>

            {/* Weight Input */}
            <View style={styles.logItem}>
              <Text style={[styles.logItemLabel, { color: isDark ? colors.white : colors.black }]}>
                Weight (kg)
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 72.5"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.logInput, { color: isDark ? colors.white : colors.black }]}
              />
            </View>

            {/* Water Control with Direct Input */}
            <View style={styles.logItem}>
              <Text style={[styles.logItemLabel, { color: isDark ? colors.white : colors.black }]}>
                Water (Liters)
              </Text>
              <View style={styles.counterRow}>
                <TouchableOpacity onPress={() => handleWaterChange(water - 0.25)} style={styles.counterBtn}>
                  <Minus size={18} color={isDark ? colors.white : colors.black} />
                </TouchableOpacity>
                <View style={styles.counterInputWrapper}>
                  <TextInput
                    value={waterInput}
                    onChangeText={(txt) => {
                      setWaterInput(txt);
                      const parsed = parseFloat(txt);
                      if (!isNaN(parsed) && parsed >= 0) setWater(parsed);
                    }}
                    keyboardType="decimal-pad"
                    style={[styles.counterInputText, { color: colors.accent }]}
                  />
                  <Text style={styles.counterUnitSuffix}>L</Text>
                </View>
                <TouchableOpacity onPress={() => handleWaterChange(water + 0.25)} style={styles.counterBtn}>
                  <Plus size={18} color={isDark ? colors.white : colors.black} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Protein Control with Direct Input */}
            <View style={styles.logItem}>
              <Text style={[styles.logItemLabel, { color: isDark ? colors.white : colors.black }]}>
                Protein Intake (Grams)
              </Text>
              <View style={styles.counterRow}>
                <TouchableOpacity onPress={() => handleProteinChange(protein - 10)} style={styles.counterBtn}>
                  <Minus size={18} color={isDark ? colors.white : colors.black} />
                </TouchableOpacity>
                <View style={styles.counterInputWrapper}>
                  <TextInput
                    value={proteinInput}
                    onChangeText={(txt) => {
                      setProteinInput(txt);
                      const parsed = parseInt(txt, 10);
                      if (!isNaN(parsed) && parsed >= 0) setProtein(parsed);
                    }}
                    keyboardType="numeric"
                    style={[styles.counterInputText, { color: colors.accent }]}
                  />
                  <Text style={styles.counterUnitSuffix}>g</Text>
                </View>
                <TouchableOpacity onPress={() => handleProteinChange(protein + 10)} style={styles.counterBtn}>
                  <Plus size={18} color={isDark ? colors.white : colors.black} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sleep Tracking Control */}
            <View style={styles.logItem}>
              <Text style={[styles.logItemLabel, { color: isDark ? colors.white : colors.black }]}>
                Sleep Duration & Quality
              </Text>
              <View style={styles.sleepInputsRow}>
                <View style={[styles.sleepInputBox, { flex: 1, marginRight: 8 }]}>
                  <TextInput
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    placeholder="7"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={[styles.logInput, { color: isDark ? colors.white : colors.black, textAlign: 'center' }]}
                  />
                  <Text style={styles.sleepUnitLabel}>Hours</Text>
                </View>
                <View style={[styles.sleepInputBox, { flex: 1, marginLeft: 8 }]}>
                  <TextInput
                    value={sleepMinutes}
                    onChangeText={setSleepMinutes}
                    placeholder="45"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={[styles.logInput, { color: isDark ? colors.white : colors.black, textAlign: 'center' }]}
                  />
                  <Text style={styles.sleepUnitLabel}>Mins</Text>
                </View>
              </View>

              <Text style={[styles.subSectionLabel, { color: isDark ? colors.textSecondary : colors.black, marginTop: 10 }]}>
                Quality
              </Text>
              <View style={styles.qualityPillsRow}>
                {(['Excellent', 'Good', 'Fair', 'Poor'] as const).map((q) => {
                  const active = sleepQuality === q;
                  return (
                    <TouchableOpacity
                      key={q}
                      onPress={() => setSleepQuality(q)}
                      style={[
                        styles.qualityPill,
                        active && { backgroundColor: '#A855F7', borderColor: '#A855F7' }
                      ]}
                    >
                      <Text style={[styles.qualityPillText, active && { color: colors.white }]}>
                        {q}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Steps Input */}
            <View style={styles.logItem}>
              <Text style={[styles.logItemLabel, { color: isDark ? colors.white : colors.black }]}>
                Steps Count
              </Text>
              <TextInput
                value={steps.toString()}
                onChangeText={(t) => setSteps(parseInt(t) || 0)}
                placeholder="e.g. 8500"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.logInput, { color: isDark ? colors.white : colors.black }]}
              />
            </View>

            {/* Daily Note Input */}
            <View style={styles.logItem}>
              <Text style={[styles.logItemLabel, { color: isDark ? colors.white : colors.black }]}>
                Daily Notes / Reflection
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="How did you feel today? Any notes on your workout or diet..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.noteInput, { color: isDark ? colors.white : colors.black }]}
              />
            </View>

            {/* Submit Button */}
            <PrimaryButton
              label="Save Today's Progress"
              onPress={handleSaveLogs}
              loading={loading}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainerWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  card: {
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthLabelText: {
    fontSize: 16,
    fontWeight: '800',
  },
  weekHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekHeaderDay: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  selectedDayCell: {
    backgroundColor: colors.accent,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedDayText: {
    color: colors.black,
    fontWeight: '900',
  },
  logDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  metricValBig: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 10,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  logItem: {
    marginBottom: 16,
  },
  logItemLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  logInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
  },
  counterInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterInputText: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 50,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  counterUnitSuffix: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
    marginLeft: 2,
  },
  sleepInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sleepInputBox: {
    alignItems: 'center',
  },
  sleepUnitLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  subSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  qualityPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  qualityPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  qualityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  workoutHistoryItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  workoutHistoryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutHistoryTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  workoutHistoryTime: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
  },
  workoutHistoryNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exerciseChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  exerciseChip: {
    backgroundColor: colors.accentDim,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginTop: 4,
  },
  exerciseChipText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '700',
  },
  emptyWorkoutBox: {
    paddingVertical: 12,
  },
});

