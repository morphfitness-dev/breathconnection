import { z } from "zod";
import { router, adminProcedure } from "@/server/trpc/init";

const pillarEnum = z.enum(["BIOMECHANICS", "BIOCHEMISTRY", "NEUROPHYSIOLOGY", "MULTI"]);
const instructorStyleEnum = z.enum(["WARM", "CLINICAL", "ENERGISING", "CALM"]);

const exerciseCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  pillar: pillarEnum,
  tier: z.number().int().min(1).max(5),
  durationSeconds: z.number().int().positive(),
  instructorStyle: instructorStyleEnum,
  primaryGoal: z.array(z.string()),
  contraindications: z.array(z.string()),
  breathHoldMax: z.number().int().min(0).default(0),
  positionRequired: z.string(),
  biometricFeedbackType: z.array(z.string()),
  nervousSystemScoreMin: z.number().int().min(0).default(0),
  gamificationEvent: z.string().optional(),
  fourWeekAnchor: z.boolean().default(false),
  videoId: z.string().optional(),
});

const exerciseUpdateSchema = exerciseCreateSchema.partial().extend({
  id: z.string(),
});

export const exerciseRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.exercise.findMany({
      include: {
        video: {
          select: {
            id: true,
            muxStatus: true,
            isPublished: true,
            muxPlaybackId: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });
  }),

  create: adminProcedure
    .input(exerciseCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.exercise.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description,
          pillar: input.pillar,
          tier: input.tier,
          durationSeconds: input.durationSeconds,
          instructorStyle: input.instructorStyle,
          primaryGoal: input.primaryGoal,
          contraindications: input.contraindications,
          breathHoldMax: input.breathHoldMax,
          positionRequired: input.positionRequired,
          biometricFeedbackType: input.biometricFeedbackType,
          nervousSystemScoreMin: input.nervousSystemScoreMin,
          gamificationEvent: input.gamificationEvent,
          fourWeekAnchor: input.fourWeekAnchor,
          videoId: input.videoId,
        },
      });
    }),

  update: adminProcedure
    .input(exerciseUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.exercise.update({
        where: { id },
        data,
      });
    }),
});
