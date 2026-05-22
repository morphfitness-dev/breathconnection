import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Symptoms'> };

const SYMPTOMS = [
  { key: 'hasStressIssues', label: 'Stress & overwhelm', icon: '😰' },
  { key: 'hasSleepIssues', label: 'Poor sleep', icon: '😴' },
  { key: 'hasFocusIssues', label: 'Difficulty focusing', icon: '🌫️' },
  { key: 'hasAnxiety', label: 'Anxiety', icon: '💭' },
  { key: 'hasFatigue', label: 'Chronic fatigue', icon: '🔋' },
];

const SAFETY = [
  { key: 'hasHypertension', label: 'High blood pressure (hypertension)', warning: true },
  { key: 'hasHeartCondition', label: 'Heart condition', warning: true },
  { key: 'hasEpilepsy', label: 'Epilepsy', warning: true },
  { key: 'isPregnant', label: 'Pregnant', warning: true },
  { key: 'hasCOPD', label: 'Severe COPD or lung disease', warning: true },
];

export function SymptomsScreen({ navigation }: Props) {
  const updateAssessment = useAppStore(s => s.updateAssessment);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function saveAndContinue() {
    const patch: Record<string, boolean> = {};
    for (const s of [...SYMPTOMS, ...SAFETY]) {
      patch[s.key] = selected.has(s.key);
    }
    updateAssessment(patch as any);
    navigation.navigate('Goals');
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.progress}>
            <Text style={styles.step}>STEP 5 OF 8</Text>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: '62.5%' }]} /></View>
          </View>

          <Text style={styles.title}>How Are You Feeling?</Text>
          <Text style={styles.subtitle}>Select everything that applies. This shapes your pillar emphasis.</Text>

          <Text style={styles.sectionTitle}>Symptoms & challenges</Text>
          <Text style={styles.sectionHint}>Select all that apply — or none</Text>

          <View style={styles.grid}>
            {SYMPTOMS.map(s => (
              <TouchableOpacity
                key={s.key}
                style={[styles.chip, selected.has(s.key) && styles.chipSelected]}
                onPress={() => toggle(s.key)}
              >
                <Text style={styles.chipIcon}>{s.icon}</Text>
                <Text style={[styles.chipLabel, selected.has(s.key) && styles.chipLabelSelected]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Safety screening</Text>
          <Text style={styles.sectionHint}>Required — these adapt your programme for safety</Text>

          <View style={styles.safetyList}>
            {SAFETY.map(s => (
              <TouchableOpacity
                key={s.key}
                style={[styles.safetyRow, selected.has(s.key) && styles.safetyRowSelected]}
                onPress={() => toggle(s.key)}
              >
                <View style={[styles.checkbox, selected.has(s.key) && styles.checkboxSelected]}>
                  {selected.has(s.key) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.safetyLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selected.has('hasHypertension') || selected.has('hasHeartCondition') || selected.has('isPregnant') || selected.has('hasEpilepsy') || selected.has('hasCOPD') ? (
            <View style={styles.safetyWarning}>
              <Text style={styles.safetyWarningText}>
                ⚠️  Your programme will be adapted for safety. Breath holds and hyperventilation techniques will be excluded or capped. Always consult your healthcare provider.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.continueButton} onPress={saveAndContinue}>
            <Text style={styles.continueButtonText}>Continue →</Text>
          </TouchableOpacity>
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
  progressFill: { height: '100%', backgroundColor: COLORS.neurophysiology, borderRadius: 2 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '600' },
  sectionHint: { color: COLORS.textMuted, fontSize: 13, marginTop: -SPACING.sm + 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { backgroundColor: COLORS.bgCard, borderRadius: 12, padding: SPACING.md, gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.border, minWidth: '45%', flex: 1 },
  chipSelected: { borderColor: COLORS.neurophysiology, backgroundColor: COLORS.neurophysiology + '11' },
  chipIcon: { fontSize: 22 },
  chipLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  chipLabelSelected: { color: COLORS.textPrimary },
  safetyList: { gap: SPACING.sm },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  safetyRowSelected: { borderColor: COLORS.warning + '55', backgroundColor: COLORS.warning + '0A' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  safetyLabel: { color: COLORS.textSecondary, fontSize: 14, flex: 1 },
  safetyWarning: { backgroundColor: COLORS.warning + '11', borderRadius: 12, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.warning + '33' },
  safetyWarningText: { color: COLORS.warning, fontSize: 13, lineHeight: 20 },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: SPACING.sm },
  continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
