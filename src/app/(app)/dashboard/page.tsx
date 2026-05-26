import { redirect } from "next/navigation";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/routers";
import BoltTrendChart from "@/components/dashboard/BoltTrendChart";
import HRVTrendChart from "@/components/dashboard/HRVTrendChart";
import RestingHRChart from "@/components/dashboard/RestingHRChart";
import BreathingRateChart from "@/components/dashboard/BreathingRateChart";
import HoldRecordTimeline from "@/components/dashboard/HoldRecordTimeline";
import CoherenceCalendar from "@/components/dashboard/CoherenceCalendar";
import PillarBarChart from "@/components/dashboard/PillarBarChart";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";

const createCaller = createCallerFactory(appRouter);

export default async function DashboardPage() {
  const ctx = await createTRPCContext();
  if (!ctx.user) {
    redirect("/login");
  }

  const caller = createCaller(ctx);
  const data = await caller.dashboard.getData();

  const {
    boltHistory,
    hrv30Days,
    rhr30Days,
    rr30Days,
    holdRecords,
    coherenceSessions,
    pillarWeekly,
    stageInfo,
  } = data;

  // Compute current streak from coherence sessions
  const sortedSessions = [...coherenceSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let currentStreak = 0;
  for (const s of sortedSessions) {
    if (s.achieved) currentStreak++;
    else break;
  }

  // Annotate bolt history with running PR flag
  let runningBest: number | null = null;
  const boltWithPR = boltHistory.map((b) => {
    const isPR = runningBest === null || b.seconds > runningBest;
    if (isPR) runningBest = b.seconds;
    return { ...b, isPersonalRecord: isPR };
  });

  const stageColour: Record<string, string> = {
    EXPLORER: "text-[#6B7280]",
    PRACTITIONER: "text-[#1D9E75]",
    OPTIMIZER: "text-[#7F77DD]",
    COACH: "text-[#F59E0B]",
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Stage progress banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-5">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-sm font-bold uppercase tracking-wide ${stageColour[stageInfo.currentStage] ?? "text-[#085041]"}`}
            >
              {stageInfo.currentStage}
            </span>
            {stageInfo.nextStage && (
              <span className="text-xs text-[#085041]/50">
                Next: {stageInfo.nextStage}
              </span>
            )}
          </div>
          {stageInfo.nextStage && (
            <div className="w-full bg-[#F3F4F6] rounded-full h-2">
              <div
                className="bg-[#1D9E75] h-2 rounded-full transition-all"
                style={{ width: `${stageInfo.progressPercent}%` }}
              />
            </div>
          )}
          {!stageInfo.nextStage && (
            <p className="text-xs text-[#085041]/60">
              You have reached the highest stage.
            </p>
          )}
        </div>

        {/* Primary — BOLT trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-5">
          <h2 className="text-sm font-semibold text-[#085041] mb-4">
            BOLT Score Trend
          </h2>
          {boltWithPR.length > 0 ? (
            <BoltTrendChart data={boltWithPR} />
          ) : (
            <p className="text-sm text-[#085041]/50 text-center py-10">
              No BOLT tests recorded yet.
            </p>
          )}
        </div>

        {/* Primary — HRV trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-5">
          <h2 className="text-sm font-semibold text-[#085041] mb-4">
            HRV (30 days)
          </h2>
          {hrv30Days.length > 0 ? (
            <HRVTrendChart data={hrv30Days} />
          ) : (
            <p className="text-sm text-[#085041]/50 text-center py-10">
              No HRV data in the last 30 days.
            </p>
          )}
        </div>

        {/* Primary — Resting HR */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-5">
          <h2 className="text-sm font-semibold text-[#085041] mb-4">
            Resting Heart Rate (30 days)
          </h2>
          {rhr30Days.length > 0 ? (
            <RestingHRChart data={rhr30Days} />
          ) : (
            <p className="text-sm text-[#085041]/50 text-center py-10">
              No resting HR data in the last 30 days.
            </p>
          )}
        </div>

        {/* Pillar breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-5">
          <h2 className="text-sm font-semibold text-[#085041] mb-4">
            Pillar Breakdown (last 4 weeks)
          </h2>
          <PillarBarChart data={pillarWeekly} />
        </div>

        {/* Secondary — Breathing rate (collapsible) */}
        <CollapsibleSection title="Breathing Rate (30 days)">
          {rr30Days.length > 0 ? (
            <BreathingRateChart data={rr30Days} />
          ) : (
            <p className="text-sm text-[#085041]/50 text-center py-6">
              No respiratory rate data in the last 30 days.
            </p>
          )}
        </CollapsibleSection>

        {/* Secondary — Hold records (collapsible) */}
        <CollapsibleSection title="Breath Hold Records">
          <HoldRecordTimeline records={holdRecords} />
        </CollapsibleSection>

        {/* Secondary — Coherence calendar (collapsible) */}
        <CollapsibleSection title="Coherence Calendar">
          <CoherenceCalendar
            sessions={coherenceSessions}
            currentStreak={currentStreak}
          />
        </CollapsibleSection>

      </div>
    </div>
  );
}
