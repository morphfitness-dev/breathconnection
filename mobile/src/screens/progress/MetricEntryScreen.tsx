import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '../../constants/theme';
import { logMetric } from '../../api/client';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

type MetricType = 'hrv' | 'rhr' | 'rr' | 'spo2';

const METRIC_CONFIG: Record<MetricType, { label: string; unit: string; color: string; placeholder: string; min: number; max: number; description: string; tip: string }> = {
  hrv: {
    label: 'HRV', unit: 'ms (RMSSD)', color: COLORS.neurophysiology, placeholder: '45',
    min: 1, max: 200,
    description: 'Heart Rate Variability — the key indicator of nervous system balance.',
    tip: 'Measure first thing in the morning before getting up, ideally with a chest strap. Most HRV apps show RMSSD.',
  },
  rhr: {
    label: 'Resting Heart Rate', unit: 'bpm', color: COLORS.neurophysiology, placeholder: '62',
    min: 30, max: 120,
    description: 'Resting heart rate — lower generally indicates better cardiovascular fitness.',
    tip: 'Count beats for 60 seconds while lying still, or use a pulse oximeter.',
  },
  rr: {
    label: 'Resting Respiratory Rate', unit: 'breaths/min', color: COLORS.biomechanics, placeholder: '12',
    min: 2, max: 40,
    description: 'Breaths per minute at rest — a direct measure of your breathing efficiency.',
    tip: 'Count breaths for 60 seconds while breathing naturally. Target: 8–12 breaths per minute.',
  },
  spo2: {
    label: 'Blood Oxygen (SpO₂)', unit: '%', color: COLORS.biochemistry, placeholder: '98',
    min: 85, max: 100,
    description: 'Peripheral blood oxygen saturation — resting baseline and post-hold measurements.',
    tip: 'Use a pulse oximeter on your finger. Rest for 2 minutes before measuring.',
  },
};

export function MetricEntryScreen({ navigation }: Props) {
  const [activeType, setActiveType] = useState<MetricType>('hrv');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState<Array<{ type: string; value: number; savedAt: string }>>([]);

  const config = METRIC_CONFIG[activeType];

  async function save() {
    const num = parseFloat(value);
    if (isNaN(num) || num < config.min || num > config.max) {
      Alert.alert('Invalid value', `Please enter a value between ${config.min} and ${config.max} ${config.unit}`);
      return;
    }
    setSaving(true);
    try {
      await logMetric({ type: activeType, value: num, source: 'manual', context: 'morning' });
      setRecentEntries(prev => [{ type: activeType, value: num, savedAt: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
      setValue('');
      Alert.alert('Saved', `${config.label}: ${num} ${config.unit.split(' ')[0]}`);
    } catch {
      Alert.alert('Error', 'Could not save metric.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Log a Metric</Text>
          <Text style={styles.subtitle}>Manually enter readings from your devices or self-tests.</Text>

          {/* Metric type selector */}
          <View style={styles.typeGrid}>
            {(Object.keys(METRIC_CONFIG) as MetricType[]).map(t => {
              const c = METRIC_CONFIG[t];
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeCard, activeType === t && { borderColor: c.color, backgroundColor: c.color + '11' }]}
                  onPress={() => { setActiveType(t); setValue(''); }}
                >
                  <Text style={[styles.typeLabel, activeType === t && { color: c.color }]}>{c.label}</Text>
                  <Text style={styles.typeUnit}>{c.unit.split(' ')[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Entry form */}
          <View style={[styles.entryCard, { borderColor: config.color + '44' }]}>
            <Text style={styles.entryLabel}>{config.label}</Text>
            <Text style={styles.entryDesc}>{config.description}</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.valueInput, { borderColor: config.color + '66' }]}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
                placeholder={config.placeholder}
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.unitLabel}>{config.unit}</Text>
            </View>

            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>{config.tip}</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: config.color }, (!value || saving) && styles.disabledButton]}
              onPress={save}
              disabled={!value || saving}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Saving…' : `Save ${config.label}`}</Text>
            </TouchableOpacity>
          </View>

          {/* Reference ranges */}
          <View style={styles.referenceCard}>
            <Text style={styles.referenceTitle}>Reference Ranges</Text>
            {getRanges(activeType).map(r => (
              <View key={r.label} style={styles.referenceRow}>
                <View style={[styles.referenceDot, { backgroundColor: r.color }]} />
                <Text style={styles.referenceRange}>{r.range}</Text>
                <Text style={styles.referenceLabel}>{r.label}</Text>
              </View>
            ))}
          </View>

          {/* Recent entries */}
          {recentEntries.length > 0 && (
            <View style={styles.recentCard}>
              <Text style={styles.recentTitle}>Just saved</Text>
              {recentEntries.map((e, i) => (
                <View key={i} style={styles.recentRow}>
                  <Text style={styles.recentType}>{METRIC_CONFIG[e.type as MetricType]?.label ?? e.type}</Text>
                  <Text style={[styles.recentValue, { color: METRIC_CONFIG[e.type as MetricType]?.color ?? COLORS.primary }]}>{e.value}</Text>
                  <Text style={styles.recentTime}>{e.savedAt}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getRanges(type: MetricType) {
  const map: Record<MetricType, Array<{ range: string; label: string; color: string }>> = {
    hrv: [
      { range: '< 20ms', label: 'Very low — chronic stress or fatigue', color: COLORS.error },
      { range: '20–40ms', label: 'Low — below average', color: COLORS.warning },
      { range: '40–60ms', label: 'Average', color: '#FFD54F' },
      { range: '60–100ms', label: 'Good', color: '#8BC34A' },
      { range: '> 100ms', label: 'Excellent — elite recovery', color: COLORS.success },
    ],
    rhr: [
      { range: '> 80 bpm', label: 'Elevated — potential concern', color: COLORS.error },
      { range: '70–80 bpm', label: 'Average', color: COLORS.warning },
      { range: '60–70 bpm', label: 'Good', color: '#8BC34A' },
      { range: '50–60 bpm', label: 'Excellent', color: COLORS.success },
      { range: '< 50 bpm', label: 'Athlete-level', color: COLORS.neurophysiology },
    ],
    rr: [
      { range: '> 20 bpm', label: 'Significant over-breathing', color: COLORS.error },
      { range: '15–20 bpm', label: 'Over-breathing — address this', color: COLORS.warning },
      { range: '12–15 bpm', label: 'Moderate', color: '#FFD54F' },
      { range: '8–12 bpm', label: 'Optimal', color: COLORS.success },
      { range: '< 8 bpm', label: 'Very efficient breathing', color: COLORS.biochemistry },
    ],
    spo2: [
      { range: '< 90%', label: 'Critical — seek medical attention', color: COLORS.error },
      { range: '90–94%', label: 'Low — rest and reassess', color: COLORS.warning },
      { range: '95–96%', label: 'Acceptable baseline', color: '#FFD54F' },
      { range: '97–99%', label: 'Normal', color: COLORS.success },
      { range: '100%', label: 'Peak oxygenation', color: COLORS.biochemistry },
    ],
  };
  return map[type];
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  back: {},
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard, borderRadius: 12, padding: SPACING.md, gap: 2, borderWidth: 1, borderColor: COLORS.border },
  typeLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  typeUnit: { color: COLORS.textMuted, fontSize: 11 },
  entryCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1 },
  entryLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  entryDesc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  valueInput: { flex: 1, backgroundColor: COLORS.bgElevated, borderRadius: 12, padding: 14, color: COLORS.textPrimary, fontSize: 28, fontWeight: '700', textAlign: 'center', borderWidth: 1 },
  unitLabel: { color: COLORS.textMuted, fontSize: 13, flex: 1 },
  tipCard: { flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.bgElevated, borderRadius: 10, padding: SPACING.sm },
  tipIcon: { fontSize: 14 },
  tipText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
  saveButton: { borderRadius: 14, padding: 14, alignItems: 'center' },
  saveButtonText: { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.4 },
  referenceCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  referenceTitle: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  referenceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  referenceDot: { width: 8, height: 8, borderRadius: 4 },
  referenceRange: { width: 80, color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  referenceLabel: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  recentCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  recentTitle: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentType: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
  recentValue: { fontSize: 16, fontWeight: '700' },
  recentTime: { color: COLORS.textMuted, fontSize: 11, marginLeft: SPACING.sm },
});
