import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Goals'> };

const GOALS = [
  { key: 'stress_reduction', label: 'Stress & anxiety reduction', pillar: 'Neurophysiology', color: COLORS.neurophysiology },
  { key: 'sleep_improvement', label: 'Better sleep', pillar: 'Neurophysiology', color: COLORS.neurophysiology },
  { key: 'athletic_performance', label: 'Athletic performance', pillar: 'Biochemistry', color: COLORS.biochemistry },
  { key: 'focus_clarity', label: 'Focus & mental clarity', pillar: 'Neurophysiology', color: COLORS.neurophysiology },
  { key: 'breathwork_mastery', label: 'Breathwork mastery', pillar: 'All pillars', color: COLORS.primary },
  { key: 'general_wellness', label: 'General health & wellness', pillar: 'Balanced', color: COLORS.primary },
  { key: 'anxiety_management', label: 'Anxiety management', pillar: 'Neurophysiology', color: COLORS.neurophysiology },
  { key: 'cardiovascular_health', label: 'Cardiovascular health', pillar: 'Biochemistry + Neuro', color: COLORS.biochemistry },
];

export function GoalsScreen({ navigation }: Props) {
  const updateAssessment = useAppStore(s => s.updateAssessment);
  const [primary, setPrimary] = useState<string | null>(null);
  const [secondary, setSecondary] = useState<Set<string>>(new Set());

  function toggleSecondary(key: string) {
    if (key === primary) return;
    setSecondary(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function saveAndContinue() {
    updateAssessment({
      primaryGoal: primary ?? undefined,
      secondaryGoals: [...secondary],
    });
    navigation.navigate('Lifestyle');
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.progress}>
            <Text style={styles.step}>STEP 6 OF 8</Text>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: '75%' }]} /></View>
          </View>

          <Text style={styles.title}>What Do You Want to Achieve?</Text>
          <Text style={styles.subtitle}>Your primary goal shapes your pillar emphasis. Secondary goals add variety.</Text>

          <Text style={styles.sectionTitle}>Primary goal</Text>
          <Text style={styles.sectionHint}>Choose one</Text>

          {GOALS.map(g => (
            <TouchableOpacity
              key={g.key}
              style={[styles.goalCard, primary === g.key && { borderColor: g.color, backgroundColor: g.color + '11' }]}
              onPress={() => { setPrimary(g.key); setSecondary(prev => { const n = new Set(prev); n.delete(g.key); return n; }); }}
            >
              <View style={styles.goalRow}>
                <View>
                  <Text style={[styles.goalLabel, primary === g.key && { color: COLORS.textPrimary }]}>{g.label}</Text>
                  <Text style={[styles.goalPillar, { color: g.color }]}>{g.pillar}</Text>
                </View>
                {primary === g.key && <Text style={[styles.check, { color: g.color }]}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}

          {primary && (
            <>
              <Text style={styles.sectionTitle}>Secondary goals</Text>
              <Text style={styles.sectionHint}>Select any that also apply</Text>
              <View style={styles.secondaryGrid}>
                {GOALS.filter(g => g.key !== primary).map(g => (
                  <TouchableOpacity
                    key={g.key}
                    style={[styles.secondaryChip, secondary.has(g.key) && { borderColor: g.color, backgroundColor: g.color + '11' }]}
                    onPress={() => toggleSecondary(g.key)}
                  >
                    <Text style={[styles.secondaryChipText, secondary.has(g.key) && { color: g.color }]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.continueButton, !primary && styles.disabledButton]}
            onPress={saveAndContinue}
            disabled={!primary}
          >
            <Text style={styles.continueButtonText}>Continue →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Lifestyle')}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  progress: { gap: SPACING.xs },
  step: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  progressBar: { height: 3, backgroundColor: COLORS.bgElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '600', marginTop: SPACING.sm },
  sectionHint: { color: COLORS.textMuted, fontSize: 12 },
  goalCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalLabel: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' },
  goalPillar: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  check: { fontSize: 18, fontWeight: '700' },
  secondaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  secondaryChip: { backgroundColor: COLORS.bgCard, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  secondaryChipText: { color: COLORS.textSecondary, fontSize: 13 },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: SPACING.md },
  continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.4 },
  skipText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
});
