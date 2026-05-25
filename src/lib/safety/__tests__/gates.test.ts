import { describe, it, expect } from "vitest";
import { evaluateSafetyGates, SAFETY_GATES } from "../gates";
import type { SafetyProfile } from "../gates";

const safeProfile: SafetyProfile = {
  hasCardiovascularCondition: false,
  hasEpilepsy: false,
  hasRespiratoryCondition: false,
  isPregnant: false,
  hasPanicDisorder: false,
  bpAbove140: false,
  paradoxicalResponseFlagged: false,
};

describe("evaluateSafetyGates", () => {
  it("returns full access for a safe profile", () => {
    const result = evaluateSafetyGates(safeProfile);
    expect(result.allowRetention).toBe(true);
    expect(result.allowIHT).toBe(true);
    expect(result.allowTier3).toBe(true);
    expect(result.maxHoldSeconds).toBe(SAFETY_GATES.MAX_HOLD_TIER3_SECONDS);
  });

  it("caps holds at Tier 1 for high blood pressure", () => {
    const result = evaluateSafetyGates({ ...safeProfile, bpAbove140: true });
    expect(result.maxHoldSeconds).toBe(SAFETY_GATES.MAX_HOLD_TIER1_SECONDS);
    expect(result.allowTier3).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("disables all retention for epilepsy", () => {
    const result = evaluateSafetyGates({ ...safeProfile, hasEpilepsy: true });
    expect(result.allowRetention).toBe(false);
    expect(result.allowIHT).toBe(false);
    expect(result.maxHoldSeconds).toBe(0);
  });

  it("disables holds and IHT for pregnancy", () => {
    const result = evaluateSafetyGates({ ...safeProfile, isPregnant: true });
    expect(result.maxHoldSeconds).toBe(0);
    expect(result.allowHyperventilation).toBe(false);
    expect(result.sessionGate).toBe("restorative");
  });

  it("disables IHT for respiratory condition", () => {
    const result = evaluateSafetyGates({ ...safeProfile, hasRespiratoryCondition: true });
    expect(result.allowIHT).toBe(false);
  });
});
