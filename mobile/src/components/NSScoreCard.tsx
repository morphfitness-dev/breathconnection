import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, getNSScoreColor } from '../constants/theme';
import type { NSScoreResult } from '../types';

interface NSScoreCardProps {
  nsScore: NSScoreResult;
  compact?: boolean;
}

export function NSScoreCard({ nsScore, compact = false }: NSScoreCardProps) {
  const color = getNSScoreColor(nsScore.score);

  if (compact) {
    return (
      <View style={[styles.compact, { borderColor: color + '66' }]}>
        <Text style={[styles.compactScore, { color }]}>{nsScore.score}</Text>
        <Text style={styles.compactLabel}>NS Score</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[color + '22', color + '11']}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Nervous System Score</Text>
        <Text style={[styles.score, { color }]}>{nsScore.score}</Text>
      </View>
      <View style={[styles.bar, { backgroundColor: COLORS.bgElevated }]}>
        <View style={[styles.barFill, { width: `${nsScore.score}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.interpretation, { color }]}>{nsScore.interpretation}</Text>
      <Text style={styles.message}>{nsScore.message}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  score: {
    fontSize: 40,
    fontWeight: '700',
  },
  bar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  interpretation: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  compact: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bgCard,
  },
  compactScore: {
    fontSize: 22,
    fontWeight: '700',
  },
  compactLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
