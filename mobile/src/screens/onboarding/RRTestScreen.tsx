import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'RRTest'> };

export function RRTestScreen({ navigation }: Props) {
  const updateAssessment = useAppStore(s => s.updateAssessment);
  const [phase, setPhase] = useState<'intro' | 'counting' | 'result'>('intro');
  const [count, setCount] = useState(0);
  const [rr, setRR] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startCount() {
    setCount(0);
    setPhase('counting');
    timerRef.current = setTimeout(() => {
      setRR(count);
      setPhase('result');
    }, 60000);
  }

  function tap() {
    setCount(c => c + 1);
  }

  function finishEarly() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRR(count);
    setPhase('result');
    updateAssessment({ restingRR: count });
  }

  function saveAndContinue() {
    if (rr !== null) updateAssessment({ restingRR: rr });
    navigation.navigate('BreathingPattern');
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.progress}>
            <Text style={styles.step}>STEP 2 OF 8</Text>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: '25%' }]} /></View>
          </View>

          <Text style={styles.title}>Resting Respiratory Rate</Text>
          <Text style={styles.subtitle}>Count your breaths per minute at rest</Text>

          {phase === 'intro' && (
            <View style={styles.content}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>How it works</Text>
                <Text style={styles.cardBody}>
                  Sit or lie comfortably. Don't try to control your breathing — let it happen naturally.{'\n\n'}
                  Tap the button each time you exhale for 60 seconds.
                </Text>
              </View>
              <View style={styles.refCard}>
                <Text style={styles.refTitle}>Healthy range</Text>
                <Text style={styles.refBody}>A healthy resting rate is 8–12 breaths per minute. Most adults breathe 15–20 — which is over-breathing.</Text>
              </View>
              <TouchableOpacity style={styles.startButton} onPress={startCount}>
                <Text style={styles.startButtonText}>Start 60-second count</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'counting' && (
            <View style={styles.content}>
              <TouchableOpacity style={styles.tapArea} onPress={tap} activeOpacity={0.7}>
                <Text style={styles.tapCount}>{count}</Text>
                <Text style={styles.tapLabel}>breaths counted</Text>
                <Text style={styles.tapHint}>Tap on each exhale</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneButton} onPress={finishEarly}>
                <Text style={styles.doneButtonText}>Done counting</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'result' && rr !== null && (
            <View style={styles.content}>
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Your Resting RR</Text>
                <Text style={[styles.resultValue, { color: getRRColor(rr) }]}>{rr}<Text style={styles.resultUnit}> bpm</Text></Text>
                <Text style={[styles.resultInterp, { color: getRRColor(rr) }]}>{getRRLabel(rr)}</Text>
              </View>
              <TouchableOpacity style={styles.continueButton} onPress={saveAndContinue}>
                <Text style={styles.continueButtonText}>Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('BreathingPattern')}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'intro' && (
            <TouchableOpacity onPress={() => navigation.navigate('BreathingPattern')} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip this test →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getRRColor(rr: number) {
  if (rr <= 10) return COLORS.success;
  if (rr <= 14) return '#8BC34A';
  if (rr <= 18) return COLORS.warning;
  return COLORS.error;
}

function getRRLabel(rr: number) {
  if (rr <= 10) return 'Excellent — optimal breathing rate';
  if (rr <= 14) return 'Good — within healthy range';
  if (rr <= 18) return 'Moderate — some over-breathing';
  return 'Elevated — over-breathing present';
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  progress: { gap: SPACING.xs },
  step: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  progressBar: { height: 3, backgroundColor: COLORS.bgElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.biomechanics, borderRadius: 2 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15 },
  content: { gap: SPACING.lg },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  cardBody: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  refCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  refTitle: { color: COLORS.biomechanics, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  refBody: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  startButton: { backgroundColor: COLORS.biomechanics, borderRadius: 14, padding: 16, alignItems: 'center' },
  startButtonText: { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
  tapArea: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.xxl, alignItems: 'center', gap: SPACING.sm, borderWidth: 2, borderColor: COLORS.biomechanics + '55', minHeight: 180 },
  tapCount: { color: COLORS.biomechanics, fontSize: 72, fontWeight: '700' },
  tapLabel: { color: COLORS.textSecondary, fontSize: 14 },
  tapHint: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.sm },
  doneButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultCard: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.xl, alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  resultLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  resultValue: { fontSize: 60, fontWeight: '700' },
  resultUnit: { fontSize: 20 },
  resultInterp: { fontSize: 16, fontWeight: '500' },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipButton: { alignItems: 'center', paddingVertical: SPACING.md },
  skipText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
});
