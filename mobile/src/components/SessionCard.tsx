import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, PILLAR_CONFIG, getNSScoreColor } from '../constants/theme';
import type { AdaptedSession, Video } from '../types';

interface SessionCardProps {
  session: AdaptedSession;
  video: Video | null;
  onPress: () => void;
}

const GATE_LABELS: Record<string, string> = {
  full: 'Full Session',
  capped: 'Lighter Session',
  restorative: 'Restorative',
  gentle: 'Gentle Rest',
};

export function SessionCard({ session, video, onPress }: SessionCardProps) {
  const pillarConfig = PILLAR_CONFIG[session.pillar];
  const nsColor = getNSScoreColor(session.nsScore);
  const gateLabel = GATE_LABELS[session.intensityGate] ?? session.intensityGate;
  const minutes = Math.round(session.durationMinutes);
  const durationLabel = video ? Math.round(video.durationSeconds / 60) : minutes;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={[pillarConfig.color + '22', COLORS.bgCard]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.pillarLabel, { color: pillarConfig.color }]}>
              {pillarConfig.label.toUpperCase()}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {video?.title ?? 'Session'}
            </Text>
          </View>
          <View style={[styles.nsBadge, { borderColor: nsColor + '66', backgroundColor: nsColor + '22' }]}>
            <Text style={[styles.nsBadgeText, { color: nsColor }]}>{session.nsScore}</Text>
            <Text style={[styles.nsLabel, { color: nsColor }]}>NS</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {video?.description ?? ''}
        </Text>

        <View style={styles.footer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{durationLabel} min</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: pillarConfig.color + '33' }]}>
            <Text style={[styles.tagText, { color: pillarConfig.color }]}>{gateLabel}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Tier {session.tier}</Text>
          </View>
        </View>

        {session.adaptationReason && (
          <View style={styles.adaptationBanner}>
            <Text style={styles.adaptationText}>{session.adaptationReason}</Text>
          </View>
        )}

        <View style={[styles.startButton, { backgroundColor: pillarConfig.color }]}>
          <Text style={styles.startText}>Start Session →</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  pillarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    lineHeight: 24,
  },
  nsBadge: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 52,
  },
  nsBadgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  nsLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  adaptationBanner: {
    backgroundColor: COLORS.info + '22',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  adaptationText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  startButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  startText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
