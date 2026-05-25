import type { PrimaryGoal, ExperienceLevel } from "@/lib/assessment/pillar-weights";

export interface ProgrammeInput {
  primaryGoal: PrimaryGoal;
  boltScore: number;
  experience: ExperienceLevel;
  dailyMinutes: 5 | 10 | 15 | 30;
}

export interface ProgrammeConfig {
  slug: string;
  startingTier: 1 | 2;
  dailyMinutes: number;
}

const GOAL_TO_PROGRAMME: Record<PrimaryGoal, string> = {
  stress_calm: "hrv-optimisation",
  anxiety_relief: "anxiety-management",
  athletic_performance: "cardiovascular-endurance",
  sleep_improvement: "sleep-improvement",
  general_wellbeing: "hrv-optimisation",
};

function getStartingTier(experience: ExperienceLevel, boltScore: number): 1 | 2 {
  if (experience === "beginner" || experience === "some") return 1;
  if (boltScore >= 20) return 2;
  return 1;
}

export function generateProgrammeConfig(input: ProgrammeInput): ProgrammeConfig {
  return {
    slug: GOAL_TO_PROGRAMME[input.primaryGoal],
    startingTier: getStartingTier(input.experience, input.boltScore),
    dailyMinutes: input.dailyMinutes,
  };
}
