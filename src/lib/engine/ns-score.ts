export interface NSScoreInput {
  hrv7DayAvg?: number;
  hrvCurrent?: number;
  rhrCurrent?: number;
  rhr7DayAvg?: number;
  sleepQualityScore?: number;
  subjectiveStress?: 1 | 2 | 3 | 4 | 5;
  hasWearable: boolean;
}

export type NSScoreTier =
  | "exceptional"
  | "good"
  | "moderate"
  | "low"
  | "very_low";

export type SessionGate =
  | "full"
  | "standard"
  | "capped"
  | "restorative"
  | "gentle_five";

export interface NSScoreOutput {
  score: number;
  tier: NSScoreTier;
  explanation: string;
  sessionGate: SessionGate;
}

const EXPLANATIONS: Record<NSScoreTier, string> = {
  exceptional:
    "Your nervous system is primed today. We've unlocked your full session.",
  good: "You're in a good place today. Your standard programme is ready.",
  moderate:
    "Your nervous system is a little below its best. We've made today's session gentler.",
  low: "Your body is in recovery mode today. Here's a restorative session — no holds.",
  very_low:
    "Your nervous system needs rest. Here's a gentle 5 minutes to support you.",
};

function getTier(score: number): NSScoreTier {
  if (score >= 85) return "exceptional";
  if (score >= 65) return "good";
  if (score >= 45) return "moderate";
  if (score >= 25) return "low";
  return "very_low";
}

function getSessionGate(tier: NSScoreTier): SessionGate {
  switch (tier) {
    case "exceptional":
      return "full";
    case "good":
      return "standard";
    case "moderate":
      return "capped";
    case "low":
      return "restorative";
    case "very_low":
      return "gentle_five";
  }
}

export function calculateNSScore(input: NSScoreInput): NSScoreOutput {
  let score = 0;
  let weightUsed = 0;

  // HRV vs 7-day baseline — weight 40%
  if (input.hrv7DayAvg !== undefined && input.hrvCurrent !== undefined) {
    const ratio = input.hrvCurrent / input.hrv7DayAvg;
    let hrvPoints: number;
    if (ratio >= 1.15) hrvPoints = 30;
    else if (ratio >= 0.85) hrvPoints = 20;
    else hrvPoints = 5;
    score += hrvPoints * 0.4;
    weightUsed += 0.4;
  }

  // RHR vs 7-day baseline — weight 20%
  if (input.rhr7DayAvg !== undefined && input.rhrCurrent !== undefined) {
    const rhrRatio = input.rhrCurrent / input.rhr7DayAvg;
    let rhrPoints: number;
    if (rhrRatio <= 0.95) rhrPoints = 30;
    else if (rhrRatio <= 1.05) rhrPoints = 20;
    else rhrPoints = 5;
    score += rhrPoints * 0.2;
    weightUsed += 0.2;
  }

  // Sleep quality 0–100 — weight 25%
  if (input.sleepQualityScore !== undefined) {
    score += (input.sleepQualityScore / 100) * 30 * 0.25;
    weightUsed += 0.25;
  }

  // Subjective stress 1–5 — weight 15% (inverted)
  if (input.subjectiveStress !== undefined) {
    const inverted = (6 - input.subjectiveStress) / 5;
    score += inverted * 30 * 0.15;
    weightUsed += 0.15;
  }

  // Normalise for missing signals
  if (weightUsed > 0 && weightUsed < 1) {
    score = (score / weightUsed) * 1;
  }

  // Scale to 0–100
  score = Math.min(100, Math.round((score / 30) * 100));

  // Cap at 75 for non-wearable users
  if (!input.hasWearable) {
    score = Math.min(75, score);
  }

  const tier = getTier(score);
  return {
    score,
    tier,
    explanation: EXPLANATIONS[tier],
    sessionGate: getSessionGate(tier),
  };
}
