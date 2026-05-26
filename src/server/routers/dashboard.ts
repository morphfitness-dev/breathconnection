import { router, protectedProcedure } from "@/server/trpc/init";
import { getUserBySupabaseId } from "@/lib/prisma/helpers";
import { nextStageAfter, STAGE_REQUIREMENTS } from "@/inngest/functions/gamification";
import type { UserStage } from "@prisma/client";

export const dashboardRouter = router({
  getData: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserBySupabaseId(ctx.user.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── BOLT history ─────────────────────────────────────────────────────────
    const boltHistory = await ctx.prisma.boltTest.findMany({
      where: { userId: user.id },
      orderBy: { testedAt: "asc" },
    });

    // ── HRV 30 days ──────────────────────────────────────────────────────────
    const hrv30Days = await ctx.prisma.metric.findMany({
      where: {
        userId: user.id,
        type: "HRV_RMSSD",
        recordedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { recordedAt: "asc" },
    });

    // ── Resting HR 30 days ───────────────────────────────────────────────────
    const rhr30Days = await ctx.prisma.metric.findMany({
      where: {
        userId: user.id,
        type: "RESTING_HR",
        recordedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { recordedAt: "asc" },
    });

    // ── Respiratory rate 30 days ─────────────────────────────────────────────
    const rr30Days = await ctx.prisma.metric.findMany({
      where: {
        userId: user.id,
        type: "RESPIRATORY_RATE",
        recordedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { recordedAt: "asc" },
    });

    // ── Hold records ─────────────────────────────────────────────────────────
    const holdRecords = await ctx.prisma.holdRecord.findMany({
      where: { userId: user.id },
      orderBy: { achievedAt: "desc" },
    });

    // ── Coherence sessions last 30 days ──────────────────────────────────────
    const recentSessions = await ctx.prisma.session.findMany({
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

    const coherenceSessions = recentSessions.map((s) => ({
      date: s.startedAt.toISOString().split("T")[0] as string,
      achieved: s.coherenceAchieved,
    }));

    // ── Pillar weekly (last 4 weeks) ─────────────────────────────────────────
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weekSessions = await ctx.prisma.session.findMany({
      where: {
        userId: user.id,
        isComplete: true,
        startedAt: { gte: fourWeeksAgo },
      },
      select: {
        startedAt: true,
        pillarFocus: true,
      },
      orderBy: { startedAt: "asc" },
    });

    // Group into 4 weeks relative to fourWeeksAgo
    const pillarWeeklyMap: Map<
      number,
      { biomechanics: number; biochemistry: number; neurophysiology: number }
    > = new Map();

    for (let w = 1; w <= 4; w++) {
      pillarWeeklyMap.set(w, {
        biomechanics: 0,
        biochemistry: 0,
        neurophysiology: 0,
      });
    }

    for (const s of weekSessions) {
      const daysDiff = Math.floor(
        (s.startedAt.getTime() - fourWeeksAgo.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weekNum = Math.min(4, Math.floor(daysDiff / 7) + 1);
      const entry = pillarWeeklyMap.get(weekNum);
      if (!entry) continue;

      if (s.pillarFocus === "BIOMECHANICS") entry.biomechanics++;
      else if (s.pillarFocus === "BIOCHEMISTRY") entry.biochemistry++;
      else if (s.pillarFocus === "NEUROPHYSIOLOGY") entry.neurophysiology++;
    }

    const pillarWeekly = Array.from(pillarWeeklyMap.entries()).map(
      ([week, data]) => ({ week, ...data })
    );

    // ── Stage info ────────────────────────────────────────────────────────────
    const currentStage: UserStage = user.currentStage;
    const nextStage = nextStageAfter(currentStage);

    let progressPercent = 100;

    if (nextStage) {
      const req = STAGE_REQUIREMENTS[nextStage];
      if (req) {
        const boltBest = boltHistory.length > 0
          ? Math.max(...boltHistory.map((b) => b.seconds))
          : 0;

        const completedCount = await ctx.prisma.session.count({
          where: { userId: user.id, isComplete: true },
        });

        const streak = await ctx.prisma.coherenceStreak.findFirst({
          where: { userId: user.id },
        });
        const longestStreak = streak?.longestCount ?? 0;

        const boltPct = req.boltMin > 0 ? Math.min(1, boltBest / req.boltMin) : 1;
        const sessionsPct =
          req.sessionsMin > 0 ? Math.min(1, completedCount / req.sessionsMin) : 1;
        const streakPct =
          req.streakMin > 0 ? Math.min(1, longestStreak / req.streakMin) : 1;

        // Progress = minimum criterion (hardest to reach)
        progressPercent = Math.round(
          Math.min(boltPct, sessionsPct, streakPct) * 100
        );
      }
    }

    const stageInfo = {
      currentStage,
      nextStage,
      progressPercent,
    };

    return {
      boltHistory,
      hrv30Days,
      rhr30Days,
      rr30Days,
      holdRecords,
      coherenceSessions,
      pillarWeekly,
      stageInfo,
    };
  }),
});
