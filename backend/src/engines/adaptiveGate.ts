import type { NSScoreResult, AdaptedSession, PillarWeights, VideoLibraryItem, BiometricSignalInput, InSessionAdaptation } from '../types';
import { VIDEO_LIBRARY } from '../data/videoLibrary';

export function selectDailySession(
  nsScore: NSScoreResult,
  pillarWeights: PillarWeights,
  tier: number,
  contraindications: string[],
  recentPillars: string[],
): AdaptedSession {
  const gate = nsScore.intensityGate;

  // Determine effective tier based on gate
  let effectiveTier = tier;
  if (gate === 'restorative' || gate === 'gentle') effectiveTier = 1;
  else if (gate === 'capped') effectiveTier = Math.min(tier, 2);

  // For restorative/gentle, shift to neurophysiology
  let effectiveWeights = { ...pillarWeights };
  if (gate === 'restorative') {
    effectiveWeights = { biomechanics: 10, biochemistry: 20, neurophysiology: 70 };
  } else if (gate === 'gentle') {
    effectiveWeights = { biomechanics: 5, biochemistry: 5, neurophysiology: 90 };
  } else if (gate === 'capped') {
    effectiveWeights = {
      biomechanics: pillarWeights.biomechanics,
      biochemistry: Math.max(pillarWeights.biochemistry - 10, 15),
      neurophysiology: pillarWeights.neurophysiology + 10,
    };
  }

  const pillar = selectPillarByWeight(effectiveWeights, recentPillars);
  const candidates = VIDEO_LIBRARY.filter(v =>
    v.pillar === pillar &&
    v.tier <= effectiveTier &&
    (!v.nsScoreMin || nsScore.score >= v.nsScoreMin) &&
    !hasContraindication(v, contraindications)
  );

  const video = candidates[Math.floor(Math.random() * candidates.length)] ?? VIDEO_LIBRARY[0];

  const durationMap: Record<NSScoreResult['intensityGate'], number> = {
    full: 15,
    capped: 10,
    restorative: 10,
    gentle: 5,
  };

  return {
    videoId: video.id,
    durationMinutes: durationMap[gate],
    pillar,
    tier: effectiveTier,
    nsScore: nsScore.score,
    intensityGate: gate,
    adaptationReason: gate !== 'full' ? nsScore.message : undefined,
  };
}

function selectPillarByWeight(weights: PillarWeights, recentPillars: string[]): 'biomechanics' | 'biochemistry' | 'neurophysiology' {
  // Apply recency penalty — avoid repeating the same pillar
  const adjusted = { ...weights };
  for (const recent of recentPillars.slice(-2)) {
    if (recent === 'biomechanics') adjusted.biomechanics *= 0.7;
    if (recent === 'biochemistry') adjusted.biochemistry *= 0.7;
    if (recent === 'neurophysiology') adjusted.neurophysiology *= 0.7;
  }

  const total = adjusted.biomechanics + adjusted.biochemistry + adjusted.neurophysiology;
  const rand = Math.random() * total;

  if (rand < adjusted.biomechanics) return 'biomechanics';
  if (rand < adjusted.biomechanics + adjusted.biochemistry) return 'biochemistry';
  return 'neurophysiology';
}

function hasContraindication(video: VideoLibraryItem, contraindications: string[]): boolean {
  return video.contraindicated.some(c => contraindications.includes(c));
}

export function evaluateInSessionSignals(signal: BiometricSignalInput): InSessionAdaptation {
  // SpO2 safety gate — highest priority
  if (signal.spo2 !== undefined && signal.spo2 < 92) {
    return {
      action: 'pause_safety',
      message: 'Session paused. Your SpO₂ has dropped below safe levels. Please rest and breathe normally. If this persists, consult a healthcare provider.',
    };
  }

  // User-reported discomfort
  if (signal.userDiscomfort) {
    return {
      action: 'end_hold',
      message: 'Hold ended. Take a gentle breath. We\'ll reduce the hold duration for the rest of this session.',
    };
  }

  // HRV drop >20% from session start
  if (signal.hrv !== undefined && signal.sessionStartHrv !== undefined && signal.sessionStartHrv > 0) {
    const drop = (signal.sessionStartHrv - signal.hrv) / signal.sessionStartHrv;
    if (drop > 0.20) {
      return {
        action: 'slow_pacer',
        pacerAdjustment: 0.9,
        message: 'Let\'s take this a little slower.',
      };
    }
  }

  // EEG beta dominance
  if (signal.eegBetaAlphaRatio !== undefined && signal.eegBetaAlphaRatio > 2.0) {
    return {
      action: 'suggest_posture',
      message: 'Check your posture — relax your shoulders and soften your jaw.',
    };
  }

  // Breathing rate not decreasing
  if (signal.breathingRate !== undefined && signal.breathingRate > 16) {
    return {
      action: 'slow_further',
      pacerAdjustment: 0.85,
      message: 'Gently invite more diaphragm engagement as you breathe.',
    };
  }

  return { action: 'none' };
}

export function applyPostSessionSignals(
  preHrv: number | undefined,
  postHrv: number | undefined,
  eegAlphaRatio: number | undefined,
  userId: string,
): Record<string, unknown> {
  const events: Record<string, unknown> = {};

  if (preHrv !== undefined && postHrv !== undefined) {
    const delta = postHrv - preHrv;
    events.hrv_delta = delta;
    events.coherence_achieved = delta > 0;
  }

  if (eegAlphaRatio !== undefined) {
    events.eeg_alpha_shift = eegAlphaRatio > 1.2;
  }

  return events;
}
