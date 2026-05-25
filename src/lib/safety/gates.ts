// HUMAN DECISION REQUIRED: Clinical thresholds below were specified in Architecture v2.0.
// Have these reviewed by a qualified respiratory physiologist before production launch.

export const SAFETY_GATES = {
  BP_HIGH_THRESHOLD_SYSTOLIC: 140,
  BP_HIGH_THRESHOLD_DIASTOLIC: 90,
  SPO2_ABORT_THRESHOLD: 92,
  SPO2_CAP_THRESHOLD: 94,
  HRV_SESSION_ABORT_DROP: 0.2,
  MAX_HOLD_TIER1_SECONDS: 15,
  MAX_HOLD_TIER2_SECONDS: 30,
  MAX_HOLD_TIER3_SECONDS: 60,
} as const;

export interface SafetyProfile {
  hasCardiovascularCondition: boolean;
  hasEpilepsy: boolean;
  hasRespiratoryCondition: boolean;
  isPregnant: boolean;
  hasPanicDisorder: boolean;
  bpAbove140: boolean;
  paradoxicalResponseFlagged: boolean;
}

export type SessionGate =
  | "full"
  | "standard"
  | "capped"
  | "restorative"
  | "gentle_five";

export interface SafetyGateResult {
  maxHoldSeconds: 0 | 15 | 30 | 60;
  allowTier3: boolean;
  allowRetention: boolean;
  allowIHT: boolean;
  allowHyperventilation: boolean;
  sessionGate: SessionGate;
  warnings: string[];
}

export function evaluateSafetyGates(profile: SafetyProfile): SafetyGateResult {
  const warnings: string[] = [];
  let maxHoldSeconds: 0 | 15 | 30 | 60 = SAFETY_GATES.MAX_HOLD_TIER3_SECONDS;
  let allowTier3 = true;
  let allowRetention = true;
  let allowIHT = true;
  let allowHyperventilation = true;
  let sessionGate: SessionGate = "full";

  if (profile.bpAbove140) {
    maxHoldSeconds = SAFETY_GATES.MAX_HOLD_TIER1_SECONDS;
    allowTier3 = false;
    sessionGate = "capped";
    warnings.push(
      "If you have hypertension, share your data with your healthcare provider"
    );
  }

  if (profile.hasEpilepsy || profile.hasCardiovascularCondition) {
    allowRetention = false;
    allowIHT = false;
    maxHoldSeconds = 0;
    sessionGate = "restorative";
  }

  if (profile.hasRespiratoryCondition) {
    allowIHT = false;
    sessionGate = sessionGate === "full" ? "standard" : sessionGate;
  }

  if (profile.isPregnant) {
    maxHoldSeconds = 0;
    allowRetention = false;
    allowIHT = false;
    allowHyperventilation = false;
    sessionGate = "restorative";
  }

  if (profile.paradoxicalResponseFlagged) {
    sessionGate = sessionGate === "full" ? "capped" : sessionGate;
  }

  return {
    maxHoldSeconds,
    allowTier3,
    allowRetention,
    allowIHT,
    allowHyperventilation,
    sessionGate,
    warnings,
  };
}
