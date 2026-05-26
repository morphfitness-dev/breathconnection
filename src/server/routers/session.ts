import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc/init";
import { getUserBySupabaseId } from "@/lib/prisma/helpers";
import { TRPCError } from "@trpc/server";

const pillarEnum = z.enum(["BIOMECHANICS", "BIOCHEMISTRY", "NEUROPHYSIOLOGY", "MULTI"]);

export const sessionRouter = router({
  start: protectedProcedure
    .input(
      z.object({
        programId: z.string().optional(),
        pillarFocus: pillarEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      const session = await ctx.prisma.session.create({
        data: {
          userId: user.id,
          programId: input.programId,
          pillarFocus: input.pillarFocus,
        },
      });

      return { sessionId: session.id };
    }),

  complete: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        durationSeconds: z.number().int().positive(),
        subjectiveRating: z.number().int().min(1).max(5).optional(),
        userNotes: z.string().optional(),
        hrvDeltaMs: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      const session = await ctx.prisma.session.findUnique({
        where: { id: input.sessionId },
      });

      if (!session || session.userId !== user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      const coherenceAchieved = (input.hrvDeltaMs ?? 0) > 0;

      const updatedSession = await ctx.prisma.session.update({
        where: { id: input.sessionId },
        data: {
          isComplete: true,
          completedAt: new Date(),
          durationSeconds: input.durationSeconds,
          subjectiveRating: input.subjectiveRating,
          userNotes: input.userNotes,
          hrvDeltaMs: input.hrvDeltaMs,
          coherenceAchieved,
        },
      });

      // Update CoherenceStreak if coherenceAchieved
      if (coherenceAchieved) {
        const existingStreak = await ctx.prisma.coherenceStreak.findFirst({
          where: { userId: user.id },
        });

        const hasWearable =
          (await ctx.prisma.wearableConnection.findFirst({
            where: { userId: user.id, isActive: true },
          })) !== null;

        if (existingStreak) {
          const newCount = existingStreak.currentCount + 1;
          await ctx.prisma.coherenceStreak.update({
            where: { id: existingStreak.id },
            data: {
              currentCount: newCount,
              longestCount: Math.max(existingStreak.longestCount, newCount),
              lastValidatedAt: new Date(),
              hasWearable,
            },
          });
        } else {
          await ctx.prisma.coherenceStreak.create({
            data: {
              userId: user.id,
              currentCount: 1,
              longestCount: 1,
              lastValidatedAt: new Date(),
              hasWearable,
            },
          });
        }
      }

      return { session: updatedSession };
    }),

  logExercise: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        exerciseId: z.string(),
        order: z.number().int().min(0),
        maxHoldSeconds: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      const session = await ctx.prisma.session.findUnique({
        where: { id: input.sessionId },
      });

      if (!session || session.userId !== user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      // Check if a SessionExercise already exists for this session + exercise + order
      const existing = await ctx.prisma.sessionExercise.findFirst({
        where: {
          sessionId: input.sessionId,
          exerciseId: input.exerciseId,
          order: input.order,
        },
      });

      if (existing) {
        return ctx.prisma.sessionExercise.update({
          where: { id: existing.id },
          data: {
            completedAt: new Date(),
            maxHoldSeconds: input.maxHoldSeconds,
          },
        });
      }

      return ctx.prisma.sessionExercise.create({
        data: {
          sessionId: input.sessionId,
          exerciseId: input.exerciseId,
          order: input.order,
          maxHoldSeconds: input.maxHoldSeconds,
          completedAt: new Date(),
        },
      });
    }),

  logBolt: protectedProcedure
    .input(
      z.object({
        seconds: z.number().positive(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      // Find previous best
      const previousBest = await ctx.prisma.boltTest.findFirst({
        where: { userId: user.id },
        orderBy: { seconds: "desc" },
      });

      const previousBestSeconds = previousBest?.seconds ?? null;
      const isPersonalRecord =
        previousBestSeconds === null || input.seconds > previousBestSeconds;

      const boltTest = await ctx.prisma.boltTest.create({
        data: {
          userId: user.id,
          seconds: input.seconds,
          isPersonalRecord,
          context: input.context,
        },
      });

      return {
        seconds: boltTest.seconds,
        isPersonalRecord,
        previousBest: previousBestSeconds,
      };
    }),

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await getUserBySupabaseId(ctx.user.id);

      const session = await ctx.prisma.session.findUnique({
        where: { id: input.sessionId },
        include: {
          exercises: {
            include: {
              exercise: {
                include: {
                  video: {
                    select: {
                      muxPlaybackId: true,
                    },
                  },
                },
              },
            },
            orderBy: { order: "asc" },
          },
          program: {
            select: { id: true, name: true },
          },
        },
      });

      if (!session || session.userId !== user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      return session;
    }),
});
