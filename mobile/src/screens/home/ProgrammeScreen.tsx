import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, PILLAR_CONFIG } from '../../constants/theme';
import { api } from '../../api/client';
import type { Pillar } from '../../types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

interface DaySession {
  day: number;
  pillar: string;
  videoId: string;
  durationMinutes: number;
  isRestDay: boolean;
  biometricPrompt?: string;
  video?: { id: string; title: string; durationSeconds: number; pillar: Pillar } | null;
}

interface WeekPlan {
  week: number;
  focus: string;
  sessions: DaySession[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BIOMETRIC_PROMPT_LABELS: Record<string, string> = {
  breathing_pattern_self_assessment: '📋 Do breathing pattern test today',
  bolt_retest: '🎯 BOLT retest today',
  hrv_snapshot: '❤️ Check HRV snapshot',
  full_reassessment: '🔄 Full re-assessment',
};

export function ProgrammeScreen({ navigation }: Props) {
  const [programme, setProgramme] = useState<{ currentWeek: number; startedAt: string; weeklyPlan: WeekPlan[]; pillarWeights: Record<string, number> } | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/reports/programme/full');
      setProgramme(data);
      setActiveWeek(data.currentWeek);
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const today = new Date().getDay(); // 0=Sun
  const currentWeekData = programme?.weeklyPlan.find(w => w.week === activeWeek);

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Programme</Text>
            {programme && (
              <Text style={styles.weekBadge}>Week {programme.currentWeek} of {programme.weeklyPlan.length}</Text>
            )}
          </View>

          {programme && (
            <>
              {/* Pillar weights summary */}
              <View style={styles.weightsCard}>
                <Text style={styles.weightsTitle}>Your Pillar Emphasis</Text>
                <View style={styles.weightsRow}>
                  {Object.entries(programme.pillarWeights).map(([p, w]) => {
                    const config = PILLAR_CONFIG[p as Pillar];
                    if (!config) return null;
                    return (
                      <View key={p} style={styles.weightItem}>
                        <Text style={[styles.weightPct, { color: config.color }]}>{w}%</Text>
                        <Text style={[styles.weightLabel, { color: config.color }]}>{config.label.split('o')[0]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Week selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekSelector}>
                <View style={styles.weekSelectorContent}>
                  {programme.weeklyPlan.map(w => (
                    <TouchableOpacity
                      key={w.week}
                      style={[styles.weekChip, activeWeek === w.week && styles.weekChipActive, w.week === programme.currentWeek && styles.weekChipCurrent]}
                      onPress={() => setActiveWeek(w.week)}
                    >
                      <Text style={[styles.weekChipText, activeWeek === w.week && styles.weekChipTextActive]}>
                        W{w.week}
                      </Text>
                      {w.week === programme.currentWeek && <View style={styles.currentDot} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Current week focus */}
              {currentWeekData && (
                <>
                  <View style={styles.focusCard}>
                    <Text style={styles.focusLabel}>WEEK {activeWeek} FOCUS</Text>
                    <Text style={styles.focusTitle}>{currentWeekData.focus}</Text>
                  </View>

                  {/* Daily sessions */}
                  <Text style={styles.sectionTitle}>Daily Sessions</Text>
                  {currentWeekData.sessions.map(session => {
                    const dayName = DAYS[session.day % 7];
                    const isToday = activeWeek === programme.currentWeek && session.day % 7 === today;
                    const pillarConfig = session.pillar !== 'rest' ? PILLAR_CONFIG[session.pillar as Pillar] : null;

                    return (
                      <TouchableOpacity
                        key={session.day}
                        style={[styles.dayCard, isToday && styles.dayCardToday, session.isRestDay && styles.dayCardRest]}
                        onPress={() => {
                          if (!session.isRestDay && session.videoId) {
                            navigation.navigate('SessionPlayer', { videoId: session.videoId });
                          }
                        }}
                        disabled={session.isRestDay}
                      >
                        <View style={[styles.dayBadge, isToday && { backgroundColor: COLORS.primary }]}>
                          <Text style={[styles.dayBadgeText, isToday && { color: '#fff' }]}>{dayName}</Text>
                        </View>

                        <View style={styles.dayInfo}>
                          {session.isRestDay ? (
                            <Text style={styles.restDay}>Rest Day</Text>
                          ) : (
                            <>
                              <Text style={[styles.dayPillar, pillarConfig && { color: pillarConfig.color }]}>
                                {pillarConfig?.label ?? session.pillar}
                              </Text>
                              <Text style={styles.dayTitle} numberOfLines={1}>
                                {session.video?.title ?? session.videoId}
                              </Text>
                              <Text style={styles.dayDuration}>{session.durationMinutes} min</Text>
                            </>
                          )}
                          {session.biometricPrompt && (
                            <Text style={styles.biometricPrompt}>{BIOMETRIC_PROMPT_LABELS[session.biometricPrompt] ?? session.biometricPrompt}</Text>
                          )}
                        </View>

                        {!session.isRestDay && (
                          <Text style={[styles.dayArrow, pillarConfig && { color: pillarConfig.color }]}>→</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}

          {!programme && !refreshing && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No programme found. Complete your assessment to generate one.</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  screenTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  weekBadge: { color: COLORS.textMuted, fontSize: 13 },
  weightsCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  weightsTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  weightsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weightItem: { alignItems: 'center', gap: 2 },
  weightPct: { fontSize: 20, fontWeight: '700' },
  weightLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  weekSelector: { flexGrow: 0, marginHorizontal: -SPACING.lg },
  weekSelectorContent: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg },
  weekChip: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  weekChipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  weekChipCurrent: { borderStyle: 'dashed' },
  weekChipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  weekChipTextActive: { color: COLORS.primary },
  currentDot: { position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.success },
  focusCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, gap: 4, borderWidth: 1, borderColor: COLORS.border },
  focusLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  focusTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  dayCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  dayCardToday: { borderColor: COLORS.primary + '66', backgroundColor: COLORS.primary + '0A' },
  dayCardRest: { opacity: 0.5 },
  dayBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center' },
  dayBadgeText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  dayInfo: { flex: 1, gap: 2 },
  restDay: { color: COLORS.textMuted, fontSize: 14, fontStyle: 'italic' },
  dayPillar: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  dayTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  dayDuration: { color: COLORS.textMuted, fontSize: 12 },
  biometricPrompt: { color: COLORS.primary, fontSize: 12, marginTop: 2 },
  dayArrow: { color: COLORS.textMuted, fontSize: 16, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
