import { z } from "zod";
import { router, adminProcedure } from "@/server/trpc/init";

export const videoRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.video.findMany({
      include: {
        exercise: true,
      },
      orderBy: { uploadedAt: "desc" },
    });
  }),

  link: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        exerciseCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the exercise by code
      const exercise = await ctx.prisma.exercise.findUnique({
        where: { code: input.exerciseCode },
      });

      if (!exercise) {
        throw new Error(`Exercise with code "${input.exerciseCode}" not found`);
      }

      // Set the exercise's videoId to link it
      return ctx.prisma.exercise.update({
        where: { id: exercise.id },
        data: { videoId: input.videoId },
      });
    }),

  publish: adminProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.video.update({
        where: { id: input.videoId },
        data: {
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    }),

  unpublish: adminProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.video.update({
        where: { id: input.videoId },
        data: { isPublished: false },
      });
    }),
});
