import { router, protectedProcedure } from "@/server/trpc/init";
import { getUserBySupabaseId } from "@/lib/prisma/helpers";
import { calculateNSScore } from "@/lib/engine/ns-score";
import type { NSScoreOutput } from "@/lib/engine/ns-score";
import type { Pillar } from "@prisma/client";

export interface ExerciseSummary {
  id: string;
  name: string;
  description: string;
  pillar: Pillar;
  durationSeconds: number;
  breathHoldMax: number;
  order: number;
}

export interface TodaySession {
  programId: string;
  programName: string;
  weekNumber: number;
  sessionPlan: ExerciseSummary[];
  durationMinutes: number;
  pillarBreakdown: Record<string, number>;
}

export interface PillarRingData {
  biomechanics: number;
  biochemistry: number;
  neurophysiology: number;
  target: number;
}

export interface DailyData {
  user: {
    id: string;
    name: string | null;
    currentStage: string;
    onboardingComplete: boolean;
  };
  nsScore: NSScoreOutput;
  todaySession: TodaySession | null;
  pillarRings: PillarRingData;
  boltScore: number | null;
  hrvTrend: "up" | "stable" | "down" | null;
  wearableConnected: boolean;
}

export const homeRouter = router({
  getDailyData: protectedProcedure.query(async ({ ctx }): Promise<DailyData> => {
    const user = await getUserBySupabaseId(ctx.user.id);

    // ── Metrics ─────────────────────────────────────────────────────────────

    const hrv7Records = await ctx.prisma.metric.findMany({
      where: { userId: user.id, type: "HRV_RMSSD" },
      orderBy: { recordedAt: "desc" },
      take: 7,
    });

    const rhr7Records = await ctx.prisma.metric.findMany({
      where: { userId: user.id, type: "RESTING_HR" },
      orderBy: { recordedAt: "desc" },
      take: 7,
    });

    const sleepRecord = await ctx.prisma.metric.findFirst({
      where: { userId: user.id, type: "SLEEP_QUALITY" },
      orderBy: { recordedAt: "desc" },
    });

    const stressRecord = await ctx.prisma.metric.findFirst({
      where: { userId: user.id, type: "SUBJECTIVE_STRESS" },
      orderBy: { recordedAt: "desc" },
    });

    // ── NS Score computation ─────────────────────────────────────────────────

    const hrv7DayAvg =
      hrv7Records.length > 0
        ? hrv7Records.reduce((sum, m) => sum + m.value, 0) / hrv7Records.length
        : undefined;

    const hrvCurrent =
      hrv7Records.length > 0 ? hrv7Records[0].value : undefined;

    const rhr7DayAvg =
      rhr7Records.length > 0
        ? rhr7Records.reduce((sum, m) => sum + m.value, 0) / rhr7Records.length
        : undefined;

    const rhrCurrent =
      rhr7Records.length > 0 ? rhr7Records[0].value : undefined;

    // sleepQualityScore: raw value × 20 to get 0–100
    const sleepQualityScore =
      sleepRecord !== null ? sleepRecord.value * 20 : undefined;

    const rawStress = stressRecord?.value;
    const subjectiveStress =
      rawStress !== undefined &&
      rawStress >= 1 &&
      rawStress <= 5
        ? (Math.round(rawStress) as 1 | 2 | 3 | 4 | 5)
        : undefined;

    const wearableConnection = await ctx.prisma.wearableConnection.findFirst({
      where: { userId: user.id, isActive: true },
    });
    const hasWearable = wearableConnection !== null;

    const nsScore = calculateNSScore({
      hrv7DayAvg,
      hrvCurrent,
      rhr7DayAvg,
      rhrCurrent,
      sleepQualityScore,
      subjectiveStress,
      hasWearable,
    });

    // ── HRV Trend ────────────────────────────────────────────────────────────

    let hrvTrend: "up" | "stable" | "down" | null = null;
    if (hrv7Records.length >= 2) {
      const latest = hrv7Records[0].value;
      const previous = hrv7Records[1].value;
      const changePct = (latest - previous) / previous;
      if (changePct > 0.05) {
        hrvTrend = "up";
      } else if (changePct < -0.05) {
        hrvTrend = "down";
      } else {
        hrvTrend = "stable";
      }
    }

    // ── BOLT Score ───────────────────────────────────────────────────────────

    const boltTest = await ctx.prisma.boltTest.findFirst({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
    });
    const boltScore = boltTest ? boltTest.seconds : null;

    // ── Pillar Rings (this week) ─────────────────────────────────────────────

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekSessions = await ctx.prisma.session.findMany({
      where: {
        userId: user.id,
        isComplete: true,
        startedAt: { gte: startOfWeek },
      },
      select: { pillarFocus: true },
    });

    const pillarRings: PillarRingData = {
      biomechanics: 0,
      biochemistry: 0,
      neurophysiology: 0,
      target: 7,
    };

    for (const s of thisWeekSessions) {
      if (s.pillarFocus === "BIOMECHANICS") pillarRings.biomechanics++;
      else if (s.pillarFocus === "BIOCHEMISTRY") pillarRings.biochemistry++;
      else if (s.pillarFocus === "NEUROPHYSIOLOGY") pillarRings.neurophysiology++;
    }

    // ── Today's session ──────────────────────────────────────────────────────

    let todaySession: TodaySession | null = null;

    if (user.activeProgramId) {
      const program = await ctx.prisma.program.findUnique({
        where: { id: user.activeProgramId },
        include: {
          weeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              days: {
                orderBy: { dayNumber: "asc" },
                include: {
                  exercises: {
                    orderBy: { order: "asc" },
                    include: { exercise: true },
                  },
                },
              },
            },
          },
        },
      });

      if (program) {
        // Determine current week based on days since onboarding
        const onboardingDate = user.createdAt; // use createdAt as proxy
        const daysSince = Math.floor(
          (now.getTime() - onboardingDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const currentWeekNumber = Math.min(
          Math.floor(daysSince / 7) + 1,
          program.weeks.length
        );
        const todayDayNumber = (daysSince % 7) + 1;

        const currentWeek = program.weeks.find(
          (w) => w.weekNumber === currentWeekNumber
        );

        if (currentWeek) {
          // Find today's day, fall back to day 1 if not found
          const todayDay =
            currentWeek.days.find((d) => d.dayNumber === todayDayNumber) ??
            currentWeek.days[0];

          if (todayDay) {
            const exercises: ExerciseSummary[] = todayDay.exercises.map((de) => ({
              id: de.exercise.id,
              name: de.exercise.name,
              description: de.exercise.description,
              pillar: de.exercise.pillar,
              durationSeconds: de.durationSeconds,
              breathHoldMax: de.exercise.breathHoldMax,
              order: de.order,
            }));

            const totalDurationSeconds = todayDay.exercises.reduce(
              (sum, de) => sum + de.durationSeconds,
              0
            );

            const pillarBreakdown: Record<string, number> = {};
            for (const de of todayDay.exercises) {
              const p = de.exercise.pillar as string;
              pillarBreakdown[p] = (pillarBreakdown[p] ?? 0) + de.durationSeconds;
            }

            todaySession = {
              programId: program.id,
              programName: program.name,
              weekNumber: currentWeekNumber,
              sessionPlan: exercises,
              durationMinutes: Math.ceil(totalDurationSeconds / 60),
              pillarBreakdown,
            };
          }
        }
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        currentStage: user.currentStage,
        onboardingComplete: user.onboardingComplete,
      },
      nsScore,
      todaySession,
      pillarRings,
      boltScore,
      hrvTrend,
      wearableConnected: hasWearable,
    };
  }),
});
