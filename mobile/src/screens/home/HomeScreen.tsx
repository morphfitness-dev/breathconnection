import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { getTodaySession, getGamificationProfile, getWearables } from '../../api/client';
import { NSScoreCard } from '../../components/NSScoreCard';
import { SessionCard } from '../../components/SessionCard';
import { PillarRings } from '../../components/PillarRings';
import { WearableStatus } from '../../components/WearableStatus';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'> };

const QUICK_ACCESS = [
  { key: 'NP-05', label: '3-min Stress', icon: '💭', pillar: 'neurophysiology', color: COLORS.neurophysiology },
  { key: 'NP-09', label: '5-min Restore', icon: '🌙', pillar: 'neurophysiology', color: COLORS.neurophysiology },
  { key: 'BC-16', label: '5-min Wake-Up', icon: '☀️', pillar: 'biomechanics', color: COLORS.biomechanics },
];

export function HomeScreen({ navigation }: Props) {
  const { user, today, gamification, setToday, setGamification } = useAppStore();
  const [wearables, setWearables] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [todayData, gamData, wearableData] = await Promise.all([
        getTodaySession(),
        getGamificationProfile(),
        getWearables(),
      ]);
      setToday(todayData);
      setGamification(gamData);
      setWearables(wearableData);
    } catch (e) {
      console.log('Load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  function startSession(videoId: string) {
    navigation.navigate('SessionPlayer', { videoId });
  }

  const nsScore = today?.nsScore;
  const rings = gamification?.pillarRings ?? { biomechanics: 0, biochemistry: 0, neurophysiology: 0 };

  // NS-aware quick access — replace Energise with Restore on low readiness
  const quickAccess = nsScore && nsScore.score < 45
    ? QUICK_ACCESS.map(q => q.key === 'BC-16' ? { ...q, key: 'NP-09', label: 'Restore', icon: '🌿' } : q)
    : QUICK_ACCESS;

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.name ?? 'Practitioner'}
              </Text>
              <Text style={styles.date}>{formatDate()}</Text>
            </View>
            {wearables.length > 0 && (
              <WearableStatus devices={wearables} />
            )}
          </View>

          {/* Pillar Rings */}
          <View style={styles.ringsCard}>
            <Text style={styles.ringsTitle}>This Week</Text>
            <PillarRings
              biomechanics={rings.biomechanics}
              biochemistry={rings.biochemistry}
              neurophysiology={rings.neurophysiology}
            />
            {gamification && (
              <Text style={styles.stageChip}>
                {gamification.stage.charAt(0).toUpperCase() + gamification.stage.slice(1)} · {gamification.totalSessions} sessions
              </Text>
            )}
          </View>

          {/* NS Score */}
          {nsScore && (
            <NSScoreCard nsScore={nsScore} />
          )}

          {/* Today's Session */}
          {today && today.session && (
            <View>
              <Text style={styles.sectionTitle}>Today's Session</Text>
              <SessionCard
                session={today.session}
                video={today.video}
                onPress={() => startSession(today.session.videoId)}
              />
            </View>
          )}

          {loading && !today && (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Preparing your session…</Text>
            </View>
          )}

          {/* Daily Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('MorningCheckIn')}
            >
              <Text style={styles.actionIcon}>🌅</Text>
              <Text style={styles.actionLabel}>Morning{'\n'}Check-In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Programme')}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionLabel}>My{'\n'}Programme</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Access */}
          <View>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickRow}>
              {quickAccess.map(q => (
                <TouchableOpacity
                  key={q.key}
                  style={[styles.quickCard, { borderColor: q.color + '44' }]}
                  onPress={() => startSession(q.key)}
                >
                  <Text style={styles.quickIcon}>{q.icon}</Text>
                  <Text style={[styles.quickLabel, { color: q.color }]}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Streak Banner */}
          {gamification && gamification.coherenceStreak >= 3 && (
            <View style={styles.streakBanner}>
              <Text style={styles.streakIcon}>🔥</Text>
              <View>
                <Text style={styles.streakTitle}>{gamification.coherenceStreak}-session coherence streak</Text>
                <Text style={styles.streakSub}>HRV improved in each of these sessions</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.md },
  greeting: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '700' },
  date: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  ringsCard: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.lg, gap: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  ringsTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  stageChip: { color: COLORS.textMuted, fontSize: 12 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: SPACING.sm },
  loadingCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  loadingText: { color: COLORS.textMuted, fontSize: 14 },
  quickRow: { flexDirection: 'row', gap: SPACING.sm },
  quickCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, alignItems: 'center', gap: SPACING.xs, borderWidth: 1 },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  streakBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.warning + '44' },
  streakIcon: { fontSize: 28 },
  streakTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  streakSub: { color: COLORS.textMuted, fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },
  actionCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  actionIcon: { fontSize: 26 },
  actionLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
