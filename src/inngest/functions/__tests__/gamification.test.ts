import { describe, it, expect } from "vitest";
import { detectBoltMilestones, BOLT_MILESTONES } from "../gamification-helpers";

describe("detectBoltMilestones", () => {
  it("returns all milestones when there is no prior test", () => {
    const crossed = detectBoltMilestones(35, null);
    expect(crossed).toEqual(expect.arrayContaining([15, 25, 35]));
    expect(crossed.length).toBe(3);
  });

  it("returns no milestones when new score is below the first threshold", () => {
    const crossed = detectBoltMilestones(14, null);
    expect(crossed).toHaveLength(0);
  });

  it("returns only the 15s milestone when crossing 15 for the first time", () => {
    const crossed = detectBoltMilestones(15, 14);
    expect(crossed).toEqual([15]);
  });

  it("returns only the 25s milestone when already past 15", () => {
    const crossed = detectBoltMilestones(26, 20);
    expect(crossed).toEqual([25]);
  });

  it("returns the 25s and 35s milestones when jumping from 20 to 35", () => {
    const crossed = detectBoltMilestones(35, 20);
    expect(crossed).toEqual(expect.arrayContaining([25, 35]));
    expect(crossed.length).toBe(2);
  });

  it("returns no milestones when previous best already passed all thresholds", () => {
    const crossed = detectBoltMilestones(40, 38);
    expect(crossed).toHaveLength(0);
  });

  it("returns 35s milestone when exactly hitting 35", () => {
    const crossed = detectBoltMilestones(35, 34);
    expect(crossed).toEqual([35]);
  });

  it("does not return a milestone if previous best was at or above it", () => {
    const crossed = detectBoltMilestones(16, 15);
    expect(crossed).toHaveLength(0);
  });

  it("returns all three milestones when jumping from 0 to above 35", () => {
    const crossed = detectBoltMilestones(40, 0);
    expect(crossed).toEqual(expect.arrayContaining([15, 25, 35]));
    expect(crossed.length).toBe(3);
  });

  it("BOLT_MILESTONES constant contains exactly 15, 25, 35", () => {
    expect(BOLT_MILESTONES).toEqual([15, 25, 35]);
  });

  it("returns only 35s when previous best was exactly 25", () => {
    const crossed = detectBoltMilestones(36, 25);
    expect(crossed).toEqual([35]);
  });

  it("returns nothing when new score equals previous best and below all milestones", () => {
    const crossed = detectBoltMilestones(10, 10);
    expect(crossed).toHaveLength(0);
  });
});
