import { router } from "@/server/trpc/init";

// Routers will be added here as each phase is built
export const appRouter = router({});

export type AppRouter = typeof appRouter;
