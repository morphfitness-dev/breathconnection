import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'BOLTTest'> };

type Phase = 'intro' | 'breathe' | 'hold' | 'result';

export function BOLTTestScreen({ navigation }: Props) {
  const updateAssessment = useAppStore(s => s.updateAssessment);
  const [phase, setPhase] = useState<Phase>('intro');
  const [seconds, setSeconds] = useState(0);
  const [boltScore, setBoltScore] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startHold() {
    setPhase('hold');
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  }

  function stopHold() {
    if (timerRef.current) clearInterval(timerRef.current);
    setBoltScore(seconds);
    setPhase('result');
    updateAssessment({ boltScore: seconds });
  }

  function proceed() {
    navigation.navigate('RRTest');
  }

  function skip() {
    navigation.navigate('RRTest');
  }

  const scoreInterpretation = boltScore !== null ? getBOLTInterpretation(boltScore) : null;

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.progress}>
            <Text style={styles.step}>STEP 1 OF 8</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '12.5%' }]} />
            </View>
          </View>

          <Text style={styles.title}>BOLT Score Test</Text>
          <Text style={styles.subtitle}>Body Oxygen Level Test — measures your CO₂ tolerance</Text>

          {phase === 'intro' && (
            <View style={styles.content}>
              <View style={styles.instructionCard}>
                <Text style={styles.instructionTitle}>How it works:</Text>
                {[
                  '1. Breathe normally through your nose for 1–2 minutes',
                  '2. After a relaxed exhale (not a forced one), pinch your nose',
                  '3. Hold until you feel the first definite urge to breathe',
                  '4. Release — breathe normally',
                  '5. The time in seconds = your BOLT score',
                ].map((step, i) => (
                  <Text key={i} style={styles.instruction}>{step}</Text>
                ))}
              </View>

              <View style={styles.referenceCard}>
                <Text style={styles.refTitle}>BOLT Score Reference:</Text>
                {[
                  { range: '< 10s', label: 'Significant breathing dysfunction' },
                  { range: '10–20s', label: 'Poor — focus on nasal breathing habits' },
                  { range: '20–30s', label: 'Moderate — you\'re improving' },
                  { range: '30–40s', label: 'Good — healthy breathing baseline' },
                  { range: '> 40s', label: 'Excellent — elite breathing efficiency' },
                ].map(r => (
                  <View key={r.range} style={styles.refRow}>
                    <Text style={[styles.refRange, { color: COLORS.biochemistry }]}>{r.range}</Text>
                    <Text style={styles.refLabel}>{r.label}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.readyButton} onPress={() => setPhase('breathe')}>
                <Text style={styles.readyButtonText}>I'm ready — start breathing normally</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'breathe' && (
            <View style={styles.content}>
              <View style={styles.breatheCard}>
                <Text style={styles.breatheTitle}>Breathe normally</Text>
                <Text style={styles.breatheBody}>
                  Take 1–2 minutes of relaxed nasal breathing. When you've done a relaxed exhale and feel ready, tap the button below to start the hold.
                </Text>
              </View>
              <TouchableOpacity style={styles.holdButton} onPress={startHold}>
                <Text style={styles.holdButtonText}>Start Hold →</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'hold' && (
            <View style={styles.content}>
              <View style={styles.timerCard}>
                <Text style={styles.timerSeconds}>{seconds}</Text>
                <Text style={styles.timerLabel}>seconds</Text>
              </View>
              <Text style={styles.holdInstruction}>
                Hold at the first definite urge to breathe — not to the point of discomfort.
              </Text>
              <TouchableOpacity style={styles.stopButton} onPress={stopHold}>
                <Text style={styles.stopButtonText}>First Urge — Stop Hold</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'result' && boltScore !== null && scoreInterpretation && (
            <View style={styles.content}>
              <View style={[styles.resultCard, { borderColor: scoreInterpretation.color + '66' }]}>
                <Text style={styles.resultLabel}>Your BOLT Score</Text>
                <Text style={[styles.resultScore, { color: scoreInterpretation.color }]}>{boltScore}s</Text>
                <Text style={[styles.resultInterpretation, { color: scoreInterpretation.color }]}>
                  {scoreInterpretation.label}
                </Text>
                <Text style={styles.resultDetail}>{scoreInterpretation.detail}</Text>
              </View>

              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={proceed}>
                  <Text style={styles.primaryButtonText}>Continue →</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPhase('intro')}>
                  <Text style={styles.retestLink}>Retest</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {(phase === 'intro' || phase === 'breathe') && (
            <TouchableOpacity onPress={skip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip this test →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getBOLTInterpretation(score: number) {
  if (score < 10) return { color: COLORS.error, label: 'Significant concern', detail: 'Your biochemistry programme will focus heavily on CO₂ tolerance and nasal breathing habits.' };
  if (score < 20) return { color: COLORS.warning, label: 'Below average', detail: 'You\'ll see significant improvement within 4–6 weeks. Nasal breathing habits are key.' };
  if (score < 30) return { color: '#FFD54F', label: 'Moderate', detail: 'Good starting point. Focused CO₂ training will take you to the next level.' };
  if (score < 40) return { color: COLORS.success, label: 'Good', detail: 'Solid baseline. Your programme will include advanced biochemistry protocols.' };
  return { color: COLORS.biochemistry, label: 'Excellent', detail: 'Elite CO₂ tolerance. Advanced kumbhaka and IHT protocols are available to you.' };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  progress: { gap: SPACING.xs },
  step: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  progressBar: { height: 3, backgroundColor: COLORS.bgElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.biochemistry, borderRadius: 2 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22 },
  content: { gap: SPACING.lg },
  instructionCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  instructionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: SPACING.xs },
  instruction: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  referenceCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  refTitle: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: SPACING.xs },
  refRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  refRange: { fontSize: 13, fontWeight: '600', width: 60 },
  refLabel: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
  readyButton: { backgroundColor: COLORS.biochemistry, borderRadius: 14, padding: 16, alignItems: 'center' },
  readyButtonText: { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
  breatheCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  breatheTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '600' },
  breatheBody: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  holdButton: { backgroundColor: COLORS.biochemistry, borderRadius: 14, padding: 20, alignItems: 'center' },
  holdButtonText: { color: COLORS.bg, fontSize: 16, fontWeight: '700' },
  timerCard: { alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.xxl, borderWidth: 2, borderColor: COLORS.biochemistry + '55' },
  timerSeconds: { color: COLORS.biochemistry, fontSize: 80, fontWeight: '700' },
  timerLabel: { color: COLORS.textMuted, fontSize: 14, letterSpacing: 1 },
  holdInstruction: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  stopButton: { backgroundColor: COLORS.error, borderRadius: 14, padding: 18, alignItems: 'center' },
  stopButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.xl, gap: SPACING.md, alignItems: 'center', borderWidth: 2 },
  resultLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  resultScore: { fontSize: 72, fontWeight: '700' },
  resultInterpretation: { fontSize: 18, fontWeight: '600' },
  resultDetail: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  resultActions: { gap: SPACING.md },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  retestLink: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 14 },
  skipButton: { alignItems: 'center', paddingVertical: SPACING.md },
  skipText: { color: COLORS.textMuted, fontSize: 14 },
});
