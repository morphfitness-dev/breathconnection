export const COLORS = {
  // Background
  bg: '#0A0E1A',
  bgCard: '#141828',
  bgElevated: '#1C2236',

  // Primary
  primary: '#4F9DFF',
  primaryDark: '#2E7FE8',

  // Pillars
  biomechanics: '#4FC3F7',    // blue
  biochemistry: '#CE93D8',    // purple
  neurophysiology: '#FFD54F', // amber

  // NS Score bands
  nsExceptional: '#4CAF50',
  nsGood: '#8BC34A',
  nsModerate: '#FF9800',
  nsLow: '#F44336',
  nsVeryLow: '#9C27B0',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9AA5C4',
  textMuted: '#4A5568',

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Border
  border: '#1E2A45',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const PILLAR_CONFIG = {
  biomechanics: {
    color: COLORS.biomechanics,
    label: 'Biomechanics',
    subtitle: 'How You Breathe',
    emoji: '🫁',
  },
  biochemistry: {
    color: COLORS.biochemistry,
    label: 'Biochemistry',
    subtitle: 'What Your Breath Does',
    emoji: '🧬',
  },
  neurophysiology: {
    color: COLORS.neurophysiology,
    label: 'Neurophysiology',
    subtitle: 'Your Nervous System',
    emoji: '⚡',
  },
};

export function getNSScoreColor(score: number): string {
  if (score >= 85) return COLORS.nsExceptional;
  if (score >= 65) return COLORS.nsGood;
  if (score >= 45) return COLORS.nsModerate;
  if (score >= 25) return COLORS.nsLow;
  return COLORS.nsVeryLow;
}
