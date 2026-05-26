"use client";

import { motion } from "framer-motion";

interface CoherenceSession {
  date: string;
  achieved: boolean;
}

interface Props {
  sessions: CoherenceSession[];
  currentStreak: number;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0] as string);
  }
  return days;
}

export default function CoherenceCalendar({ sessions, currentStreak }: Props) {
  const last30 = getLast30Days();

  const sessionMap = new Map<string, boolean>(
    sessions.map((s) => [s.date, s.achieved])
  );

  // Build 5 rows of 6 days each (30 days)
  const weeks: string[][] = [];
  for (let i = 0; i < last30.length; i += 6) {
    weeks.push(last30.slice(i, i + 6));
  }

  return (
    <div>
      {/* Streak counter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl font-bold text-[#1D9E75]">
          {currentStreak}
        </span>
        <span className="text-sm text-[#085041]/70">
          {currentStreak === 1 ? "day streak" : "day streak"}
        </span>
        {currentStreak >= 7 && (
          <span className="ml-1 text-xs font-semibold bg-[#1D9E75]/10 text-[#1D9E75] px-2 py-0.5 rounded-full">
            On fire!
          </span>
        )}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1.5">
            {week.map((day, di) => {
              const hasSession = sessionMap.has(day);
              const achieved = sessionMap.get(day) ?? false;

              let bg = "bg-[#F3F4F6]"; // no session
              if (hasSession && achieved) bg = "bg-[#1D9E75]";
              else if (hasSession && !achieved) bg = "bg-[#9CA3AF]";

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (wi * 6 + di) * 0.02 }}
                  title={day}
                  className={`w-8 h-8 rounded-full ${bg} flex-shrink-0`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#1D9E75]" />
          <span className="text-xs text-[#085041]/60">Coherence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#9CA3AF]" />
          <span className="text-xs text-[#085041]/60">Session</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#F3F4F6]" />
          <span className="text-xs text-[#085041]/60">Rest</span>
        </div>
      </div>
    </div>
  );
}
