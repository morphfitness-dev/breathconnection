import type { PillarWeights, VideoLibraryItem } from '../types';
import { VIDEO_LIBRARY } from '../data/videoLibrary';

export interface WeekPlan {
  week: number;
  focus: string;
  sessions: DaySession[];
}

export interface DaySession {
  day: number;
  pillar: string;
  videoId: string;
  durationMinutes: number;
  isRestDay: boolean;
  biometricPrompt?: string;
}

const FOUR_WEEK_STARTER: Array<{ week: number; focus: string; primaryPillar: string; durationMin: number; biometricPrompt?: string }> = [
  { week: 1, focus: 'Biomechanics foundation', primaryPillar: 'biomechanics', durationMin: 10, biometricPrompt: 'breathing_pattern_self_assessment' },
  { week: 2, focus: 'Adding biochemistry', primaryPillar: 'biochemistry', durationMin: 12, biometricPrompt: 'bolt_retest' },
  { week: 3, focus: 'Adding neurophysiology', primaryPillar: 'neurophysiology', durationMin: 15, biometricPrompt: 'hrv_snapshot' },
  { week: 4, focus: 'Integration + wearable activation', primaryPillar: 'all', durationMin: 18, biometricPrompt: 'full_reassessment' },
];

export function generateFourWeekProgramme(pillarWeights: PillarWeights, tier: number, contraindications: string[]): WeekPlan[] {
  return FOUR_WEEK_STARTER.map(week => {
    const sessions: DaySession[] = [];

    for (let day = 1; day <= 7; day++) {
      if (day === 4 || day === 7) {
        sessions.push({ day, pillar: 'rest', videoId: '', durationMinutes: 0, isRestDay: true });
        continue;
      }

      const pillar = week.primaryPillar === 'all'
        ? rotatePillar(pillarWeights, day)
        : week.primaryPillar as 'biomechanics' | 'biochemistry' | 'neurophysiology';

      const anchorVideos = VIDEO_LIBRARY.filter(v =>
        v.pillar === pillar &&
        v.tier <= tier &&
        v.fourWeekAnchor &&
        !v.contraindicated.some(c => contraindications.includes(c))
      );

      const allCandidates = VIDEO_LIBRARY.filter(v =>
        v.pillar === pillar &&
        v.tier <= tier &&
        !v.contraindicated.some(c => contraindications.includes(c))
      );

      const pool = anchorVideos.length > 0 ? anchorVideos : allCandidates;
      const video = pool[day % pool.length] ?? VIDEO_LIBRARY[0];

      sessions.push({
        day,
        pillar,
        videoId: video.id,
        durationMinutes: week.durationMin,
        isRestDay: false,
        biometricPrompt: day === 1 ? week.biometricPrompt : undefined,
      });
    }

    return { week: week.week, focus: week.focus, sessions };
  });
}

function rotatePillar(weights: PillarWeights, day: number): 'biomechanics' | 'biochemistry' | 'neurophysiology' {
  const pillars: Array<'biomechanics' | 'biochemistry' | 'neurophysiology'> = [
    'biomechanics', 'biochemistry', 'neurophysiology',
  ];

  // Weight-informed rotation
  const sorted = [...pillars].sort((a, b) => weights[b] - weights[a]);
  return sorted[day % 3];
}

export function generateAdaptiveWeekPlan(
  pillarWeights: PillarWeights,
  tier: number,
  contraindications: string[],
  weekNumber: number,
  biometricInsights: Record<string, unknown>,
): WeekPlan {
  const adjustedWeights = { ...pillarWeights };

  // Apply biometric-driven adjustments per spec
  if (biometricInsights.hrv_below_baseline_3days) {
    adjustedWeights.neurophysiology = Math.min(100, adjustedWeights.neurophysiology + 10);
    adjustedWeights.biochemistry = Math.max(15, adjustedWeights.biochemistry - 5);
    adjustedWeights.biomechanics = Math.max(15, adjustedWeights.biomechanics - 5);
  }

  if (biometricInsights.rr_above_14_5days) {
    // Insert over-breathing correction
    adjustedWeights.biomechanics = Math.min(60, adjustedWeights.biomechanics + 15);
  }

  if (biometricInsights.bp_above_140_90) {
    adjustedWeights.neurophysiology = Math.min(80, adjustedWeights.neurophysiology + 20);
    adjustedWeights.biochemistry = Math.max(15, adjustedWeights.biochemistry - 20);
  }

  const sessions: DaySession[] = [];

  for (let day = 1; day <= 7; day++) {
    if (day === 4 || day === 7) {
      sessions.push({ day, pillar: 'rest', videoId: '', durationMinutes: 0, isRestDay: true });
      continue;
    }

    const pillar = rotatePillar(adjustedWeights, day);
    const candidates = VIDEO_LIBRARY.filter(v =>
      v.pillar === pillar &&
      v.tier <= tier &&
      !v.contraindicated.some(c => contraindications.includes(c))
    );

    const video = candidates[Math.floor(Math.random() * candidates.length)] ?? VIDEO_LIBRARY[0];

    sessions.push({
      day,
      pillar,
      videoId: video.id,
      durationMinutes: 15,
      isRestDay: false,
    });
  }

  return {
    week: weekNumber,
    focus: 'Adaptive training week',
    sessions,
  };
}
