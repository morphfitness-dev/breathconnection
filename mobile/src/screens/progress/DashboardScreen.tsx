import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, PILLAR_CONFIG, getNSScoreColor } from '../../constants/theme';
import { getDashboard, logMetric } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { DashboardData } from '../../types';

export function DashboardScreen() {
  const { dashboard, setDashboard } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const d = dashboard;

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          <Text style={styles.screenTitle}>Progress</Text>

          {/* Three Primary Numbers */}
          <Text style={styles.sectionTitle}>Today's Metrics</Text>
          <View style={styles.primaryRow}>
            {/* NS Score */}
            <View style={[styles.primaryCard, { borderColor: d?.nsScore ? getNSScoreColor(d.nsScore.score) + '44' : COLORS.border }]}>
              <Text style={styles.primaryLabel}>NS Score</Text>
              {d?.nsScore ? (
                <>
                  <Text style={[styles.primaryValue, { color: getNSScoreColor(d.nsScore.score) }]}>
                    {d.nsScore.score}
                  </Text>
                  <Text style={[styles.primarySub, { color: getNSScoreColor(d.nsScore.score) }]}>
                    {d.nsScore.interpretation}
                  </Text>
                </>
              ) : (
                <Text style={styles.primaryEmpty}>–</Text>
              )}
            </View>

            {/* BOLT Score */}
            <View style={[styles.primaryCard, { borderColor: COLORS.biochemistry + '44' }]}>
              <Text style={styles.primaryLabel}>BOLT</Text>
              {d?.bolt.current ? (
                <>
                  <Text style={[styles.primaryValue, { color: COLORS.biochemistry }]}>{d.bolt.current}s</Text>
                  <Text style={[styles.primarySub, { color: COLORS.biochemistry }]}>CO₂ tolerance</Text>
                </>
              ) : (
                <Text style={styles.primaryEmpty}>–</Text>
              )}
            </View>

            {/* HRV Trend */}
            <View style={[styles.primaryCard, { borderColor: COLORS.neurophysiology + '44' }]}>
              <Text style={styles.primaryLabel}>HRV Trend</Text>
              {d?.hrv.latest ? (
                <>
                  <Text style={[styles.primaryValue, { color: COLORS.neurophysiology }]}>
                    {getTrendArrow(d.hrv.trend)}
                  </Text>
                  <Text style={[styles.primarySub, { color: COLORS.neurophysiology }]}>{d.hrv.latest}ms</Text>
                </>
              ) : (
                <Text style={styles.primaryEmpty}>–</Text>
              )}
            </View>
          </View>

          {/* Pillar Rings */}
          {d?.pillarRings && (
            <View style={styles.ringsCard}>
              <Text style={styles.sectionTitle}>Weekly Pillar Progress</Text>
              {(['biomechanics', 'biochemistry', 'neurophysiology'] as const).map(p => {
                const config = PILLAR_CONFIG[p];
                const fill = d.pillarRings[p] ?? 0;
                return (
                  <View key={p} style={styles.ringRow}>
                    <Text style={[styles.ringLabel, { color: config.color }]}>{config.label}</Text>
                    <View style={styles.ringBarTrack}>
                      <View style={[styles.ringBarFill, { width: `${fill * 100}%` as any, backgroundColor: config.color }]} />
                    </View>
                    <Text style={[styles.ringPct, { color: config.color }]}>{Math.round(fill * 100)}%</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* BOLT History */}
          {d?.bolt.history && d.bolt.history.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>BOLT History</Text>
              <View style={styles.boltChart}>
                {d.bolt.history.slice(-8).map((b, i) => {
                  const max = Math.max(...d.bolt.history.map(x => x.score), 1);
                  return (
                    <View key={i} style={styles.boltBar}>
                      <View style={[styles.boltBarFill, { height: `${(b.score / max) * 100}%` as any }]} />
                      <Text style={styles.boltBarLabel}>{Math.round(b.score)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Streaks */}
          {d?.streaks && d.streaks.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Streaks</Text>
              {d.streaks.map(s => (
                <View key={s.type} style={styles.streakRow}>
                  <Text style={styles.streakType}>{formatStreakType(s.type)}</Text>
                  <Text style={[styles.streakCount, { color: COLORS.neurophysiology }]}>{s.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Other metrics */}
          <View style={styles.metricsGrid}>
            {d?.rhr && <MetricTile label="Resting HR" value={`${Math.round(d.rhr)} bpm`} color={COLORS.neurophysiology} />}
            {d?.restingRR && <MetricTile label="Resting RR" value={`${Math.round(d.restingRR)} bpm`} color={COLORS.biomechanics} />}
            {d?.spO2 && <MetricTile label="SpO₂" value={`${Math.round(d.spO2)}%`} color={COLORS.biochemistry} />}
          </View>

          {d?.bloodPressure && (
            <View style={styles.bpCard}>
              <Text style={styles.cardTitle}>Blood Pressure</Text>
              <Text style={styles.bpValue}>
                {d.bloodPressure.systolic}/{d.bloodPressure.diastolic} mmHg
              </Text>
              <Text style={styles.bpLabel}>{d.bloodPressure.label}</Text>
              <Text style={styles.bpDisclaimer}>If you have hypertension, share this data with your healthcare provider.</Text>
            </View>
          )}

          {/* Hold Records */}
          {d?.holdRecords && d.holdRecords.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Breath Hold Records</Text>
              {d.holdRecords.map((hr, i) => (
                <View key={i} style={styles.holdRow}>
                  {hr.isPersonalRecord && <Text style={styles.prBadge}>PR</Text>}
                  <Text style={styles.holdDuration}>{Math.round(hr.durationSeconds)}s</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function MetricTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.metricTile, { borderColor: color + '33' }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function getTrendArrow(trend: string) {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

function formatStreakType(type: string) {
  const m: Record<string, string> = {
    coherence: 'HRV Coherence Streak',
    daily_practice: 'Daily Practice',
    mindful_sessions: 'Mindful Sessions',
  };
  return m[type] ?? type;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  screenTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  primaryRow: { flexDirection: 'row', gap: SPACING.sm },
  primaryCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, gap: 2, borderWidth: 1, alignItems: 'center' },
  primaryLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  primaryValue: { fontSize: 26, fontWeight: '700' },
  primarySub: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  primaryEmpty: { color: COLORS.textMuted, fontSize: 24 },
  ringsCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ringLabel: { width: 100, fontSize: 12, fontWeight: '600' },
  ringBarTrack: { flex: 1, height: 8, backgroundColor: COLORS.bgElevated, borderRadius: 4, overflow: 'hidden' },
  ringBarFill: { height: '100%', borderRadius: 4 },
  ringPct: { width: 36, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  boltChart: { flexDirection: 'row', gap: SPACING.sm, height: 80, alignItems: 'flex-end' },
  boltBar: { flex: 1, alignItems: 'center', gap: 4 },
  boltBarFill: { width: '100%', backgroundColor: COLORS.biochemistry + 'AA', borderRadius: 4 },
  boltBarLabel: { color: COLORS.textMuted, fontSize: 9 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakType: { color: COLORS.textSecondary, fontSize: 14 },
  streakCount: { fontSize: 20, fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metricTile: { flex: 1, minWidth: '30%', backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, alignItems: 'center', gap: 4, borderWidth: 1 },
  metricValue: { fontSize: 20, fontWeight: '700' },
  metricLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  bpCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  bpValue: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '700' },
  bpLabel: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic' },
  bpDisclaimer: { color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },
  holdRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  prBadge: { backgroundColor: COLORS.biochemistry, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  holdDuration: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
});
