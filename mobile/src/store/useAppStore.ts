import { create } from 'zustand';
import type { User, TodayData, DashboardData, GamificationProfile } from '../types';
import { setAuthToken } from '../api/client';

interface AssessmentState {
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
  activityLevel?: string;
  hasHypertension?: boolean;
  hasHeartCondition?: boolean;
  hasEpilepsy?: boolean;
  isPregnant?: boolean;
  hasCOPD?: boolean;
  connectedWearable?: string;
}

interface AppState {
  user: User | null;
  hasCompletedOnboarding: boolean;
  assessment: AssessmentState;
  today: TodayData | null;
  dashboard: DashboardData | null;
  gamification: GamificationProfile | null;
  activeSessionId: string | null;

  setUser: (user: User | null) => void;
  setHasCompletedOnboarding: (v: boolean) => void;
  updateAssessment: (patch: Partial<AssessmentState>) => void;
  resetAssessment: () => void;
  setToday: (data: TodayData) => void;
  setDashboard: (data: DashboardData) => void;
  setGamification: (data: GamificationProfile) => void;
  setActiveSessionId: (id: string | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  hasCompletedOnboarding: false,
  assessment: {},
  today: null,
  dashboard: null,
  gamification: null,
  activeSessionId: null,

  setUser: (user) => {
    setAuthToken(user?.token ?? null);
    set({ user });
  },

  setHasCompletedOnboarding: (v) => set({ hasCompletedOnboarding: v }),

  updateAssessment: (patch) =>
    set((state) => ({ assessment: { ...state.assessment, ...patch } })),

  resetAssessment: () => set({ assessment: {} }),

  setToday: (data) => set({ today: data }),
  setDashboard: (data) => set({ dashboard: data }),
  setGamification: (data) => set({ gamification: data }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),

  logout: () => {
    setAuthToken(null);
    set({ user: null, hasCompletedOnboarding: false, assessment: {}, today: null });
  },
}));
