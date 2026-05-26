"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NSScoreOutput, NSScoreTier } from "@/lib/engine/ns-score";

interface NSScoreCardProps {
  nsScore: NSScoreOutput;
}

const TIER_COLOURS: Record<NSScoreTier, string> = {
  exceptional: "#1D9E75",
  good: "#5DCAA5",
  moderate: "#F59E0B",
  low: "#F97316",
  very_low: "#EF4444",
};

const TIER_LABELS: Record<NSScoreTier, string> = {
  exceptional: "Exceptional",
  good: "Good",
  moderate: "Moderate",
  low: "Low",
  very_low: "Very Low",
};

function AnimatedNumber({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplayed(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [target]);

  return <>{displayed}</>;
}

export default function NSScoreCard({ nsScore }: NSScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colour = TIER_COLOURS[nsScore.tier];

  const signals = [
    nsScore.score > 65 ? "HRV is above baseline" : "HRV is below baseline",
    "Sleep quality factored in",
    "Subjective stress included",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-[#085041]/60 uppercase tracking-wide">
            NS Score
          </p>
          <p className="text-xs text-[#085041]/40 mt-0.5">
            {TIER_LABELS[nsScore.tier]}
          </p>
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-6xl font-bold tabular-nums"
          style={{ color: colour }}
        >
          <AnimatedNumber target={nsScore.score} />
        </motion.div>
      </div>

      <p className="text-sm text-[#1C1C1A]/70 leading-relaxed mb-4">
        {nsScore.explanation}
      </p>

      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="text-sm font-medium text-[#1D9E75] flex items-center gap-1 hover:text-[#085041] transition-colors"
        aria-expanded={expanded}
      >
        Why today?
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="accordion"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ul className="mt-3 space-y-1.5">
              {signals.map((signal) => (
                <li key={signal} className="flex items-start gap-2 text-sm text-[#085041]/70">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colour }} />
                  {signal}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
