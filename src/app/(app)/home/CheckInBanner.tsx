"use client";

import { useState } from "react";

const EMOJIS: { emoji: string; label: string; value: number }[] = [
  { emoji: "😴", label: "Exhausted", value: 1 },
  { emoji: "😕", label: "Low", value: 2 },
  { emoji: "😐", label: "Neutral", value: 3 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😊", label: "Great", value: 5 },
];

export default function CheckInBanner() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSelect(value: number) {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      setSubmitted(true);
    } catch {
      // silently fail — non-critical path
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return null;

  return (
    <div className="bg-[#E1F5EE] border border-[#1D9E75]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <p className="text-sm font-medium text-[#085041] flex-1">
        How are you feeling this morning?
      </p>
      <div className="flex gap-2">
        {EMOJIS.map(({ emoji, label, value }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            disabled={submitting}
            aria-label={label}
            title={label}
            className="text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/60 transition-colors disabled:opacity-50"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
