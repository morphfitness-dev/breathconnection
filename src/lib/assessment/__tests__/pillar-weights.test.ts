import { describe, it, expect } from "vitest";
import { calculatePillarWeights } from "../pillar-weights";
import type { AssessmentInput } from "../pillar-weights";

const base: AssessmentInput = {
  boltScore: 20,
  restingBreathRate: 14,
  restingHR: 65,
  breathingPattern: "mixed",
  neckShoulderTension: 2,
  sleepQuality: 3,
  stressLevel: 2,
  anxietyFrequency: 2,
  primaryGoal: "general_wellbeing",
  experience: "some",
  dailyMinutes: 10,
  hasWearable: false,
};

describe("calculatePillarWeights", () => {
  it("always sums to 100", () => {
    const weights = calculatePillarWeights(base);
    const sum = weights.biomechanics + weights.biochemistry + weights.neurophysiology;
    expect(sum).toBeCloseTo(100, 0);
  });

  it("enforces 15% floor on all pillars", () => {
    const weights = calculatePillarWeights(base);
    expect(weights.biomechanics).toBeGreaterThanOrEqual(15);
    expect(weights.biochemistry).toBeGreaterThanOrEqual(15);
    expect(weights.neurophysiology).toBeGreaterThanOrEqual(15);
  });

  it("boosts biochemistry for low BOLT score", () => {
    const low = calculatePillarWeights({ ...base, boltScore: 10 });
    const high = calculatePillarWeights({ ...base, boltScore: 35 });
    expect(low.biochemistry).toBeGreaterThan(high.biochemistry);
  });

  it("boosts biomechanics for chest breathing", () => {
    const chest = calculatePillarWeights({ ...base, breathingPattern: "chest" });
    const diaphragmatic = calculatePillarWeights({ ...base, breathingPattern: "diaphragmatic" });
    expect(chest.biomechanics).toBeGreaterThan(diaphragmatic.biomechanics);
  });

  it("boosts neurophysiology for sleep_improvement goal", () => {
    const sleep = calculatePillarWeights({ ...base, primaryGoal: "sleep_improvement" });
    const athletic = calculatePillarWeights({ ...base, primaryGoal: "athletic_performance" });
    expect(sleep.neurophysiology).toBeGreaterThan(athletic.neurophysiology);
  });

  it("boosts biochemistry for athletic_performance goal", () => {
    const athletic = calculatePillarWeights({ ...base, primaryGoal: "athletic_performance" });
    const stress = calculatePillarWeights({ ...base, primaryGoal: "stress_calm" });
    expect(athletic.biochemistry).toBeGreaterThan(stress.biochemistry);
  });

  it("adds beginner biomechanics bonus", () => {
    const beginner = calculatePillarWeights({ ...base, experience: "beginner" });
    const advanced = calculatePillarWeights({ ...base, experience: "advanced" });
    expect(beginner.biomechanics).toBeGreaterThan(advanced.biomechanics);
  });
});
