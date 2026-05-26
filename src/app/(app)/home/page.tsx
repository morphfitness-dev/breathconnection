import { redirect } from "next/navigation";
import { appRouter } from "@/server/routers";
import { createTRPCContext, createCallerFactory } from "@/server/trpc/init";
import NSScoreCard from "@/components/home/NSScoreCard";
import TodaySessionCard from "@/components/home/TodaySessionCard";
import PillarRings from "@/components/home/PillarRings";
import QuickAccessRow from "@/components/home/QuickAccessRow";
import CheckInBanner from "./CheckInBanner";

const createCaller = createCallerFactory(appRouter);

export default async function HomePage() {
  const ctx = await createTRPCContext();
  if (!ctx.user) {
    redirect("/login");
  }

  const caller = createCaller(ctx);
  const data = await caller.home.getDailyData();

  const { nsScore, todaySession, pillarRings, boltScore, hrvTrend, wearableConnected } = data;

  const trendIcon =
    hrvTrend === "up" ? "↑" : hrvTrend === "down" ? "↓" : "→";
  const trendColour =
    hrvTrend === "up"
      ? "text-[#1D9E75]"
      : hrvTrend === "down"
        ? "text-[#EF4444]"
        : "text-[#6B7280]";

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Morning check-in banner (client island — shown only if no stress metric today) */}
        <CheckInBanner />

        {/* NS Score card */}
        <NSScoreCard nsScore={nsScore} />

        {/* Three primary numbers row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-[#1D9E75]/10">
            <p className="text-xs text-[#085041]/50 uppercase tracking-wide mb-1">BOLT</p>
            <p className="text-2xl font-bold text-[#085041]">
              {boltScore !== null ? `${Math.round(boltScore)}s` : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-[#1D9E75]/10">
            <p className="text-xs text-[#085041]/50 uppercase tracking-wide mb-1">HRV Trend</p>
            <p className={`text-2xl font-bold ${trendColour}`}>
              {hrvTrend !== null ? trendIcon : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-[#1D9E75]/10">
            <p className="text-xs text-[#085041]/50 uppercase tracking-wide mb-1">Gate</p>
            <p className="text-sm font-semibold text-[#085041] capitalize leading-tight mt-1">
              {nsScore.sessionGate.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Today's session card */}
        {todaySession ? (
          <TodaySessionCard todaySession={todaySession} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-6 text-center">
            <p className="text-[#085041]/60 text-sm">
              No programme active yet.{" "}
              <a href="/onboarding" className="text-[#1D9E75] font-medium underline">
                Complete your assessment
              </a>{" "}
              to get started.
            </p>
          </div>
        )}

        {/* Pillar balance rings */}
        <PillarRings pillarRings={pillarRings} />

        {/* Quick access row */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-6">
          <p className="text-sm font-semibold text-[#085041] mb-4">Quick access</p>
          <QuickAccessRow nsScore={nsScore.score} />
        </div>

        {/* Wearable status row */}
        {wearableConnected ? (
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
            <span className="text-sm text-[#085041]/70">Wearable connected</span>
          </div>
        ) : (
          <div className="px-1">
            <a
              href="/settings/wearables"
              className="text-sm text-[#1D9E75] underline"
            >
              Connect a wearable for live NS Score
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
