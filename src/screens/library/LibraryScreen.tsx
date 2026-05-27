import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, PILLAR_CONFIG } from '../../constants/theme';
import { getVideos } from '../../api/client';
import type { Video, Pillar } from '../../types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

type FilterPillar = Pillar | 'all';
type FilterTier = 0 | 1 | 2 | 3;

const DURATION_LABELS: Record<string, string> = {
  short: '< 8 min',
  medium: '8–15 min',
  long: '15+ min',
};

export function LibraryScreen({ navigation }: Props) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filtered, setFiltered] = useState<Video[]>([]);
  const [pillar, setPillar] = useState<FilterPillar>('all');
  const [tier, setTier] = useState<FilterTier>(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVideos()
      .then(data => { setVideos(data); setFiltered(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = videos;
    if (pillar !== 'all') result = result.filter(v => v.pillar === pillar);
    if (tier !== 0) result = result.filter(v => v.tier === tier);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(v => v.title.toLowerCase().includes(q) || v.technique.toLowerCase().includes(q) || v.tags.some((t: string) => t.includes(q)));
    }
    setFiltered(result);
  }, [videos, pillar, tier, search]);

  const grouped = groupByPillar(filtered);

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Library</Text>
          <Text style={styles.count}>{filtered.length} videos</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search techniques, tags…"
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Pillar filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {(['all', 'biomechanics', 'biochemistry', 'neurophysiology'] as const).map(p => {
            const active = pillar === p;
            const color = p === 'all' ? COLORS.primary : PILLAR_CONFIG[p]?.color ?? COLORS.primary;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.filterChip, active && { backgroundColor: color + '22', borderColor: color }]}
                onPress={() => setPillar(p)}
              >
                <Text style={[styles.filterChipText, active && { color }]}>
                  {p === 'all' ? 'All' : PILLAR_CONFIG[p].label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={styles.filterDivider} />
          {([0, 1, 2, 3] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.filterChip, tier === t && { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary }]}
              onPress={() => setTier(t)}
            >
              <Text style={[styles.filterChipText, tier === t && { color: COLORS.primary }]}>
                {t === 0 ? 'All Tiers' : `Tier ${t}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loading}><Text style={styles.loadingText}>Loading library…</Text></View>
        ) : (
          <FlatList
            data={pillar === 'all' ? Object.entries(grouped) as [string, Video[]][] : [[pillar, grouped[pillar] ?? []]] as [string, Video[]][]}
            keyExtractor={([p]) => p}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: [sectionPillar, sectionVideos] }) => (
              <View style={styles.section}>
                {pillar === 'all' && (
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: PILLAR_CONFIG[sectionPillar as Pillar]?.color ?? COLORS.primary }]}>
                      {PILLAR_CONFIG[sectionPillar as Pillar]?.label ?? sectionPillar}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      {PILLAR_CONFIG[sectionPillar as Pillar]?.subtitle}
                    </Text>
                  </View>
                )}
                {sectionVideos.map(video => (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.videoCard}
                    onPress={() => navigation.navigate('SessionPlayer', { videoId: video.id })}
                  >
                    <View style={styles.videoLeft}>
                      <View style={styles.videoIdBadge}>
                        <Text style={styles.videoIdText}>{video.id}</Text>
                      </View>
                    </View>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                      <Text style={styles.videoDesc} numberOfLines={1}>{video.description}</Text>
                      <View style={styles.videoTags}>
                        <View style={[styles.videoTierBadge, { backgroundColor: getTierColor(video.tier) + '22' }]}>
                          <Text style={[styles.videoTierText, { color: getTierColor(video.tier) }]}>Tier {video.tier}</Text>
                        </View>
                        <Text style={styles.videoDuration}>{Math.round(video.durationSeconds / 60)} min</Text>
                        {video.biometricFeedbackType !== 'none' && (
                          <View style={styles.biometricBadge}>
                            <Text style={styles.biometricBadgeText}>{getBiometricIcon(video.biometricFeedbackType)}</Text>
                          </View>
                        )}
                        {video.fourWeekAnchor && (
                          <View style={styles.anchorBadge}>
                            <Text style={styles.anchorBadgeText}>4-week</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.videoArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No videos match your filters.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function groupByPillar(videos: Video[]): Record<string, Video[]> {
  const order = ['biomechanics', 'biochemistry', 'neurophysiology'];
  const groups: Record<string, Video[]> = { biomechanics: [], biochemistry: [], neurophysiology: [] };
  for (const v of videos) {
    if (groups[v.pillar]) groups[v.pillar].push(v);
  }
  const result: Record<string, Video[]> = {};
  for (const p of order) {
    if (groups[p].length > 0) result[p] = groups[p];
  }
  return result;
}

function getTierColor(tier: number) {
  return [COLORS.textMuted, COLORS.biomechanics, COLORS.biochemistry, COLORS.neurophysiology][tier] ?? COLORS.textMuted;
}

function getBiometricIcon(type: string) {
  const icons: Record<string, string> = {
    hrv: '❤️', eeg: '🧠', breathing_rate: '🫁', spO2: '💧', blood_pressure: '🩺',
  };
  return icons[type] ?? '📊';
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  screenTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  count: { color: COLORS.textMuted, fontSize: 13 },
  searchContainer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  searchInput: { backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 12, color: COLORS.textPrimary, fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  filterRow: { flexGrow: 0, marginTop: SPACING.md },
  filterContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  filterChip: { borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
  filterChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  filterDivider: { width: 1, height: '100%', backgroundColor: COLORS.border, marginHorizontal: SPACING.xs },
  listContent: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 100 },
  section: { gap: SPACING.sm },
  sectionHeader: { gap: 2, marginBottom: SPACING.xs },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: 12 },
  videoCard: { flexDirection: 'row', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'flex-start' },
  videoLeft: { paddingTop: 2 },
  videoIdBadge: { backgroundColor: COLORS.bgElevated, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  videoIdText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', fontFamily: 'monospace' },
  videoInfo: { flex: 1, gap: 4 },
  videoTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  videoDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  videoTags: { flexDirection: 'row', gap: SPACING.xs, alignItems: 'center', flexWrap: 'wrap' },
  videoTierBadge: { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  videoTierText: { fontSize: 10, fontWeight: '600' },
  videoDuration: { color: COLORS.textMuted, fontSize: 11 },
  biometricBadge: { backgroundColor: COLORS.bgElevated, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 4 },
  biometricBadgeText: { fontSize: 10 },
  anchorBadge: { backgroundColor: COLORS.primary + '22', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  anchorBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  videoArrow: { color: COLORS.textMuted, fontSize: 16, paddingTop: 2 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textMuted },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});
