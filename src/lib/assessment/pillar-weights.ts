export type PrimaryGoal =
  | "stress_calm"
  | "anxiety_relief"
  | "athletic_performance"
  | "sleep_improvement"
  | "general_wellbeing";

export type ExperienceLevel = "beginner" | "some" | "regular" | "advanced";

export interface AssessmentInput {
  boltScore: number;
  restingBreathRate: number;
  restingHR: number;
  breathingPattern: "chest" | "diaphragmatic" | "mixed";
  neckShoulderTension: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  anxietyFrequency: 1 | 2 | 3 | 4 | 5;
  primaryGoal: PrimaryGoal;
  experience: ExperienceLevel;
  dailyMinutes: 5 | 10 | 15 | 30;
  hasWearable: boolean;
}

export interface PillarWeights {
  biomechanics: number;
  biochemistry: number;
  neurophysiology: number;
}

const FLOOR = 15;

function enforceFloor(weights: PillarWeights): PillarWeights {
  const pillars: (keyof PillarWeights)[] = [
    "biomechanics",
    "biochemistry",
    "neurophysiology",
  ];

  // First pass: clamp any below-floor pillars up to FLOOR
  let deficitTotal = 0;
  const clamped = { ...weights };
  for (const p of pillars) {
    if (clamped[p] < FLOOR) {
      deficitTotal += FLOOR - clamped[p];
      clamped[p] = FLOOR;
    }
  }

  if (deficitTotal === 0) return clamped;

  // Redistribute deficit from the pillars that are above floor
  const aboveFloor = pillars.filter((p) => clamped[p] > FLOOR);
  const totalAbove = aboveFloor.reduce((s, p) => s + (clamped[p] - FLOOR), 0);

  for (const p of aboveFloor) {
    const share = (clamped[p] - FLOOR) / totalAbove;
    clamped[p] -= deficitTotal * share;
  }

  return clamped;
}

function normalise(raw: PillarWeights): PillarWeights {
  const total = raw.biomechanics + raw.biochemistry + raw.neurophysiology;
  if (total === 0) return { biomechanics: 33.3, biochemistry: 33.3, neurophysiology: 33.4 };
  return {
    biomechanics: (raw.biomechanics / total) * 100,
    biochemistry: (raw.biochemistry / total) * 100,
    neurophysiology: (raw.neurophysiology / total) * 100,
  };
}

export function calculatePillarWeights(input: AssessmentInput): PillarWeights {
  const raw: PillarWeights = {
    biomechanics: 33,
    biochemistry: 33,
    neurophysiology: 34,
  };

  // BOLT score
  if (input.boltScore < 15) raw.biochemistry += 20;
  else if (input.boltScore <= 25) raw.biochemistry += 10;

  // Breathing pattern
  if (input.breathingPattern === "chest") raw.biomechanics += 25;
  else if (input.breathingPattern === "mixed") raw.biomechanics += 12;

  // Resting breath rate
  if (input.restingBreathRate > 16) {
    raw.biochemistry += 15;
    raw.neurophysiology += 10;
  }

  // Neck/shoulder tension
  if (input.neckShoulderTension >= 4) raw.biomechanics += 15;

  // Sleep quality
  if (input.sleepQuality <= 2) raw.neurophysiology += 20;

  // Stress level
  if (input.stressLevel >= 4) raw.neurophysiology += 15;

  // Anxiety frequency
  if (input.anxietyFrequency >= 4) {
    raw.neurophysiology += 20;
    raw.biochemistry += 10;
  }

  // Primary goal
  switch (input.primaryGoal) {
    case "athletic_performance":
      raw.biochemistry += 25;
      raw.biomechanics += 10;
      break;
    case "sleep_improvement":
      raw.neurophysiology += 25;
      raw.biochemistry += 10;
      break;
    case "anxiety_relief":
      raw.neurophysiology += 20;
      raw.biochemistry += 10;
      break;
    case "stress_calm":
      raw.neurophysiology += 15;
      raw.biomechanics += 10;
      break;
  }

  // Experience level
  if (input.experience === "beginner") raw.biomechanics += 10;

  const normalised = normalise(raw);
  return enforceFloor(normalised);
}
