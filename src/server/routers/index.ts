import { router } from "@/server/trpc/init";
import { videoRouter } from "./video";
import { exerciseRouter } from "./exercise";
import { assessmentRouter } from "./assessment";
import { homeRouter } from "./home";
import { sessionRouter } from "./session";

export const appRouter = router({
  video: videoRouter,
  exercise: exerciseRouter,
  assessment: assessmentRouter,
  home: homeRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
