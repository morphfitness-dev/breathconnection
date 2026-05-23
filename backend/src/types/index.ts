export type Pillar = 'biomechanics' | 'biochemistry' | 'neurophysiology';
export type Stage = 'explorer' | 'practitioner' | 'optimizer' | 'coach';
export type InstructorStyle = 'warm' | 'clinical' | 'energising' | 'calm';
export type WearableType = 'oura' | 'whoop' | 'apple_health' | 'google_health' | 'muse' | 'flowtime' | 'tymewear' | 'spire' | 'hilo';
export type BiometricFeedbackType = 'hrv' | 'eeg' | 'breathing_rate' | 'spO2' | 'blood_pressure' | 'none';
export type GamificationEvent = 'bolt_pr_test' | 'hold_pr' | 'coherence_session' | 'pillar_complete' | 'milestone_none';
export type MetricType = 'hrv' | 'rhr' | 'rr' | 'spo2' | 'blood_pressure' | 'ns_score' | 'eeg_alpha' | 'daytime_rr' | 'bolt';
export type MetricSource = 'manual' | 'oura' | 'whoop' | 'apple_health' | 'tymewear' | 'spire';

export interface PillarWeights {
  biomechanics: number;
  biochemistry: number;
  neurophysiology: number;
}

export interface AssessmentInput {
  boltScore?: number;
  restingRR?: number;
  restingHR?: number;
  hrv?: number;
  breathingPattern?: 'chest_dominant' | 'diaphragmatic' | 'mixed';
  hasStressIssues?: boolean;
  hasSleepIssues?: boolean;
  hasFocusIssues?: boolean;
  hasAnxiety?: boolean;
  hasFatigue?: boolean;
  primaryGoal?: string;
  secondaryGoals?: string[];
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete';
  hasHypertension?: boolean;
  hasHeartCondition?: boolean;
  hasEpilepsy?: boolean;
  isPregnant?: boolean;
  hasCOPD?: boolean;
}

export interface DailyReadinessInputs {
  hrv?: number;
  hrv7DayAverage?: number;
  rhr?: number;
  sleepScore?: number;
  subjectiveStress?: number;  // 1-5
}

export interface NSScoreResult {
  score: number;
  interpretation: string;
  intensityGate: 'full' | 'capped' | 'restorative' | 'gentle';
  message: string;
}

export interface AdaptedSession {
  videoId: string;
  durationMinutes: number;
  pillar: Pillar;
  tier: number;
  nsScore: number;
  intensityGate: NSScoreResult['intensityGate'];
  adaptationReason?: string;
}

export interface NormalisedMetric {
  type: MetricType;
  value: number;
  systolic?: number;
  diastolic?: number;
  source: MetricSource;
  context?: string;
  recordedAt: Date;
}

export interface VideoLibraryItem {
  id: string;
  title: string;
  description: string;
  pillar: Pillar;
  tier: number;
  durationSeconds: number;
  technique: string;
  instructorStyle: InstructorStyle;
  biometricFeedbackType: BiometricFeedbackType;
  nsScoreMin?: number;
  gamificationEvent: GamificationEvent;
  fourWeekAnchor: boolean;
  thumbnailUrl?: string;
  videoUrl?: string;
  tags: string[];
  contraindicated: string[];
}

export interface GamificationTrigger {
  type: string;
  userId: string;
  data: Record<string, unknown>;
}

export interface BiometricSignalInput {
  hrv?: number;
  sessionStartHrv?: number;
  eegBetaAlphaRatio?: number;
  breathingRate?: number;
  spo2?: number;
  userDiscomfort?: boolean;
}

export interface InSessionAdaptation {
  action: 'slow_pacer' | 'suggest_posture' | 'offer_switch' | 'slow_further' | 'end_hold' | 'pause_safety' | 'none';
  message?: string;
  pacerAdjustment?: number;  // multiplier e.g. 0.9 for 10% slower
}
