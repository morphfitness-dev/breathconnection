import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Lifestyle'> };

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Mostly sitting, little regular exercise' },
  { key: 'lightly_active', label: 'Lightly active', desc: 'Light activity 1–3 days/week' },
  { key: 'moderately_active', label: 'Moderately active', desc: 'Moderate exercise 3–5 days/week' },
  { key: 'very_active', label: 'Very active', desc: 'Hard exercise 6–7 days/week' },
  { key: 'athlete', label: 'Athlete', desc: 'Training twice daily or competitive sport' },
];

export function LifestyleScreen({ navigation }: Props) {
  const updateAssessment = useAppStore(s => s.updateAssessment);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);

  function saveAndContinue() {
    if (activityLevel) updateAssessment({ activityLevel: activityLevel as any });
    navigation.navigate('ProgrammeGeneration');
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.progress}>
            <Text style={styles.step}>STEP 7 OF 8</Text>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: '87.5%' }]} /></View>
          </View>

          <Text style={styles.title}>Your Activity Level</Text>
          <Text style={styles.subtitle}>
            Athletic users get access to performance-focused biochemistry protocols and breathing rate tracking.
          </Text>

          {ACTIVITY_LEVELS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[styles.card, activityLevel === a.key && styles.cardSelected]}
              onPress={() => setActivityLevel(a.key)}
            >
              <View style={styles.cardRow}>
                <View>
                  <Text style={[styles.cardLabel, activityLevel === a.key && styles.cardLabelSelected]}>{a.label}</Text>
                  <Text style={styles.cardDesc}>{a.desc}</Text>
                </View>
                {activityLevel === a.key && <Text style={styles.check}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}

          {activityLevel === 'athlete' || activityLevel === 'very_active' ? (
            <View style={styles.athleteBox}>
              <Text style={styles.athleteBoxTitle}>Athlete Programme Unlocked</Text>
              <Text style={styles.athleteBoxBody}>
                You'll have access to performance breathing protocols, Tymewear VitalPro integration for breathing rate tracking, and advanced biochemistry content.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.continueButton, !activityLevel && styles.disabledButton]}
            onPress={saveAndContinue}
            disabled={!activityLevel}
          >
            <Text style={styles.continueButtonText}>Generate My Programme →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ProgrammeGeneration')}>
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
  card: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '11' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  cardLabelSelected: { color: COLORS.textPrimary },
  cardDesc: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  check: { color: COLORS.primary, fontSize: 18, fontWeight: '700' },
  athleteBox: { backgroundColor: COLORS.biochemistry + '11', borderRadius: 14, padding: SPACING.md, gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.biochemistry + '33' },
  athleteBoxTitle: { color: COLORS.biochemistry, fontSize: 14, fontWeight: '600' },
  athleteBoxBody: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: SPACING.md },
  continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.4 },
  skipText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
});
