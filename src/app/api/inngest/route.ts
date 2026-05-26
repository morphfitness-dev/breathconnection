import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  checkBoltPR,
  updatePillarRings,
  validateCoherenceStreak,
  checkStageAdvancement,
} from "@/inngest/functions/gamification";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    checkBoltPR,
    updatePillarRings,
    validateCoherenceStreak,
    checkStageAdvancement,
  ],
});
