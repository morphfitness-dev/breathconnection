import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc/init";
import { calculatePillarWeights } from "@/lib/assessment/pillar-weights";
import { evaluateSafetyGates } from "@/lib/safety/gates";
import { generateProgrammeConfig } from "@/lib/programme/generator";
import { getUserBySupabaseId } from "@/lib/prisma/helpers";
import { TRPCError } from "@trpc/server";

const AssessmentInputSchema = z.object({
  boltScore: z.number(),
  restingBreathRate: z.number(),
  restingHR: z.number(),
  breathingPattern: z.enum(["chest", "diaphragmatic", "mixed"]),
  neckShoulderTension: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  sleepQuality: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  stressLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  anxietyFrequency: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  primaryGoal: z.enum([
    "stress_calm",
    "anxiety_relief",
    "athletic_performance",
    "sleep_improvement",
    "general_wellbeing",
  ]),
  experience: z.enum(["beginner", "some", "regular", "advanced"]),
  dailyMinutes: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(30),
  ]),
  hasWearable: z.boolean(),
  // Safety flags
  hasCardiovascularCondition: z.boolean().default(false),
  hasEpilepsy: z.boolean().default(false),
  hasRespiratoryCondition: z.boolean().default(false),
  isPregnant: z.boolean().default(false),
  hasPanicDisorder: z.boolean().default(false),
  bpAbove140: z.boolean().default(false),
});

const SafetyFlagsSchema = z.object({
  hasCardiovascularCondition: z.boolean().optional(),
  hasEpilepsy: z.boolean().optional(),
  hasRespiratoryCondition: z.boolean().optional(),
  isPregnant: z.boolean().optional(),
  hasPanicDisorder: z.boolean().optional(),
  bpAbove140: z.boolean().optional(),
});

export const assessmentRouter = router({
  saveResponse: protectedProcedure
    .input(
      z.object({
        module: z.string(),
        questionId: z.string(),
        response: z.unknown(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      // Upsert by userId + module + questionId
      const existing = await ctx.prisma.assessmentResponse.findFirst({
        where: {
          userId: user.id,
          module: input.module,
          questionId: input.questionId,
        },
      });

      if (existing) {
        return ctx.prisma.assessmentResponse.update({
          where: { id: existing.id },
          data: { response: input.response as object },
        });
      }

      return ctx.prisma.assessmentResponse.create({
        data: {
          userId: user.id,
          module: input.module,
          questionId: input.questionId,
          response: input.response as object,
        },
      });
    }),

  complete: protectedProcedure
    .input(AssessmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      // 1. Calculate pillar weights
      const weights = calculatePillarWeights(input);

      // 2. Evaluate safety gates
      const safetyProfile = {
        hasCardiovascularCondition: input.hasCardiovascularCondition,
        hasEpilepsy: input.hasEpilepsy,
        hasRespiratoryCondition: input.hasRespiratoryCondition,
        isPregnant: input.isPregnant,
        hasPanicDisorder: input.hasPanicDisorder,
        bpAbove140: input.bpAbove140,
        paradoxicalResponseFlagged: false,
      };
      const gates = evaluateSafetyGates(safetyProfile);

      // 3. Generate programme config
      const { slug, startingTier, dailyMinutes } = generateProgrammeConfig({
        primaryGoal: input.primaryGoal,
        boltScore: input.boltScore,
        experience: input.experience,
        dailyMinutes: input.dailyMinutes,
      });

      // 4. Upsert PillarWeights record
      await ctx.prisma.pillarWeights.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          biomechanics: weights.biomechanics,
          biochemistry: weights.biochemistry,
          neurophysiology: weights.neurophysiology,
        },
        update: {
          biomechanics: weights.biomechanics,
          biochemistry: weights.biochemistry,
          neurophysiology: weights.neurophysiology,
        },
      });

      // 5. Update User safety flags
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          hasCardiovascularCondition: input.hasCardiovascularCondition,
          hasEpilepsy: input.hasEpilepsy,
          hasRespiratoryCondition: input.hasRespiratoryCondition,
          isPregnant: input.isPregnant,
          hasPanicDisorder: input.hasPanicDisorder,
          bpAbove140: input.bpAbove140,
        },
      });

      // 6. Find or create Program by slug
      const PROGRAMME_NAMES: Record<string, string> = {
        "hrv-optimisation": "HRV Optimisation",
        "anxiety-management": "Anxiety Management",
        "cardiovascular-endurance": "Cardiovascular Endurance",
        "sleep-improvement": "Sleep Improvement",
      };

      const PROGRAMME_DESCRIPTIONS: Record<string, string> = {
        "hrv-optimisation":
          "Improve your heart rate variability and stress resilience through targeted breathwork.",
        "anxiety-management":
          "Regulate your nervous system and reduce anxiety with evidence-based breathing techniques.",
        "cardiovascular-endurance":
          "Boost your athletic performance through CO2 tolerance and oxygen efficiency training.",
        "sleep-improvement":
          "Reset your sleep patterns with evening wind-down breathing protocols.",
      };

      let program = await ctx.prisma.program.findUnique({
        where: { slug },
      });

      if (!program) {
        program = await ctx.prisma.program.create({
          data: {
            slug,
            name: PROGRAMME_NAMES[slug] ?? slug,
            description: PROGRAMME_DESCRIPTIONS[slug] ?? "",
            durationWeeks: 4,
          },
        });
      }

      // 7. Set User.activeProgramId, User.onboardingComplete = true
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          activeProgramId: program.id,
          onboardingComplete: true,
        },
      });

      return {
        weights,
        gates,
        programSlug: slug,
        startingTier,
        dailyMinutes,
      };
    }),

  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserBySupabaseId(ctx.user.id);

    return ctx.prisma.assessmentResponse.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
  }),

  updateSafetyFlags: protectedProcedure
    .input(SafetyFlagsSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      const updateData: Record<string, boolean> = {};
      if (input.hasCardiovascularCondition !== undefined) {
        updateData.hasCardiovascularCondition = input.hasCardiovascularCondition;
      }
      if (input.hasEpilepsy !== undefined) {
        updateData.hasEpilepsy = input.hasEpilepsy;
      }
      if (input.hasRespiratoryCondition !== undefined) {
        updateData.hasRespiratoryCondition = input.hasRespiratoryCondition;
      }
      if (input.isPregnant !== undefined) {
        updateData.isPregnant = input.isPregnant;
      }
      if (input.hasPanicDisorder !== undefined) {
        updateData.hasPanicDisorder = input.hasPanicDisorder;
      }
      if (input.bpAbove140 !== undefined) {
        updateData.bpAbove140 = input.bpAbove140;
      }

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No safety flags provided",
        });
      }

      return ctx.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          hasCardiovascularCondition: true,
          hasEpilepsy: true,
          hasRespiratoryCondition: true,
          isPregnant: true,
          hasPanicDisorder: true,
          bpAbove140: true,
        },
      });
    }),
});
