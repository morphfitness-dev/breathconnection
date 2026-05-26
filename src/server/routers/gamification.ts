import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc/init";
import { getUserBySupabaseId } from "@/lib/prisma/helpers";
import {
  BOLT_MILESTONES,
  detectBoltMilestones,
  STAGE_REQUIREMENTS,
  nextStageAfter,
} from "@/inngest/functions/gamification";
import type { UserStage } from "@prisma/client";

export const gamificationRouter = router({
  // ── getBoltHistory ──────────────────────────────────────────────────────────
  getBoltHistory: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserBySupabaseId(ctx.user.id);

    const tests = await ctx.prisma.boltTest.findMany({
      where: { userId: user.id },
      orderBy: { testedAt: "asc" },
    });

    // Compute running personal record and milestone flags
    let runningBest: number | null = null;

    const result = tests.map((test) => {
      const isPR = runningBest === null || test.seconds > runningBest;
      const crossedMilestones = detectBoltMilestones(test.seconds, runningBest);

      if (isPR) {
        runningBest = test.seconds;
      }

      const milestoneFlags: Record<(typeof BOLT_MILESTONES)[number], boolean> =
        {
          15: crossedMilestones.includes(15),
          25: crossedMilestones.includes(25),
          35: crossedMilestones.includes(35),
        };

      return {
        ...test,
        isPersonalRecord: isPR,
        milestoneFlags,
      };
    });

    return result;
  }),

  // ── getStreakData ───────────────────────────────────────────────────────────
  getStreakData: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserBySupabaseId(ctx.user.id);

    const streak = await ctx.prisma.coherenceStreak.findFirst({
      where: { userId: user.id },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await ctx.prisma.session.findMany({
      where: {
        userId: user.id,
        isComplete: true,
        startedAt: { gte: thirtyDaysAgo },
      },
      select: {
        startedAt: true,
        coherenceAchieved: true,
      },
      orderBy: { startedAt: "asc" },
    });

    const recentSessions = sessions.map((s) => ({
      date: s.startedAt.toISOString().split("T")[0] as string,
      achieved: s.coherenceAchieved,
    }));

    return {
      streak: streak ?? null,
      recentSessions,
    };
  }),

  // ── getNotifications ────────────────────────────────────────────────────────
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserBySupabaseId(ctx.user.id);

    const notifications = await ctx.prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return notifications;
  }),

  // ── markNotificationRead ────────────────────────────────────────────────────
  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      await ctx.prisma.notification.updateMany({
        where: { id: input.notificationId, userId: user.id },
        data: { isRead: true },
      });

      return { success: true };
    }),

  // ── getStageInfo ────────────────────────────────────────────────────────────
  getStageInfo: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserBySupabaseId(ctx.user.id);

    const currentStage: UserStage = user.currentStage;
    const next = nextStageAfter(currentStage);

    if (!next) {
      return {
        currentStage,
        nextStage: null,
        progressToNext: null,
      };
    }

    const req = STAGE_REQUIREMENTS[next];

    // Gather current stats
    const boltBest = await ctx.prisma.boltTest.findFirst({
      where: { userId: user.id },
      orderBy: { seconds: "desc" },
    });

    const completedSessions = await ctx.prisma.session.count({
      where: { userId: user.id, isComplete: true },
    });

    const streak = await ctx.prisma.coherenceStreak.findFirst({
      where: { userId: user.id },
    });

    const currentBolt = boltBest?.seconds ?? 0;
    const longestStreak = streak?.longestCount ?? 0;

    if (!req) {
      return {
        currentStage,
        nextStage: next,
        progressToNext: {
          boltNeeded: 0,
          sessionsNeeded: 0,
          streakNeeded: 0,
        },
      };
    }

    return {
      currentStage,
      nextStage: next,
      progressToNext: {
        boltNeeded: Math.max(0, req.boltMin - currentBolt),
        sessionsNeeded: Math.max(0, req.sessionsMin - completedSessions),
        streakNeeded: Math.max(0, req.streakMin - longestStreak),
      },
    };
  }),
});
