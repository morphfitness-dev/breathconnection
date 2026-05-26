"use client";

import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";

const STAGE_COLOURS: Record<string, { bg: string; text: string; bar: string }> = {
  EXPLORER: {
    bg: "bg-[#F3F4F6]",
    text: "text-[#6B7280]",
    bar: "bg-[#9CA3AF]",
  },
  PRACTITIONER: {
    bg: "bg-[#1D9E75]/10",
    text: "text-[#1D9E75]",
    bar: "bg-[#1D9E75]",
  },
  OPTIMIZER: {
    bg: "bg-[#7F77DD]/10",
    text: "text-[#7F77DD]",
    bar: "bg-[#7F77DD]",
  },
  COACH: {
    bg: "bg-[#F59E0B]/10",
    text: "text-[#D97706]",
    bar: "bg-[#F59E0B]",
  },
};

const STAGE_BENEFITS: Record<string, string> = {
  PRACTITIONER: "Unlocks advanced biochemistry protocols",
  OPTIMIZER: "Unlocks personalised HRV-driven sessions",
  COACH: "Unlocks coach-level insights and reporting",
};

function progressPercent(progress: {
  boltNeeded: number;
  sessionsNeeded: number;
  streakNeeded: number;
} | null): number {
  if (!progress) return 100;
  // The furthest-from-complete criterion drives the bar
  // We can't know totals from just "needed", so we show an indeterminate
  // if all needed == 0, it's 100%
  const allZero =
    progress.boltNeeded === 0 &&
    progress.sessionsNeeded === 0 &&
    progress.streakNeeded === 0;
  if (allZero) return 99; // almost there
  return 10; // some progress needed — show a small bar
}

function worstCriterion(progress: {
  boltNeeded: number;
  sessionsNeeded: number;
  streakNeeded: number;
}): string {
  const items = [
    { label: `${Math.ceil(progress.boltNeeded)}s more BOLT`, value: progress.boltNeeded },
    {
      label: `${progress.sessionsNeeded} more sessions`,
      value: progress.sessionsNeeded,
    },
    {
      label: `${progress.streakNeeded} more coherence streak`,
      value: progress.streakNeeded,
    },
  ].filter((i) => i.value > 0);

  if (items.length === 0) return "All requirements met";
  // Sort by worst (highest remaining)
  items.sort((a, b) => b.value - a.value);
  return items[0]?.label ?? "Almost there";
}

export default function StageCard() {
  const { data, isLoading } = trpc.gamification.getStageInfo.useQuery();

  if (isLoading || !data) return null;

  const { currentStage, nextStage, progressToNext } = data;
  const colours = STAGE_COLOURS[currentStage] ?? STAGE_COLOURS["EXPLORER"];
  const nextColours =
    nextStage ? (STAGE_COLOURS[nextStage] ?? STAGE_COLOURS["PRACTITIONER"]) : null;

  const pct = data.progressToNext
    ? progressPercent(data.progressToNext)
    : 100;

  const benefit = nextStage ? (STAGE_BENEFITS[nextStage] ?? "") : null;
  const criterionLabel =
    progressToNext && nextStage
      ? worstCriterion(progressToNext)
      : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-5">
      {/* Stage badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colours.bg} ${colours.text}`}
        >
          {currentStage}
        </span>
        {nextStage && nextColours && (
          <span className="text-xs text-[#085041]/50">
            Next:{" "}
            <span className={`font-semibold ${nextColours.text}`}>
              {nextStage}
            </span>
          </span>
        )}
      </div>

      {/* Progress bar */}
      {nextStage && (
        <div className="mb-3">
          <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full ${colours.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {criterionLabel && (
            <p className="text-xs text-[#085041]/50 mt-1.5">{criterionLabel}</p>
          )}
        </div>
      )}

      {/* Next stage benefit */}
      {benefit && (
        <p className="text-xs text-[#085041]/70">
          <span className="font-medium text-[#085041]">Unlock: </span>
          {benefit}
        </p>
      )}

      {!nextStage && (
        <p className="text-xs text-[#D97706] font-semibold">
          Maximum stage reached. Outstanding!
        </p>
      )}
    </div>
  );
}
