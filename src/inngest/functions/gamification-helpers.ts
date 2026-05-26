import type { UserStage } from "@prisma/client";

// ─── BOLT milestones ──────────────────────────────────────────────────────────

export const BOLT_MILESTONES = [15, 25, 35] as const;
export type BoltMilestone = (typeof BOLT_MILESTONES)[number];

/**
 * Returns which BOLT milestones are crossed for the first time by `newSeconds`
 * given the previous best (or null if no prior test).
 */
export function detectBoltMilestones(
  newSeconds: number,
  previousBestSeconds: number | null
): BoltMilestone[] {
  return BOLT_MILESTONES.filter((m) => {
    const previouslyBelow =
      previousBestSeconds === null || previousBestSeconds < m;
    const nowAtOrAbove = newSeconds >= m;
    return previouslyBelow && nowAtOrAbove;
  });
}

// ─── Stage ordering ───────────────────────────────────────────────────────────

export const STAGE_ORDER: UserStage[] = [
  "EXPLORER",
  "PRACTITIONER",
  "OPTIMIZER",
  "COACH",
];

export function stageIndex(stage: UserStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function nextStageAfter(stage: UserStage): UserStage | null {
  const idx = stageIndex(stage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

// ─── Stage requirements ───────────────────────────────────────────────────────

export interface StageRequirements {
  boltMin: number;
  sessionsMin: number;
  streakMin: number;
}

export const STAGE_REQUIREMENTS: Record<string, StageRequirements> = {
  PRACTITIONER: { boltMin: 20, sessionsMin: 10, streakMin: 0 },
  OPTIMIZER: { boltMin: 30, sessionsMin: 40, streakMin: 7 },
  COACH: { boltMin: 40, sessionsMin: 100, streakMin: 30 },
};

export const STAGE_BENEFITS: Record<string, string> = {
  PRACTITIONER: "Access advanced biochemistry protocols",
  OPTIMIZER: "Unlock personalised HRV-driven sessions",
  COACH: "Access coach-level insights and reporting",
};
