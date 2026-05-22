import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'BreathingPattern'> };
type Pattern = 'chest_dominant' | 'diaphragmatic' | 'mixed';

export function BreathingPatternScreen({ navigation }: Props) {
  const updateAssessment = useAppStore(s => s.updateAssessment);
  const [selected, setSelected] = useState<Pattern | null>(null);
  const [phase, setPhase] = useState<'test' | 'select'>('test');

  const patterns: Array<{ key: Pattern; title: string; description: string; color: string }> = [
    {
      key: 'chest_dominant',
      title: 'Chest Dominant',
      description: 'Your chest rises first and your stomach stays flat or moves inward. This is the most common dysfunctional pattern.',
      color: COLORS.error,
    },
    {
      key: 'mixed',
      title: 'Mixed',
      description: 'Some diaphragm movement but chest still leads. You have a foundation to build on.',
      color: COLORS.warning,
    },
    {
      key: 'diaphragmatic',
      title: 'Diaphragmatic',
      description: 'Your belly expands first on inhale and your chest barely moves. This is the optimal pattern.',
      color: COLORS.success,
    },
  ];

  function saveAndContinue() {
    if (selected) updateAssessment({ breathingPattern: selected });
    navigation.navigate('WearableConnection');
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.progress}>
            <Text style={styles.step}>STEP 3 OF 8</Text>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: '37.5%' }]} /></View>
          </View>

          <Text style={styles.title}>Breathing Pattern Screen</Text>
          <Text style={styles.subtitle}>Identify your dominant breathing pattern</Text>

          {phase === 'test' && (
            <View style={styles.content}>
              <View style={styles.instructionCard}>
                <Text style={styles.instructionTitle}>The Hand-Placement Test</Text>
                <Text style={styles.instruction}>1. Place one hand on your chest and one on your belly</Text>
                <Text style={styles.instruction}>2. Breathe normally for 5–6 breaths</Text>
                <Text style={styles.instruction}>3. Notice: which hand moves first and most on inhale?</Text>
                <Text style={[styles.instruction, { color: COLORS.success }]}>
                  Optimal: belly hand rises first and higher
                </Text>
                <Text style={[styles.instruction, { color: COLORS.error }]}>
                  Dysfunctional: chest hand rises first or belly draws in
                </Text>
              </View>
              <TouchableOpacity style={styles.readyButton} onPress={() => setPhase('select')}>
                <Text style={styles.readyButtonText}>I've done the test — select my pattern</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'select' && (
            <View style={styles.content}>
              <Text style={styles.selectLabel}>Which describes your breathing?</Text>
              {patterns.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.patternCard, selected === p.key && { borderColor: p.color, backgroundColor: p.color + '11' }]}
                  onPress={() => setSelected(p.key)}
                >
                  <View style={styles.patternHeader}>
                    <Text style={[styles.patternTitle, selected === p.key && { color: p.color }]}>{p.title}</Text>
                    {selected === p.key && <Text style={[styles.checkmark, { color: p.color }]}>✓</Text>}
                  </View>
                  <Text style={styles.patternDesc}>{p.description}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.continueButton, !selected && styles.disabledButton]}
                onPress={saveAndContinue}
                disabled={!selected}
              >
                <Text style={styles.continueButtonText}>Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('WearableConnection')}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
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
  content: { gap: SPACING.md },
  instructionCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  instructionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: SPACING.xs },
  instruction: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  readyButton: { backgroundColor: COLORS.biomechanics, borderRadius: 14, padding: 16, alignItems: 'center' },
  readyButtonText: { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
  selectLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  patternCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  patternHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patternTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  checkmark: { fontSize: 18, fontWeight: '700' },
  patternDesc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: SPACING.sm },
  continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.4 },
  skipText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
});
