import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, getNSScoreColor } from '../../constants/theme';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { TodayData } from '../../types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function MorningCheckInScreen({ navigation }: Props) {
  const setToday = useAppStore(s => s.setToday);
  const [stress, setStress] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [hrv, setHrv] = useState('');
  const [rhr, setRhr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const hasWearable = !!hrv || !!rhr;

  async function submit() {
    if (!stress) { Alert.alert('Rate your stress level to continue'); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        subjectiveStress: stress,
      };
      if (sleepHours) payload.sleepHours = parseFloat(sleepHours);
      if (sleepQuality) payload.sleepScore = sleepQuality * 20; // 1–5 → 0–100
      if (hrv) payload.hrv = parseFloat(hrv);
      if (rhr) payload.rhr = parseFloat(rhr);

      const { data } = await api.post('/checkin/morning', payload);
      setResult(data);

      // Also update today's session
      try {
        const todayRes = await api.get('/sessions/today');
        setToday(todayRes.data);
      } catch {}
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const nsColor = getNSScoreColor(result.nsScore.score);
    return (
      <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Good morning.</Text>

            <View style={[styles.nsCard, { borderColor: nsColor + '66' }]}>
              <Text style={styles.nsLabel}>Nervous System Score</Text>
              <Text style={[styles.nsScore, { color: nsColor }]}>{result.nsScore.score}</Text>
              <Text style={[styles.nsInterp, { color: nsColor }]}>{result.nsScore.interpretation}</Text>
              <Text style={styles.nsMessage}>{result.nsScore.message}</Text>
            </View>

            {result.insights?.messages?.length > 0 && (
              <View style={styles.insightsCard}>
                <Text style={styles.insightsTitle}>Programme Adjustments Today</Text>
                {result.insights.messages.map((msg: string, i: number) => (
                  <Text key={i} style={styles.insightMsg}>• {msg}</Text>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
              <Text style={styles.doneButtonText}>See Today's Session →</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Morning Check-In</Text>
          <Text style={styles.subtitle}>Takes 30 seconds. Used to calculate your Nervous System Score.</Text>

          {/* Stress level */}
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>How stressed do you feel right now?</Text>
            <View style={styles.scaleRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.scaleButton, stress === v && styles.scaleButtonSelected]}
                  onPress={() => setStress(v)}
                >
                  <Text style={styles.scaleEmoji}>{['😌', '🙂', '😐', '😟', '😰'][v - 1]}</Text>
                  <Text style={[styles.scaleLabel, stress === v && { color: COLORS.textPrimary }]}>
                    {['None', 'Low', 'Medium', 'High', 'Very\nHigh'][v - 1]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sleep */}
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>How did you sleep?</Text>
            <View style={styles.scaleRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.scaleButton, sleepQuality === v && styles.scaleButtonSelected]}
                  onPress={() => setSleepQuality(v)}
                >
                  <Text style={styles.scaleEmoji}>{['😤', '😕', '😐', '😴', '🌙'][v - 1]}</Text>
                  <Text style={[styles.scaleLabel, sleepQuality === v && { color: COLORS.textPrimary }]}>
                    {['Poor', 'Fair', 'OK', 'Good', 'Great'][v - 1]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sleepHoursRow}>
              <Text style={styles.sleepHoursLabel}>Hours slept</Text>
              <TextInput
                style={styles.smallInput}
                value={sleepHours}
                onChangeText={setSleepHours}
                keyboardType="decimal-pad"
                placeholder="7.5"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Manual wearable data */}
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>Wearable data (optional)</Text>
            <Text style={styles.wearableNote}>
              If you don't have a connected wearable, enter your morning readings manually.
            </Text>
            <View style={styles.manualRow}>
              <View style={styles.manualField}>
                <Text style={styles.manualLabel}>HRV (ms)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={hrv}
                  onChangeText={setHrv}
                  keyboardType="number-pad"
                  placeholder="45"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={styles.manualField}>
                <Text style={styles.manualLabel}>Resting HR</Text>
                <TextInput
                  style={styles.smallInput}
                  value={rhr}
                  onChangeText={setRhr}
                  keyboardType="number-pad"
                  placeholder="62"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!stress || submitting) && styles.disabledButton]}
            onPress={submit}
            disabled={!stress || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Calculating…' : 'Calculate My NS Score →'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  back: { marginBottom: SPACING.sm },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22 },
  questionCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  questionLabel: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  scaleRow: { flexDirection: 'row', gap: SPACING.xs },
  scaleButton: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: COLORS.bgElevated, borderRadius: 12, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  scaleButtonSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  scaleEmoji: { fontSize: 22 },
  scaleLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600', textAlign: 'center' },
  sleepHoursRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sleepHoursLabel: { color: COLORS.textSecondary, fontSize: 14 },
  smallInput: { backgroundColor: COLORS.bgElevated, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, color: COLORS.textPrimary, fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: COLORS.border, minWidth: 70, textAlign: 'center' },
  wearableNote: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19 },
  manualRow: { flexDirection: 'row', gap: SPACING.lg },
  manualField: { flex: 1, gap: SPACING.xs },
  manualLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  submitButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.4 },
  nsCard: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm, borderWidth: 2 },
  nsLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  nsScore: { fontSize: 72, fontWeight: '700' },
  nsInterp: { fontSize: 18, fontWeight: '600' },
  nsMessage: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  insightsCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary + '33' },
  insightsTitle: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  insightMsg: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  doneButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
