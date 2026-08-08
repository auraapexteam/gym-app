import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline, Path, Rect, ClipPath, Defs } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import { apiClient } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { uploadPersonalImage } from '../utils/upload';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Plus,
  Minus,
  Footprints,
} from 'lucide-react-native';

/* ============ Vectors ============ */

function ProgressRing({ size = 32, stroke = 3.5, progress = 0.5, color = '#f87171' }) {
  const { isDark } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ - progress * circ;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WaterGlass({ value }: { value: number }) {
  const fillHeight = Math.min(26, value * 26);
  const yPos = 32 - fillHeight;
  return (
    <Svg width={28} height={32} viewBox="0 0 28 32">
      <Defs>
        <ClipPath id="glass-clip">
          <Path d="M4 4 L24 4 L22 30 L6 30 Z" />
        </ClipPath>
      </Defs>
      <Path d="M4 4 L24 4 L22 30 L6 30 Z" fill="none" stroke="#0d94f8" strokeWidth={1.5} />
      <Rect
        x={0}
        y={yPos}
        width={28}
        height={fillHeight}
        fill="#0d94f8"
        opacity={0.5}
        clipPath="url(#glass-clip)"
      />
    </Svg>
  );
}

function Sparkline({ data, color = '#10b981', width = 280, height = 36 }: any) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((val: number, i: number) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <Svg width={width} height={height}>
      <Polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </Svg>
  );
}

/* ============ Interfaces ============ */

interface LogSummary {
  weightLogs: { weight: number; log_date: string }[];
  waterLogs: { amount_ml: number; log_date: string }[];
  proteinLogs: { amount_g: number; log_date: string }[];
  stepsLogs: { steps: number; log_date: string }[];
  imageLogs: { image_url: string; log_date: string }[];
}

export function ProgressScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-indexed

  // Selected state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('72.0');
  const [water, setWater] = useState(1500);
  const [protein, setProtein] = useState(95);
  const [steps, setSteps] = useState(0);

  const [summary, setSummary] = useState<LogSummary>({
    weightLogs: [],
    waterLogs: [],
    proteinLogs: [],
    stepsLogs: [],
    imageLogs: [],
  });

  useEffect(() => {
    fetchMonthSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch only when the viewed month changes
  }, [currentYear, currentMonth]);

  useEffect(() => {
    // Populate fields when selected date changes
    const dWeight = summary.weightLogs.find((l) => l.log_date === selectedDate)?.weight;
    const dWater = summary.waterLogs.find((l) => l.log_date === selectedDate)?.amount_ml;
    const dProtein = summary.proteinLogs.find((l) => l.log_date === selectedDate)?.amount_g;
    const dSteps = summary.stepsLogs.find((l) => l.log_date === selectedDate)?.steps;

    setWeight(dWeight ? String(dWeight.toFixed(1)) : '72.0');
    setWater(dWater ? dWater : 1500);
    setProtein(dProtein ? dProtein : 95);
    setSteps(dSteps ? dSteps : 0);
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

  const handleUploadPhoto = async () => {
    if (selectedDate > new Date().toISOString().slice(0, 10)) {
      Alert.alert('Invalid Date', 'You cannot log a snapshot for future dates.');
      return;
    }

    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
    if (result.didCancel || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    try {
      setUploadingPhoto(true);
      const publicUrl = await uploadPersonalImage(
        { uri: asset.uri, fileName: asset.fileName, type: asset.type, fileSize: asset.fileSize },
        'progress-photo'
      );
      await apiClient.post('/progress/image', { imageUrl: publicUrl, logDate: selectedDate });
      fetchMonthSummary();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.response?.data?.message || err.message || 'Failed to upload snapshot.');
    } finally {
      setUploadingPhoto(false);
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

      promises.push(
        apiClient.post('/progress/weight', {
          weight: Number(weight),
          logDate: selectedDate,
        })
      );

      promises.push(
        apiClient.post('/progress/water', {
          amountMl: Number(water),
          logDate: selectedDate,
        })
      );

      promises.push(
        apiClient.post('/progress/protein', {
          amountG: Number(protein),
          logDate: selectedDate,
        })
      );

      promises.push(
        apiClient.post('/progress/steps', {
          steps: Number(steps),
          logDate: selectedDate,
        })
      );

      await Promise.all(promises);
      Alert.alert('Logs Saved', 'Your progress logs have been updated.');
      fetchMonthSummary();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save logs.');
    } finally {
      setLoading(false);
    }
  };

  // Compile unique days logged
  const daysLoggedSet = new Set([
    ...summary.weightLogs.map((l) => l.log_date),
    ...summary.waterLogs.map((l) => l.log_date),
    ...summary.proteinLogs.map((l) => l.log_date),
    ...summary.stepsLogs.map((l) => l.log_date),
  ]);

  // Calendar logic
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

  // Dynamic sparkline weights array
  const weightSeries = useMemo(() => {
    const list = summary.weightLogs.map(l => l.weight);
    if (list.length === 0) return [72, 72, 72, 72];
    if (list.length === 1) return [list[0], list[0]];
    return list;
  }, [summary.weightLogs]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header titles */}
          <View style={styles.screenHeader}>
            <Text style={styles.screenTitle}>Logbook</Text>
            <Text style={styles.screenSubtitle}>Tap a day, then log your metrics.</Text>
          </View>

          {/* Calendar Glass Box */}
          <View style={styles.glassCard}>
            <View style={styles.calHeader}>
              <View>
                <Text style={styles.monthName}>
                  {monthNames[currentMonth - 1]} {currentYear}
                </Text>
                <Text style={styles.entriesCount}>{daysLoggedSet.size} entries this month</Text>
              </View>
              <View style={styles.calNav}>
                <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7} style={styles.navBtn}>
                  <ChevronLeft size={18} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7} style={styles.navBtn}>
                  <ChevronRight size={18} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Week Labels */}
            <View style={styles.weekLabels}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <Text key={idx} style={styles.weekText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
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
                    activeOpacity={0.75}
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
                    {hasLogged && !isSelected && <View style={styles.loggedDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Metric Entry Panels */}
          <View style={[styles.glassCard, styles.metricsInputPanel]}>
            {/* Weight Slider/Input Box */}
            <View style={styles.sheetItem}>
              <View style={styles.sheetInputLabelRow}>
                <Text style={styles.sheetInputTitle}>Weight (kg)</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  style={styles.weightTextInput}
                />
              </View>
              {/* Dynamic Sparkline graph line */}
              <View style={styles.sparklineContainer}>
                <Sparkline data={weightSeries} color="#10b981" />
              </View>
            </View>

            {/* Water Adjustment Box */}
            <View style={styles.sheetControlBox}>
              <View>
                <Text style={styles.sheetControlTitle}>Water</Text>
                <Text style={styles.sheetControlValue}>{(water / 1000).toFixed(2)} L</Text>
              </View>
              <View style={styles.adjusterRow}>
                <TouchableOpacity
                  onPress={() => setWater(Math.max(0, water - 250))}
                  activeOpacity={0.7}
                  style={styles.adjustButton}
                >
                  <Minus size={16} color={colors.foreground} />
                </TouchableOpacity>
                <WaterGlass value={water / 3000} />
                <TouchableOpacity
                  onPress={() => setWater(water + 250)}
                  activeOpacity={0.7}
                  style={[styles.adjustButton, { backgroundColor: '#0d94f8' }]}
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Protein Adjustment Box */}
            <View style={styles.sheetControlBox}>
              <View>
                <Text style={styles.sheetControlTitle}>Protein</Text>
                <Text style={styles.sheetControlValue}>{protein} g</Text>
              </View>
              <View style={styles.adjusterRow}>
                <TouchableOpacity
                  onPress={() => setProtein(Math.max(0, protein - 5))}
                  activeOpacity={0.7}
                  style={styles.adjustButton}
                >
                  <Minus size={16} color={colors.foreground} />
                </TouchableOpacity>
                <ProgressRing size={32} stroke={3.5} progress={protein / 150} color="#f87171" />
                <TouchableOpacity
                  onPress={() => setProtein(protein + 5)}
                  activeOpacity={0.7}
                  style={[styles.adjustButton, { backgroundColor: '#f87171' }]}
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Steps Adjustment Box */}
            <View style={styles.sheetControlBox}>
              <View style={styles.stepsLabelGroup}>
                <Footprints size={16} color="#fbbf24" />
                <View>
                  <Text style={styles.sheetControlTitle}>Steps</Text>
                  <Text style={styles.sheetControlValue}>{steps.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.adjusterRow}>
                <TouchableOpacity
                  onPress={() => setSteps(Math.max(0, steps - 500))}
                  activeOpacity={0.7}
                  style={styles.adjustButton}
                >
                  <Minus size={16} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSteps(steps + 500)}
                  activeOpacity={0.7}
                  style={[styles.adjustButton, { backgroundColor: '#fbbf24' }]}
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress Snapshots Upload box */}
            <View style={styles.photoSection}>
              <Text style={styles.photoTitle}>Progress photo</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.dashedUploadBox}
                onPress={handleUploadPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                ) : (
                  <>
                    <Camera size={20} color={colors.mutedForeground} style={{ marginBottom: 6 }} />
                    <Text style={styles.uploadText}>Tap to upload snapshot</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Photos scroll list */}
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.photoList}>
                {summary.imageLogs.map((log) => (
                  <Image key={log.log_date} source={{ uri: log.image_url }} style={styles.photoThumbnail} />
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Floating Save Action Button */}
          <TouchableOpacity
            onPress={handleSaveLogs}
            activeOpacity={0.85}
            disabled={loading}
            style={styles.saveLogButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveLogButtonText}>Save logs for {selectedDate}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 16, // clear top notch/status bar on Android
    paddingBottom: 120, // increased padding to avoid tabbar overlaps
  },
  screenHeader: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.foreground,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  glassCard: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
  },
  entriesCount: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: '600',
    marginTop: 2,
  },
  calNav: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekText: {
    width: '14.2%',
    textAlign: 'center',
    fontWeight: '700',
    color: colors.mutedForeground,
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '14.2%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderRadius: 10,
    position: 'relative',
  },
  selectedCell: {
    backgroundColor: colors.primary,
  },
  futureCell: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 13,
    color: colors.foreground,
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  futureDayText: {
    color: colors.mutedForeground,
  },
  loggedDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success,
  },
  metricsInputPanel: {
    gap: 16,
  },
  sheetItem: {
    gap: 8,
  },
  sheetInputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
  },
  sheetInputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  weightTextInput: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    textAlign: 'right',
    width: 100,
    padding: 0,
  },
  sparklineContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  sheetControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
  },
  sheetControlTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
  },
  sheetControlValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: 2,
  },
  stepsLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSection: {
    marginTop: 4,
  },
  photoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dashedUploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  photoList: {
    marginTop: 12,
  },
  photoThumbnail: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 8,
  },
  saveLogButton: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 10,
  },
  saveLogButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
