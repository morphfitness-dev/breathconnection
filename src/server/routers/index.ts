import { router } from "@/server/trpc/init";
import { videoRouter } from "./video";
import { exerciseRouter } from "./exercise";
import { assessmentRouter } from "./assessment";
import { homeRouter } from "./home";
import { sessionRouter } from "./session";
import { gamificationRouter } from "./gamification";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  video: videoRouter,
  exercise: exerciseRouter,
  assessment: assessmentRouter,
  home: homeRouter,
  session: sessionRouter,
  gamification: gamificationRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
