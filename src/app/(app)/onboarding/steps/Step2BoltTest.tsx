"use client";

import { useState, useEffect, useRef } from "react";

interface Step2BoltTestProps {
  boltScore: number;
  onChange: (boltScore: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function getBoltInterpretation(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score < 10) {
    return {
      label: "Very Low",
      color: "text-red-600",
      description:
        "Significant breathing dysfunction. Your programme will focus heavily on restoring healthy CO2 tolerance.",
    };
  }
  if (score < 20) {
    return {
      label: "Below Average",
      color: "text-amber-600",
      description:
        "Some breathing dysfunction present. Your programme will target CO2 tolerance improvement.",
    };
  }
  if (score < 30) {
    return {
      label: "Good",
      color: "text-[#1D9E75]",
      description:
        "Healthy breathing. Your programme will build on this strong foundation.",
    };
  }
  return {
    label: "Optimal",
    color: "text-[#085041]",
    description:
      "Excellent CO2 tolerance. Your programme can include advanced performance techniques.",
  };
}

export function Step2BoltTest({
  boltScore,
  onChange,
  onNext,
  onBack,
}: Step2BoltTestProps) {
  const [timerState, setTimerState] = useState<"idle" | "running" | "done">(
    "idle"
  );
  const [elapsed, setElapsed] = useState(0);
  const [manualInput, setManualInput] = useState(
    boltScore > 0 ? String(boltScore) : ""
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startTimer() {
    setTimerState("running");
    setElapsed(0);
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 100);
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("done");
    const seconds = Math.floor((Date.now() - startRef.current) / 1000);
    setElapsed(seconds);
    onChange(seconds);
    setManualInput(String(seconds));
  }

  function resetTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("idle");
    setElapsed(0);
  }

  function handleManualInput(v: string) {
    setManualInput(v);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) {
      onChange(n);
    }
  }

  const displayScore = boltScore > 0 ? boltScore : null;
  const interpretation = displayScore
    ? getBoltInterpretation(displayScore)
    : null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          BOLT Test
        </h2>
        <p className="text-[#085041]/60 text-sm">
          The Body Oxygen Level Test (BOLT) measures your CO2 tolerance — a key
          indicator of breathing efficiency.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#1D9E75]/10 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-[#085041] mb-4">How to do it:</h3>
        <ol className="space-y-3">
          {[
            "Sit comfortably and breathe normally for a minute.",
            "Take a gentle, natural exhale (don't force it).",
            "Pinch your nose and start the timer.",
            "Wait until you feel the first definite urge to breathe — not the maximum hold.",
            "Release your nose and stop the timer. Breathe normally.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-[#085041]/80">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] font-bold text-xs flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Timer */}
      <div className="bg-white rounded-2xl border border-[#1D9E75]/10 shadow-sm p-6 mb-6 text-center">
        <div className="text-6xl font-mono font-bold text-[#085041] mb-6 tabular-nums">
          {timerState === "idle" ? "0" : elapsed}s
        </div>

        {timerState === "idle" && (
          <button
            onClick={startTimer}
            className="bg-[#1D9E75] hover:bg-[#17896a] text-white font-semibold py-4 px-10 rounded-xl transition-colors text-lg"
          >
            Start timer
          </button>
        )}
        {timerState === "running" && (
          <button
            onClick={stopTimer}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-10 rounded-xl transition-colors text-lg animate-pulse"
          >
            Stop — first urge felt
          </button>
        )}
        {timerState === "done" && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetTimer}
              className="px-6 py-3 rounded-xl border border-[#085041]/20 text-[#085041] font-medium hover:bg-[#085041]/5 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Manual fallback */}
      <div className="bg-white rounded-xl border border-[#1D9E75]/10 shadow-sm p-4 mb-6">
        <p className="text-xs font-medium text-[#085041]/60 mb-2">
          Or enter your score manually:
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={120}
            value={manualInput}
            onChange={(e) => handleManualInput(e.target.value)}
            className="w-24 px-3 py-2 rounded-lg border border-[#1D9E75]/20 text-[#085041] text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
            placeholder="0"
          />
          <span className="text-sm text-[#085041]/60">seconds</span>
        </div>
      </div>

      {/* Interpretation */}
      {interpretation && displayScore && (
        <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[#085041]">
              Your score: {displayScore}s —
            </span>
            <span className={`text-sm font-bold ${interpretation.color}`}>
              {interpretation.label}
            </span>
          </div>
          <p className="text-sm text-[#085041]/70">{interpretation.description}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-[#085041]/20 text-[#085041] font-medium hover:bg-[#085041]/5 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={boltScore <= 0}
          className="bg-[#1D9E75] hover:bg-[#17896a] text-white font-semibold py-3 px-8 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
