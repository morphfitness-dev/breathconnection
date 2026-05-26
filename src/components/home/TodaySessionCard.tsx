"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import type { TodaySession } from "@/server/routers/home";

interface TodaySessionCardProps {
  todaySession: TodaySession;
}

const PILLAR_COLOURS: Record<string, string> = {
  BIOMECHANICS: "#1D9E75",
  BIOCHEMISTRY: "#D85A30",
  NEUROPHYSIOLOGY: "#7F77DD",
  MULTI: "#6B7280",
};

const PILLAR_LABELS: Record<string, string> = {
  BIOMECHANICS: "Biomechanics",
  BIOCHEMISTRY: "Biochemistry",
  NEUROPHYSIOLOGY: "Neurophysiology",
  MULTI: "Multi",
};

export default function TodaySessionCard({ todaySession }: TodaySessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const startMutation = trpc.session.start.useMutation({
    onSuccess(data) {
      router.push(`/session/${data.sessionId}`);
    },
  });

  const totalSeconds = Object.values(todaySession.pillarBreakdown).reduce(
    (a, b) => a + b,
    0
  );

  const firstExercise = todaySession.sessionPlan[0];

  function handleBegin() {
    const firstPillar = firstExercise?.pillar;
    startMutation.mutate({
      programId: todaySession.programId,
      pillarFocus: firstPillar,
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-[#085041]/50 uppercase tracking-wide mb-0.5">
            Today&apos;s Session
          </p>
          <h2 className="text-lg font-semibold text-[#085041]">
            {todaySession.programName}
          </h2>
          <p className="text-sm text-[#085041]/60">Week {todaySession.weekNumber}</p>
        </div>
        <span className="bg-[#E1F5EE] text-[#085041] text-xs font-medium px-3 py-1 rounded-full">
          {todaySession.durationMinutes} min
        </span>
      </div>

      {/* Pillar breakdown mini-bar */}
      <div className="flex rounded-full overflow-hidden h-2 mb-4 gap-0.5">
        {Object.entries(todaySession.pillarBreakdown).map(([pillar, seconds]) => {
          const pct = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
          return (
            <div
              key={pillar}
              style={{
                width: `${pct}%`,
                backgroundColor: PILLAR_COLOURS[pillar] ?? "#6B7280",
              }}
              title={`${PILLAR_LABELS[pillar] ?? pillar}: ${Math.round(seconds / 60)} min`}
            />
          );
        })}
      </div>

      {firstExercise && (
        <p className="text-sm text-[#1C1C1A]/70 mb-5">
          First: <span className="font-medium text-[#1C1C1A]">{firstExercise.name}</span>
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleBegin}
          disabled={startMutation.isPending}
          className="flex-1 bg-[#1D9E75] hover:bg-[#085041] text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-60"
        >
          {startMutation.isPending ? "Starting…" : "Begin session"}
        </button>
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="px-4 py-3 border border-[#1D9E75]/30 text-[#1D9E75] font-medium rounded-xl hover:bg-[#E1F5EE] transition-colors text-sm"
        >
          {expanded ? "Hide" : "See full plan"}
        </button>
      </div>

      {expanded && (
        <ul className="mt-4 space-y-2">
          {todaySession.sessionPlan.map((ex) => (
            <li key={ex.id} className="flex items-center justify-between py-2 border-t border-[#1D9E75]/10">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PILLAR_COLOURS[ex.pillar] ?? "#6B7280" }}
                />
                <span className="text-sm text-[#1C1C1A] font-medium">{ex.name}</span>
              </div>
              <span className="text-xs text-[#085041]/50">
                {Math.round(ex.durationSeconds / 60)} min
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
