import type { AssessmentInput, PillarWeights } from '../types';

interface WeightContribution {
  biomechanics: number;
  biochemistry: number;
  neurophysiology: number;
}

function add(weights: WeightContribution, contribution: WeightContribution): void {
  weights.biomechanics += contribution.biomechanics;
  weights.biochemistry += contribution.biochemistry;
  weights.neurophysiology += contribution.neurophysiology;
}

export function calculatePillarWeights(input: AssessmentInput): PillarWeights {
  const raw: WeightContribution = { biomechanics: 0, biochemistry: 0, neurophysiology: 0 };

  // BOLT score signals biochemistry priority
  if (input.boltScore !== undefined) {
    if (input.boltScore < 10) add(raw, { biomechanics: 5, biochemistry: 20, neurophysiology: 5 });
    else if (input.boltScore < 20) add(raw, { biomechanics: 3, biochemistry: 15, neurophysiology: 3 });
    else if (input.boltScore < 30) add(raw, { biomechanics: 2, biochemistry: 8, neurophysiology: 2 });
    else add(raw, { biomechanics: 1, biochemistry: 4, neurophysiology: 3 });
  }

  // Resting RR signals biomechanics & biochemistry
  if (input.restingRR !== undefined) {
    if (input.restingRR > 18) add(raw, { biomechanics: 15, biochemistry: 10, neurophysiology: 2 });
    else if (input.restingRR > 14) add(raw, { biomechanics: 10, biochemistry: 8, neurophysiology: 2 });
    else if (input.restingRR > 10) add(raw, { biomechanics: 5, biochemistry: 3, neurophysiology: 2 });
    else add(raw, { biomechanics: 2, biochemistry: 2, neurophysiology: 5 });
  }

  // Breathing pattern signals biomechanics
  if (input.breathingPattern === 'chest_dominant') {
    add(raw, { biomechanics: 20, biochemistry: 5, neurophysiology: 2 });
  } else if (input.breathingPattern === 'mixed') {
    add(raw, { biomechanics: 10, biochemistry: 3, neurophysiology: 2 });
  } else if (input.breathingPattern === 'diaphragmatic') {
    add(raw, { biomechanics: 3, biochemistry: 5, neurophysiology: 5 });
  }

  // HRV signals neurophysiology
  if (input.hrv !== undefined) {
    if (input.hrv < 30) add(raw, { biomechanics: 2, biochemistry: 2, neurophysiology: 20 });
    else if (input.hrv < 50) add(raw, { biomechanics: 2, biochemistry: 2, neurophysiology: 12 });
    else if (input.hrv < 70) add(raw, { biomechanics: 2, biochemistry: 3, neurophysiology: 8 });
    else add(raw, { biomechanics: 2, biochemistry: 4, neurophysiology: 5 });
  }

  // Symptom signals
  if (input.hasStressIssues) add(raw, { biomechanics: 2, biochemistry: 3, neurophysiology: 15 });
  if (input.hasSleepIssues) add(raw, { biomechanics: 2, biochemistry: 5, neurophysiology: 12 });
  if (input.hasFocusIssues) add(raw, { biomechanics: 2, biochemistry: 5, neurophysiology: 10 });
  if (input.hasAnxiety) add(raw, { biomechanics: 3, biochemistry: 3, neurophysiology: 15 });
  if (input.hasFatigue) add(raw, { biomechanics: 3, biochemistry: 10, neurophysiology: 8 });

  // Goal signals
  switch (input.primaryGoal) {
    case 'stress_reduction':
      add(raw, { biomechanics: 2, biochemistry: 3, neurophysiology: 18 }); break;
    case 'sleep_improvement':
      add(raw, { biomechanics: 2, biochemistry: 4, neurophysiology: 15 }); break;
    case 'athletic_performance':
      add(raw, { biomechanics: 8, biochemistry: 15, neurophysiology: 5 }); break;
    case 'focus_clarity':
      add(raw, { biomechanics: 3, biochemistry: 5, neurophysiology: 12 }); break;
    case 'breathwork_mastery':
      add(raw, { biomechanics: 12, biochemistry: 12, neurophysiology: 8 }); break;
    case 'general_wellness':
      add(raw, { biomechanics: 8, biochemistry: 8, neurophysiology: 8 }); break;
    case 'anxiety_management':
      add(raw, { biomechanics: 3, biochemistry: 3, neurophysiology: 18 }); break;
    case 'cardiovascular_health':
      add(raw, { biomechanics: 5, biochemistry: 10, neurophysiology: 12 }); break;
  }

  // Activity level
  if (input.activityLevel === 'athlete' || input.activityLevel === 'very_active') {
    add(raw, { biomechanics: 5, biochemistry: 10, neurophysiology: 3 });
  } else if (input.activityLevel === 'sedentary') {
    add(raw, { biomechanics: 10, biochemistry: 8, neurophysiology: 5 });
  }

  // Contraindications shift neurophysiology up, biochemistry hold-heavy content down
  if (input.hasHypertension || input.hasHeartCondition) {
    add(raw, { biomechanics: 5, biochemistry: -10, neurophysiology: 15 });
  }

  const total = Math.max(raw.biomechanics + raw.biochemistry + raw.neurophysiology, 1);

  const weights: PillarWeights = {
    biomechanics: Math.round((raw.biomechanics / total) * 100),
    biochemistry: Math.round((raw.biochemistry / total) * 100),
    neurophysiology: Math.round((raw.neurophysiology / total) * 100),
  };

  // Ensure sum is exactly 100
  const sum = weights.biomechanics + weights.biochemistry + weights.neurophysiology;
  if (sum !== 100) {
    weights.neurophysiology += 100 - sum;
  }

  // Ensure minimum 15% per pillar
  const MIN = 15;
  for (const key of ['biomechanics', 'biochemistry', 'neurophysiology'] as const) {
    if (weights[key] < MIN) {
      const deficit = MIN - weights[key];
      weights[key] = MIN;
      const others = (['biomechanics', 'biochemistry', 'neurophysiology'] as const).filter(k => k !== key);
      const largePillar = others.reduce((a, b) => weights[a] > weights[b] ? a : b);
      weights[largePillar] -= deficit;
    }
  }

  return weights;
}

export function determineContraindications(input: AssessmentInput): string[] {
  const flags: string[] = [];
  if (input.isPregnant) flags.push('no_breath_retention', 'no_hyperventilation');
  if (input.hasHeartCondition) flags.push('no_breath_retention', 'no_hyperventilation', 'tier_1_max');
  if (input.hasEpilepsy) flags.push('no_breath_retention', 'no_hyperventilation', 'no_straining');
  if (input.hasCOPD) flags.push('no_breath_retention', 'no_hyperventilation', 'tier_1_max');
  if (input.hasHypertension) flags.push('hold_duration_cap', 'no_tier_3_biochemistry');
  return [...new Set(flags)];
}

export function determineTier(bolt: number | undefined, hrv: number | undefined): number {
  if (!bolt && !hrv) return 1;
  let tierScore = 0;
  if (bolt !== undefined) {
    if (bolt >= 35) tierScore += 3;
    else if (bolt >= 25) tierScore += 2;
    else if (bolt >= 15) tierScore += 1;
  }
  if (hrv !== undefined) {
    if (hrv >= 70) tierScore += 2;
    else if (hrv >= 50) tierScore += 1;
  }
  if (tierScore >= 4) return 3;
  if (tierScore >= 2) return 2;
  return 1;
}
