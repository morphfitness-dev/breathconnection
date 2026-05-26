import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma/client";
import type { UserStage } from "@prisma/client";

// ─── Milestone helpers ────────────────────────────────────────────────────────

export const BOLT_MILESTONES = [15, 25, 35] as const;
export type BoltMilestone = (typeof BOLT_MILESTONES)[number];

/**
 * Returns which BOLT milestones are crossed for the first time by `newSeconds`
 * given the previous best (or null if no prior test).
 */
export function detectBoltMilestones(
  newSeconds: number,
  previousBestSeconds: number | null
): BoltMilestone[] {
  return BOLT_MILESTONES.filter((m) => {
    const previouslyBelow =
      previousBestSeconds === null || previousBestSeconds < m;
    const nowAtOrAbove = newSeconds >= m;
    return previouslyBelow && nowAtOrAbove;
  });
}

// ─── Stage ordering ───────────────────────────────────────────────────────────

const STAGE_ORDER: UserStage[] = [
  "EXPLORER",
  "PRACTITIONER",
  "OPTIMIZER",
  "COACH",
];

function stageIndex(stage: UserStage): number {
  return STAGE_ORDER.indexOf(stage);
}

function nextStageAfter(stage: UserStage): UserStage | null {
  const idx = stageIndex(stage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

// ─── checkBoltPR ─────────────────────────────────────────────────────────────

export const checkBoltPR = inngest.createFunction(
  { id: "check-bolt-pr", name: "Check BOLT Personal Record" },
  { event: "bolt/test.completed" },
  async ({ event, step }) => {
    const { userId, boltTestId } = event.data as {
      userId: string;
      boltTestId: string;
    };

    // 1. Fetch the new test + all prior tests for this user
    const [newTest, allTests] = await step.run("fetch-bolt-data", async () => {
      const test = await prisma.boltTest.findUnique({
        where: { id: boltTestId },
      });
      const tests = await prisma.boltTest.findMany({
        where: { userId },
        orderBy: { testedAt: "asc" },
      });
      return { test, tests };
    });

    if (!newTest) {
      return { skipped: true, reason: "BoltTest not found" };
    }

    // Previous best = highest seconds among all tests except this one
    const priorTests = allTests.filter((t) => t.id !== boltTestId);
    const previousBest =
      priorTests.length > 0
        ? Math.max(...priorTests.map((t) => t.seconds))
        : null;

    // 2. If new test is a PR: create notification
    if (previousBest === null || newTest.seconds > previousBest) {
      await step.run("create-pr-notification", async () => {
        await prisma.notification.create({
          data: {
            userId,
            type: "bolt_pr",
            title: "New BOLT personal best!",
            body: `You hit ${Math.round(newTest.seconds)}s — your best ever.`,
          },
        });
      });
    }

    // 3. Check BOLT milestones
    const crossedMilestones = detectBoltMilestones(
      newTest.seconds,
      previousBest
    );

    for (const milestone of crossedMilestones) {
      await step.run(`milestone-${milestone}`, async () => {
        await prisma.notification.create({
          data: {
            userId,
            type: "bolt_milestone",
            title: `BOLT milestone: ${milestone}s reached!`,
            body: `You've crossed the ${milestone}s BOLT score threshold — a major breathing milestone.`,
          },
        });
      });
    }

    // 4. Trigger stage check
    await step.sendEvent("trigger-stage-check", {
      name: "gamification/stage.check",
      data: { userId },
    });

    return { crossedMilestones, isPR: newTest.isPersonalRecord };
  }
);

// ─── updatePillarRings ────────────────────────────────────────────────────────

export const updatePillarRings = inngest.createFunction(
  { id: "update-pillar-rings", name: "Update Pillar Rings" },
  { event: "session/completed" },
  async ({ event, logger }) => {
    logger.info("session/completed received — pillar rings computed live", {
      userId: (event.data as { userId: string }).userId,
      sessionId: (event.data as { sessionId: string }).sessionId,
    });
    return { noOp: true };
  }
);

// ─── validateCoherenceStreak ──────────────────────────────────────────────────

const COHERENCE_MILESTONES = [7, 30, 100] as const;
type CoherenceMilestone = (typeof COHERENCE_MILESTONES)[number];

function detectCoherenceMilestones(
  newCount: number,
  previousCount: number
): CoherenceMilestone[] {
  return COHERENCE_MILESTONES.filter(
    (m) => previousCount < m && newCount >= m
  );
}

export const validateCoherenceStreak = inngest.createFunction(
  {
    id: "validate-coherence-streak",
    name: "Validate Coherence Streak",
  },
  { event: "session/completed" },
  async ({ event, step }) => {
    const { userId, sessionId } = event.data as {
      userId: string;
      sessionId: string;
    };

    // 1. Fetch session
    const session = await step.run("fetch-session", async () =>
      prisma.session.findUnique({ where: { id: sessionId } })
    );

    if (!session) {
      return { skipped: true, reason: "Session not found" };
    }

    if (session.coherenceAchieved) {
      // 2a. Coherence achieved — update streak
      const { newCount, crossedMilestones } = await step.run(
        "update-streak",
        async () => {
          const hasWearable =
            (await prisma.wearableConnection.findFirst({
              where: { userId, isActive: true },
            })) !== null;

          const existing = await prisma.coherenceStreak.findFirst({
            where: { userId },
          });

          const previousCount = existing?.currentCount ?? 0;
          const count = previousCount + 1;
          const longest = Math.max(existing?.longestCount ?? 0, count);

          if (existing) {
            await prisma.coherenceStreak.update({
              where: { id: existing.id },
              data: {
                currentCount: count,
                longestCount: longest,
                lastValidatedAt: new Date(),
                hasWearable,
              },
            });
          } else {
            await prisma.coherenceStreak.create({
              data: {
                userId,
                currentCount: count,
                longestCount: longest,
                lastValidatedAt: new Date(),
                hasWearable,
              },
            });
          }

          const crossed = detectCoherenceMilestones(count, previousCount);
          return { newCount: count, crossedMilestones: crossed };
        }
      );

      // 3. Create milestone notifications
      for (const milestone of crossedMilestones) {
        await step.run(`coherence-milestone-${milestone}`, async () => {
          await prisma.notification.create({
            data: {
              userId,
              type: "coherence_milestone",
              title: `Coherence streak: ${milestone} sessions!`,
              body: `You've achieved coherence in ${milestone} sessions in a row — outstanding consistency.`,
            },
          });
        });
      }

      return { newCount, crossedMilestones };
    } else {
      // 2b. Not coherent — reset streak
      await step.run("reset-streak", async () => {
        const existing = await prisma.coherenceStreak.findFirst({
          where: { userId },
        });
        if (existing) {
          await prisma.coherenceStreak.update({
            where: { id: existing.id },
            data: { currentCount: 0 },
          });
        }
      });

      return { reset: true };
    }
  }
);

// ─── checkStageAdvancement ────────────────────────────────────────────────────

interface StageRequirements {
  boltMin: number;
  sessionsMin: number;
  streakMin: number;
}

const STAGE_REQUIREMENTS: Record<string, StageRequirements> = {
  PRACTITIONER: { boltMin: 20, sessionsMin: 10, streakMin: 0 },
  OPTIMIZER: { boltMin: 30, sessionsMin: 40, streakMin: 7 },
  COACH: { boltMin: 40, sessionsMin: 100, streakMin: 30 },
};

const STAGE_BENEFITS: Record<string, string> = {
  PRACTITIONER: "Access advanced biochemistry protocols",
  OPTIMIZER: "Unlock personalised HRV-driven sessions",
  COACH: "Access coach-level insights and reporting",
};

export const checkStageAdvancement = inngest.createFunction(
  {
    id: "check-stage-advancement",
    name: "Check Stage Advancement",
  },
  { event: "gamification/stage.check" },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    const { user, boltBest, completedSessions, longestStreak } =
      await step.run("fetch-user-data", async () => {
        const u = await prisma.user.findUnique({ where: { id: userId } });

        const boltRecord = await prisma.boltTest.findFirst({
          where: { userId },
          orderBy: { seconds: "desc" },
        });

        const sessions = await prisma.session.count({
          where: { userId, isComplete: true },
        });

        const streak = await prisma.coherenceStreak.findFirst({
          where: { userId },
        });

        return {
          user: u,
          boltBest: boltRecord?.seconds ?? 0,
          completedSessions: sessions,
          longestStreak: streak?.longestCount ?? 0,
        };
      });

    if (!user) {
      return { skipped: true, reason: "User not found" };
    }

    // Check stages in order from highest to lowest to find maximum earned
    const orderedStages: UserStage[] = ["COACH", "OPTIMIZER", "PRACTITIONER"];
    let newStage: UserStage = user.currentStage;

    for (const stage of orderedStages) {
      const req = STAGE_REQUIREMENTS[stage];
      if (!req) continue;
      if (
        boltBest >= req.boltMin &&
        completedSessions >= req.sessionsMin &&
        longestStreak >= req.streakMin
      ) {
        // This stage is earned; only advance if higher than current
        if (stageIndex(stage) > stageIndex(user.currentStage)) {
          newStage = stage;
        }
        break;
      }
    }

    if (newStage !== user.currentStage) {
      await step.run("advance-stage", async () => {
        await prisma.user.update({
          where: { id: userId },
          data: { currentStage: newStage },
        });

        const benefit = STAGE_BENEFITS[newStage] ?? "Continue your journey";
        await prisma.notification.create({
          data: {
            userId,
            type: "stage_advancement",
            title: `Stage unlocked: ${newStage}!`,
            body: `You've advanced to ${newStage}. ${benefit}.`,
          },
        });
      });

      return {
        advanced: true,
        from: user.currentStage,
        to: newStage,
      };
    }

    return { advanced: false, currentStage: user.currentStage };
  }
);

// ─── Re-export next stage helper ─────────────────────────────────────────────
export { nextStageAfter, STAGE_REQUIREMENTS };
