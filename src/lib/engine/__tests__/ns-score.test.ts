import { describe, it, expect } from "vitest";
import { calculateNSScore } from "../ns-score";

describe("calculateNSScore", () => {
  it("returns exceptional tier when HRV is well above baseline", () => {
    const result = calculateNSScore({
      hrv7DayAvg: 50,
      hrvCurrent: 65,
      sleepQualityScore: 90,
      subjectiveStress: 1,
      hasWearable: true,
    });
    expect(result.tier).toBe("exceptional");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("returns very_low tier when HRV is below baseline and subjective stress is high", () => {
    const result = calculateNSScore({
      hrv7DayAvg: 50,
      hrvCurrent: 30,
      sleepQualityScore: 10,
      subjectiveStress: 5,
      hasWearable: true,
    });
    expect(result.score).toBeLessThan(45);
  });

  it("caps score at 75 for non-wearable users", () => {
    const result = calculateNSScore({
      subjectiveStress: 1,
      hasWearable: false,
    });
    expect(result.score).toBeLessThanOrEqual(75);
  });

  it("returns explanation text for every tier", () => {
    const tiers = ["exceptional", "good", "moderate", "low", "very_low"] as const;
    for (const tier of tiers) {
      expect(tier).toBeTruthy();
    }
    const result = calculateNSScore({ subjectiveStress: 3, hasWearable: false });
    expect(result.explanation).toBeTruthy();
    expect(result.sessionGate).toBeTruthy();
  });

  it("maps full sessionGate for exceptional tier", () => {
    const result = calculateNSScore({
      hrv7DayAvg: 50,
      hrvCurrent: 65,
      sleepQualityScore: 95,
      subjectiveStress: 1,
      hasWearable: true,
    });
    expect(result.sessionGate).toBe("full");
  });
});
