import type { GamificationTrigger } from '../types';

export interface MilestoneDefinition {
  type: string;
  label: string;
  description: string;
  celebrationLevel: 'small' | 'medium' | 'large' | 'epic';
  shareCard: boolean;
}

export const MILESTONES: MilestoneDefinition[] = [
  { type: 'bolt_15', label: 'CO₂ Baseline', description: 'BOLT score reached 15 seconds — nasal breathing habit established.', celebrationLevel: 'medium', shareCard: false },
  { type: 'bolt_20', label: 'Biochemistry Awakening', description: 'BOLT score reached 20 seconds.', celebrationLevel: 'medium', shareCard: true },
  { type: 'bolt_25', label: 'Kumbhaka Threshold', description: 'You\'ve reached 25 seconds — you\'re ready for kumbhaka.', celebrationLevel: 'large', shareCard: true },
  { type: 'bolt_35', label: 'Elite Adaptation', description: 'Your body is adapting to CO₂ at an elite level.', celebrationLevel: 'epic', shareCard: true },
  { type: 'hold_30s', label: '30-Second Hold', description: 'You\'ve entered the kumbhaka tier.', celebrationLevel: 'medium', shareCard: false },
  { type: 'hold_45s', label: '45-Second Hold', description: 'Your body is adapting at an elite level.', celebrationLevel: 'large', shareCard: true },
  { type: 'coherence_7', label: 'One Week of Real Shifts', description: '7 sessions where HRV measurably improved.', celebrationLevel: 'medium', shareCard: false },
  { type: 'coherence_30', label: 'A Month of Measurable Practice', description: '30 coherence sessions logged.', celebrationLevel: 'large', shareCard: true },
  { type: 'coherence_100', label: 'Optimizer Unlocked', description: '100 coherence sessions — Optimizer tier is yours.', celebrationLevel: 'epic', shareCard: true },
  { type: 'stage_practitioner', label: 'Practitioner', description: 'You\'ve moved to the Practitioner stage.', celebrationLevel: 'large', shareCard: true },
  { type: 'stage_optimizer', label: 'Optimizer', description: 'You\'ve reached the Optimizer stage.', celebrationLevel: 'epic', shareCard: true },
  { type: 'stage_coach', label: 'Coach', description: 'You\'ve completed the journey — you\'re a Coach.', celebrationLevel: 'epic', shareCard: true },
  { type: 'monthly_report_1', label: 'First Month Complete', description: 'Your first Monthly Physiology Report is ready.', celebrationLevel: 'medium', shareCard: true },
  { type: 'bolt_pr', label: 'New BOLT Personal Record', description: 'New BOLT personal record!', celebrationLevel: 'large', shareCard: true },
  { type: 'hold_pr', label: 'New Breath Hold Record', description: 'New breath hold personal record!', celebrationLevel: 'large', shareCard: true },
  { type: 'pillar_week_complete', label: 'Pillar Trilogy', description: 'All three pillars completed this week.', celebrationLevel: 'small', shareCard: false },
];

export function checkBoltMilestones(oldScore: number | null, newScore: number): GamificationTrigger[] {
  const triggers: GamificationTrigger[] = [];
  const thresholds = [
    { score: 15, type: 'bolt_15' },
    { score: 20, type: 'bolt_20' },
    { score: 25, type: 'bolt_25' },
    { score: 35, type: 'bolt_35' },
  ];

  for (const t of thresholds) {
    if (newScore >= t.score && (oldScore === null || oldScore < t.score)) {
      triggers.push({ type: t.type, userId: '', data: { score: newScore } });
    }
  }

  return triggers;
}

export function checkHoldMilestones(oldPr: number | null, newDuration: number): GamificationTrigger[] {
  const triggers: GamificationTrigger[] = [];

  if (oldPr === null || newDuration > oldPr) {
    triggers.push({ type: 'hold_pr', userId: '', data: { duration: newDuration } });

    if (newDuration >= 30 && (oldPr === null || oldPr < 30)) {
      triggers.push({ type: 'hold_30s', userId: '', data: { duration: newDuration } });
    }
    if (newDuration >= 45 && (oldPr === null || oldPr < 45)) {
      triggers.push({ type: 'hold_45s', userId: '', data: { duration: newDuration } });
    }
  }

  return triggers;
}

export function checkCoherenceStreakMilestones(oldStreak: number, newStreak: number): GamificationTrigger[] {
  const triggers: GamificationTrigger[] = [];
  const milestones = [7, 30, 100];

  for (const m of milestones) {
    if (newStreak >= m && oldStreak < m) {
      triggers.push({ type: `coherence_${m}`, userId: '', data: { streak: newStreak } });
    }
  }

  return triggers;
}

export function checkStageMilestone(oldStage: string, newStage: string): GamificationTrigger | null {
  if (oldStage === newStage) return null;
  return {
    type: `stage_${newStage}`,
    userId: '',
    data: { previousStage: oldStage, newStage },
  };
}

export function evaluateStageAdvancement(
  stage: string,
  bolt: number,
  coherenceStreak: number,
  nsScoreAvg30d: number,
  totalSessions: number,
  wearableConnected: boolean,
  monthlyReports: number,
): string {
  switch (stage) {
    case 'explorer':
      if (totalSessions >= 28 && bolt > 0) return 'practitioner';
      break;
    case 'practitioner':
      if (bolt >= 25 && coherenceStreak >= 7 && nsScoreAvg30d >= 60) return 'optimizer';
      break;
    case 'optimizer':
      if (coherenceStreak >= 100 || bolt >= 35 || monthlyReports >= 6) return 'coach';
      break;
  }
  return stage;
}

export function calculatePillarRings(sessionsThisWeek: Array<{ pillar: string }>): {
  biomechanics: number;
  biochemistry: number;
  neurophysiology: number;
  weeklyBalanceBadge: boolean;
} {
  const counts = { biomechanics: 0, biochemistry: 0, neurophysiology: 0 };
  for (const s of sessionsThisWeek) {
    if (s.pillar in counts) counts[s.pillar as keyof typeof counts]++;
  }

  const TARGET = 3;
  return {
    biomechanics: Math.min(1, counts.biomechanics / TARGET),
    biochemistry: Math.min(1, counts.biochemistry / TARGET),
    neurophysiology: Math.min(1, counts.neurophysiology / TARGET),
    weeklyBalanceBadge: counts.biomechanics >= 1 && counts.biochemistry >= 1 && counts.neurophysiology >= 1,
  };
}
