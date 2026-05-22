import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../constants/theme';
import { getMilestones, getBoltLeaderboard, getGamificationProfile } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { PillarRings } from '../../components/PillarRings';
import type { Milestone } from '../../types';

export function LeaderboardScreen() {
  const { gamification } = useAppStore();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'milestones' | 'leaderboard'>('milestones');

  useEffect(() => {
    Promise.all([getMilestones(), getBoltLeaderboard()])
      .then(([m, l]) => { setMilestones(m); setLeaderboard(l); })
      .catch(() => {});
  }, []);

  const achieved = milestones.filter(m => m.achieved);
  const upcoming = milestones.filter(m => !m.achieved);

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.screenTitle}>Progress & Milestones</Text>

          {/* Stage Card */}
          {gamification && (
            <View style={styles.stageCard}>
              <View style={styles.stageHeader}>
                <Text style={styles.stageName}>{formatStage(gamification.stage)}</Text>
                <Text style={styles.stageTier}>Tier {gamification.tier}</Text>
              </View>
              <Text style={styles.stageStats}>{gamification.totalSessions} sessions · {gamification.totalMilestones} milestones</Text>
              <Text style={styles.stageProgress}>{getStageProgress(gamification.stage, gamification)}</Text>

              <View style={styles.stageRings}>
                <PillarRings
                  biomechanics={gamification.pillarRings.biomechanics}
                  biochemistry={gamification.pillarRings.biochemistry}
                  neurophysiology={gamification.pillarRings.neurophysiology}
                  size="small"
                />
              </View>
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'milestones' && styles.tabActive]}
              onPress={() => setActiveTab('milestones')}
            >
              <Text style={[styles.tabText, activeTab === 'milestones' && styles.tabTextActive]}>Milestones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
              onPress={() => setActiveTab('leaderboard')}
            >
              <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>BOLT Leaderboard</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'milestones' && (
            <>
              {achieved.length > 0 && (
                <>
                  <Text style={styles.subTitle}>Achieved ({achieved.length})</Text>
                  {achieved.map(m => (
                    <View key={m.type} style={styles.milestoneCard}>
                      <Text style={styles.milestoneDot}>✓</Text>
                      <View style={styles.milestoneInfo}>
                        <Text style={styles.milestoneLabel}>{m.label}</Text>
                        <Text style={styles.milestoneDesc}>{m.description}</Text>
                        {m.achievedAt && <Text style={styles.milestoneDate}>{formatDate(m.achievedAt)}</Text>}
                      </View>
                    </View>
                  ))}
                </>
              )}

              {upcoming.length > 0 && (
                <>
                  <Text style={styles.subTitle}>Upcoming</Text>
                  {upcoming.slice(0, 6).map(m => (
                    <View key={m.type} style={[styles.milestoneCard, styles.milestoneLocked]}>
                      <Text style={styles.milestoneLockIcon}>○</Text>
                      <View style={styles.milestoneInfo}>
                        <Text style={styles.milestoneLockLabel}>{m.label}</Text>
                        <Text style={styles.milestoneLockDesc}>{m.description}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          {activeTab === 'leaderboard' && leaderboard && (
            <>
              <View style={styles.leaderboardCard}>
                <Text style={styles.leaderboardTitle}>Your BOLT Score</Text>
                <Text style={styles.leaderboardScore}>
                  {leaderboard.personal.current !== null ? `${leaderboard.personal.current}s` : '—'}
                </Text>
                <Text style={styles.leaderboardStage}>{formatStage(leaderboard.personal.stage)}</Text>
              </View>

              {leaderboard.community.percentile !== null && (
                <View style={styles.communityCard}>
                  <Text style={styles.communityTitle}>Community Standing</Text>
                  <Text style={styles.communityPercentile}>{leaderboard.community.message}</Text>
                  <Text style={styles.communityTotal}>{leaderboard.community.totalUsers} users on the leaderboard</Text>
                </View>
              )}

              <View style={styles.boltInfoCard}>
                <Text style={styles.boltInfoTitle}>BOLT Score Guide</Text>
                {[
                  { range: '< 10s', label: 'Foundation — focus on nasal breathing' },
                  { range: '10–20s', label: 'Building CO₂ tolerance' },
                  { range: '20–25s', label: 'Practitioner entry threshold' },
                  { range: '25–35s', label: 'Kumbhaka unlocked' },
                  { range: '35s+', label: 'Optimizer threshold' },
                ].map(r => (
                  <View key={r.range} style={styles.boltInfoRow}>
                    <Text style={[styles.boltInfoRange, { color: COLORS.biochemistry }]}>{r.range}</Text>
                    <Text style={styles.boltInfoLabel}>{r.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function formatStage(stage: string) {
  const map: Record<string, string> = {
    explorer: 'Explorer',
    practitioner: 'Practitioner',
    optimizer: 'Optimizer',
    coach: 'Coach',
  };
  return map[stage] ?? stage;
}

function getStageProgress(stage: string, gam: any): string {
  switch (stage) {
    case 'explorer':
      return `Complete 4-week programme to advance to Practitioner`;
    case 'practitioner':
      return `BOLT ≥ 25 + 7 coherence sessions + NS avg ≥ 60 to reach Optimizer`;
    case 'optimizer':
      return `100 coherence sessions or BOLT ≥ 35 or 6 monthly reports to reach Coach`;
    case 'coach':
      return 'You\'ve completed the journey.';
    default: return '';
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  screenTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  stageCard: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary + '44' },
  stageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageName: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  stageTier: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  stageStats: { color: COLORS.textSecondary, fontSize: 13 },
  stageProgress: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },
  stageRings: { alignSelf: 'center', marginTop: SPACING.sm },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 4, gap: 4 },
  tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.bgElevated },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: COLORS.textPrimary },
  subTitle: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  milestoneCard: { flexDirection: 'row', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.success + '44' },
  milestoneLocked: { borderColor: COLORS.border, opacity: 0.6 },
  milestoneDot: { color: COLORS.success, fontSize: 18, fontWeight: '700' },
  milestoneLockIcon: { color: COLORS.textMuted, fontSize: 18 },
  milestoneInfo: { flex: 1, gap: 2 },
  milestoneLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  milestoneDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  milestoneDate: { color: COLORS.textMuted, fontSize: 11 },
  milestoneLockLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  milestoneLockDesc: { color: COLORS.textMuted, fontSize: 12 },
  leaderboardCard: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.biochemistry + '44' },
  leaderboardTitle: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  leaderboardScore: { color: COLORS.biochemistry, fontSize: 56, fontWeight: '700' },
  leaderboardStage: { color: COLORS.textSecondary, fontSize: 14 },
  communityCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  communityTitle: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  communityPercentile: { color: COLORS.primary, fontSize: 18, fontWeight: '600' },
  communityTotal: { color: COLORS.textMuted, fontSize: 12 },
  boltInfoCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  boltInfoTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: SPACING.xs },
  boltInfoRow: { flexDirection: 'row', gap: SPACING.md },
  boltInfoRange: { width: 60, fontSize: 13, fontWeight: '600' },
  boltInfoLabel: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
});
