export type Pillar = 'biomechanics' | 'biochemistry' | 'neurophysiology';
export type Stage = 'explorer' | 'practitioner' | 'optimizer' | 'coach';
export type WearableType = 'oura' | 'whoop' | 'apple_health' | 'google_health' | 'muse' | 'flowtime' | 'tymewear' | 'spire' | 'hilo';

export interface User {
  id: string;
  email: string;
  name?: string;
  token: string;
}

export interface PillarWeights {
  biomechanics: number;
  biochemistry: number;
  neurophysiology: number;
}

export interface NSScoreResult {
  score: number;
  interpretation: string;
  intensityGate: 'full' | 'capped' | 'restorative' | 'gentle';
  message: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  pillar: Pillar;
  tier: number;
  durationSeconds: number;
  technique: string;
  instructorStyle: string;
  biometricFeedbackType: string;
  nsScoreMin?: number;
  gamificationEvent: string;
  fourWeekAnchor: boolean;
  tags: string[];
}

export interface AdaptedSession {
  videoId: string;
  durationMinutes: number;
  pillar: Pillar;
  tier: number;
  nsScore: number;
  intensityGate: string;
  adaptationReason?: string;
}

export interface TodayData {
  nsScore: NSScoreResult;
  session: AdaptedSession;
  video: Video | null;
}

export interface DashboardData {
  nsScore: NSScoreResult | null;
  bolt: { current: number | null; history: Array<{ score: number; testedAt: string }> };
  hrv: { latest: number | null; trend: 'up' | 'stable' | 'down'; history: Array<{ value: number; date: string }> };
  rhr: number | null;
  restingRR: number | null;
  spO2: number | null;
  bloodPressure: { systolic: number; diastolic: number; label: string } | null;
  streaks: Array<{ type: string; count: number }>;
  holdRecords: Array<{ durationSeconds: number; isPersonalRecord: boolean }>;
  pillarRings: { biomechanics: number; biochemistry: number; neurophysiology: number };
}

export interface GamificationProfile {
  stage: Stage;
  tier: number;
  totalSessions: number;
  totalMilestones: number;
  coherenceStreak: number;
  nsAvg30d: number;
  pillarRings: { biomechanics: number; biochemistry: number; neurophysiology: number };
  pillarWeights: PillarWeights | null;
}

export interface Milestone {
  type: string;
  label: string;
  description: string;
  celebrationLevel: string;
  shareCard: boolean;
  achieved: boolean;
  achievedAt: string | null;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  BOLTTest: undefined;
  RRTest: undefined;
  BreathingPattern: undefined;
  WearableConnection: undefined;
  Symptoms: undefined;
  Goals: undefined;
  Lifestyle: undefined;
  ProgrammeGeneration: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  Library: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  SessionPlayer: { videoId: string; sessionId?: string };
  SessionComplete: { gamificationEvents: Array<{ type: string; data: Record<string, unknown> }>; coherenceAchieved: boolean };
};
