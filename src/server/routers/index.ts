import { router } from "@/server/trpc/init";
import { videoRouter } from "./video";
import { exerciseRouter } from "./exercise";

export const appRouter = router({
  video: videoRouter,
  exercise: exerciseRouter,
});

export type AppRouter = typeof appRouter;
