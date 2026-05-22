import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { COLORS, SPACING, PILLAR_CONFIG } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { submitAssessment } from '../../api/client';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'ProgrammeGeneration'> };

export function ProgrammeGenerationScreen({ navigation }: Props) {
  const assessment = useAppStore(s => s.assessment);
  const setHasCompletedOnboarding = useAppStore(s => s.setHasCompletedOnboarding);
  const [phase, setPhase] = useState<'generating' | 'done' | 'error'>('generating');
  const [result, setResult] = useState<any>(null);
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 2000, useNativeDriver: false }).start();
    generate();
  }, []);

  async function generate() {
    try {
      const data = await submitAssessment(assessment);
      setResult(data);
      setPhase('done');
    } catch (e: any) {
      if (e.response?.status === 401) {
        Alert.alert('Session expired', 'Please sign in again.');
      } else {
        setPhase('error');
      }
    }
  }

  function launch() {
    setHasCompletedOnboarding(true);
  }

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (phase === 'error') {
    return (
      <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.center]}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setPhase('generating'); generate(); }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          {phase === 'generating' && (
            <View style={styles.generatingContainer}>
              <Text style={styles.generatingTitle}>Building Your Programme</Text>
              <Text style={styles.generatingSubtitle}>Analysing your physiology…</Text>
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth as any }]} />
              </View>
              <View style={styles.stepsList}>
                {[
                  'Calculating pillar weights…',
                  'Mapping your physiological profile…',
                  'Generating your 4-week plan…',
                  'Configuring adaptive engine…',
                ].map((step, i) => (
                  <Text key={i} style={styles.generatingStep}>• {step}</Text>
                ))}
              </View>
            </View>
          )}

          {phase === 'done' && result && (
            <View style={styles.doneContainer}>
              <Text style={styles.doneTitle}>Your Programme is Ready</Text>
              <Text style={styles.doneSubtitle}>Here's what we found about your breathing physiology:</Text>

              <Text style={styles.sectionTitle}>Your Three Pillars</Text>
              <View style={styles.pillarsContainer}>
                {(['biomechanics', 'biochemistry', 'neurophysiology'] as const).map(p => {
                  const config = PILLAR_CONFIG[p];
                  const weight = result.pillarWeights?.[p] ?? 33;
                  return (
                    <View key={p} style={styles.pillarCard}>
                      <Text style={[styles.pillarName, { color: config.color }]}>{config.label}</Text>
                      <Text style={styles.pillarSub}>{config.subtitle}</Text>
                      <View style={styles.pillarBar}>
                        <View style={[styles.pillarBarFill, { width: `${weight}%` as any, backgroundColor: config.color }]} />
                      </View>
                      <Text style={[styles.pillarPercent, { color: config.color }]}>{weight}%</Text>
                    </View>
                  );
                })}
              </View>

              {result.tier && (
                <View style={styles.tierCard}>
                  <Text style={styles.tierLabel}>Your Starting Tier</Text>
                  <Text style={styles.tierValue}>Tier {result.tier}</Text>
                  <Text style={styles.tierDesc}>{getTierDesc(result.tier)}</Text>
                </View>
              )}

              {result.contraindications?.length > 0 && (
                <View style={styles.contraCard}>
                  <Text style={styles.contraTitle}>Safety Adaptations Applied</Text>
                  <Text style={styles.contraBody}>
                    Your programme has been adapted based on your health screening. Some advanced techniques are excluded.
                  </Text>
                </View>
              )}

              <View style={styles.fourWeekPreview}>
                <Text style={styles.fourWeekTitle}>Your 4-Week Starter Programme</Text>
                {[
                  { week: 1, focus: 'Biomechanics Foundation', duration: '10 min/day' },
                  { week: 2, focus: 'Adding Biochemistry', duration: '12 min/day' },
                  { week: 3, focus: 'Adding Neurophysiology', duration: '15 min/day' },
                  { week: 4, focus: 'Integration', duration: '18 min/day' },
                ].map(w => (
                  <View key={w.week} style={styles.weekRow}>
                    <View style={styles.weekBadge}><Text style={styles.weekBadgeText}>W{w.week}</Text></View>
                    <View>
                      <Text style={styles.weekFocus}>{w.focus}</Text>
                      <Text style={styles.weekDuration}>{w.duration}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.launchButton} onPress={launch}>
                <Text style={styles.launchButtonText}>Start My Programme →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getTierDesc(tier: number) {
  if (tier === 1) return 'Explorer — building your breathing foundation';
  if (tier === 2) return 'Practitioner — ready for progressive protocols';
  return 'Advanced — full technique library available';
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  generatingContainer: { flex: 1, gap: SPACING.lg, paddingTop: SPACING.xxl },
  generatingTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '700' },
  generatingSubtitle: { color: COLORS.textSecondary, fontSize: 15 },
  progressBarContainer: { height: 6, backgroundColor: COLORS.bgElevated, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  stepsList: { gap: SPACING.sm },
  generatingStep: { color: COLORS.textMuted, fontSize: 13 },
  doneContainer: { gap: SPACING.lg },
  doneTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  doneSubtitle: { color: COLORS.textSecondary, fontSize: 15 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  pillarsContainer: { gap: SPACING.sm },
  pillarCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  pillarName: { fontSize: 15, fontWeight: '600' },
  pillarSub: { color: COLORS.textMuted, fontSize: 12 },
  pillarBar: { height: 5, backgroundColor: COLORS.bgElevated, borderRadius: 2.5, overflow: 'hidden', marginTop: SPACING.xs },
  pillarBarFill: { height: '100%', borderRadius: 2.5 },
  pillarPercent: { fontSize: 14, fontWeight: '700' },
  tierCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.primary + '33' },
  tierLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  tierValue: { color: COLORS.primary, fontSize: 24, fontWeight: '700' },
  tierDesc: { color: COLORS.textSecondary, fontSize: 14 },
  contraCard: { backgroundColor: COLORS.warning + '11', borderRadius: 14, padding: SPACING.md, gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.warning + '33' },
  contraTitle: { color: COLORS.warning, fontSize: 14, fontWeight: '600' },
  contraBody: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  fourWeekPreview: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  fourWeekTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: SPACING.xs },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  weekBadge: { backgroundColor: COLORS.primary + '22', borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  weekBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  weekFocus: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  weekDuration: { color: COLORS.textMuted, fontSize: 12 },
  launchButton: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center' },
  launchButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  errorTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '600', marginBottom: SPACING.lg, textAlign: 'center' },
  retryButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, paddingHorizontal: 32 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
