import { router } from "@/server/trpc/init";
import { videoRouter } from "./video";
import { exerciseRouter } from "./exercise";
import { assessmentRouter } from "./assessment";

export const appRouter = router({
  video: videoRouter,
  exercise: exerciseRouter,
  assessment: assessmentRouter,
});

export type AppRouter = typeof appRouter;
