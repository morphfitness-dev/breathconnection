import type { DailyReadinessInputs, NSScoreResult } from '../types';

export function calculateNSScore(inputs: DailyReadinessInputs): NSScoreResult {
  let score = 50; // baseline

  // HRV component (0-40 points)
  if (inputs.hrv !== undefined && inputs.hrv7DayAverage !== undefined && inputs.hrv7DayAverage > 0) {
    const hrvDeviation = (inputs.hrv - inputs.hrv7DayAverage) / inputs.hrv7DayAverage;
    const hrvPoints = Math.min(40, Math.max(-30, hrvDeviation * 100));
    score += hrvPoints;
  }

  // RHR component (0-20 points) — lower is better
  if (inputs.rhr !== undefined) {
    if (inputs.rhr < 50) score += 20;
    else if (inputs.rhr < 60) score += 12;
    else if (inputs.rhr < 70) score += 5;
    else if (inputs.rhr < 80) score -= 5;
    else if (inputs.rhr >= 80) score -= 15;
  }

  // Sleep score component (0-25 points)
  if (inputs.sleepScore !== undefined) {
    score += (inputs.sleepScore / 100) * 25 - 10;
  }

  // Subjective stress (0-15 points) — lower stress = higher NS score
  if (inputs.subjectiveStress !== undefined) {
    const stressPoints = ((5 - inputs.subjectiveStress) / 4) * 15;
    score += stressPoints;
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  return interpretNSScore(score);
}

export function interpretNSScore(score: number): NSScoreResult {
  if (score >= 85) {
    return {
      score,
      interpretation: 'Exceptional readiness',
      intensityGate: 'full',
      message: 'Your nervous system is primed — full session available with advanced techniques.',
    };
  }
  if (score >= 65) {
    return {
      score,
      interpretation: 'Good readiness',
      intensityGate: 'full',
      message: 'Solid baseline today. Standard session recommended.',
    };
  }
  if (score >= 45) {
    return {
      score,
      interpretation: 'Moderate readiness',
      intensityGate: 'capped',
      message: 'Your HRV is slightly below baseline today — we\'ve made this session gentler.',
    };
  }
  if (score >= 25) {
    return {
      score,
      interpretation: 'Low readiness',
      intensityGate: 'restorative',
      message: 'Your nervous system is in recovery mode. Restorative session only today.',
    };
  }
  return {
    score,
    interpretation: 'Very low readiness',
    intensityGate: 'gentle',
    message: 'Your nervous system needs rest today — here\'s a restorative 5 minutes.',
  };
}
