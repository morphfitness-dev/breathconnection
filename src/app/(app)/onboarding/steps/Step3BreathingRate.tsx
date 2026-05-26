"use client";

import { useState } from "react";

interface Step3BreathingRateProps {
  restingBreathRate: number;
  restingHR: number;
  onChange: (data: { restingBreathRate?: number; restingHR?: number }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3BreathingRate({
  restingBreathRate,
  restingHR,
  onChange,
  onNext,
  onBack,
}: Step3BreathingRateProps) {
  const [breathCount, setBreathCount] = useState(
    restingBreathRate > 0 ? String(Math.round(restingBreathRate / 2)) : ""
  );
  const [hrInput, setHrInput] = useState(
    restingHR > 0 && restingHR !== 70 ? String(restingHR) : ""
  );
  const [hrSkipped, setHrSkipped] = useState(restingHR === 70 && restingBreathRate > 0);

  function handleBreathCountChange(v: string) {
    setBreathCount(v);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) {
      onChange({ restingBreathRate: n * 2 });
    }
  }

  function handleHRChange(v: string) {
    setHrInput(v);
    setHrSkipped(false);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) {
      onChange({ restingHR: n });
    }
  }

  function handleSkipHR() {
    setHrSkipped(true);
    setHrInput("");
    onChange({ restingHR: 70 });
  }

  const canProceed = restingBreathRate > 0 && (restingHR > 0 || hrSkipped);

  const bpm = restingBreathRate > 0 ? restingBreathRate : null;
  const bpmLabel =
    bpm === null
      ? null
      : bpm <= 10
      ? "Very slow — excellent control"
      : bpm <= 14
      ? "Healthy range"
      : bpm <= 16
      ? "Slightly elevated"
      : bpm <= 20
      ? "Elevated — common with stress"
      : "High — we'll work on reducing this";

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          Resting Breathing Rate
        </h2>
        <p className="text-[#085041]/60 text-sm">
          How fast you breathe at rest is a direct measure of your biochemistry
          pillar. The optimal rate is 6–10 breaths per minute.
        </p>
      </div>

      {/* Breathing rate */}
      <div className="bg-white rounded-2xl border border-[#1D9E75]/10 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-[#085041] mb-3">
          Count your breaths
        </h3>
        <p className="text-sm text-[#085041]/70 mb-5">
          Sit quietly, relax, and count how many breaths you take in{" "}
          <strong>30 seconds</strong>. Each inhale + exhale = 1 breath. Enter
          that number below — we&apos;ll multiply by 2 for your breaths per minute.
        </p>

        <div className="flex items-end gap-4">
          <div>
            <label
              htmlFor="breathCount"
              className="block text-xs font-medium text-[#085041]/60 mb-1.5"
            >
              Breaths in 30 seconds
            </label>
            <input
              id="breathCount"
              type="number"
              min={1}
              max={30}
              value={breathCount}
              onChange={(e) => handleBreathCountChange(e.target.value)}
              className="w-24 px-3 py-2.5 rounded-xl border border-[#1D9E75]/20 text-[#085041] text-center font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              placeholder="8"
            />
          </div>
          {bpm && (
            <div className="pb-1">
              <p className="text-2xl font-bold text-[#1D9E75]">= {bpm} bpm</p>
              <p className="text-xs text-[#085041]/60 mt-0.5">{bpmLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* Resting HR */}
      <div className="bg-white rounded-2xl border border-[#1D9E75]/10 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-[#085041]">
              Resting Heart Rate
            </h3>
            <p className="text-xs text-[#085041]/60 mt-0.5">Optional</p>
          </div>
          {!hrSkipped && (
            <button
              onClick={handleSkipHR}
              className="text-xs text-[#1D9E75] hover:underline font-medium"
            >
              Skip (use default 70 bpm)
            </button>
          )}
        </div>

        {hrSkipped ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#085041]/70">
              Using default: <strong>70 bpm</strong>
            </p>
            <button
              onClick={() => {
                setHrSkipped(false);
                onChange({ restingHR: 0 });
              }}
              className="text-xs text-[#1D9E75] hover:underline"
            >
              Enter my own
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#085041]/70 mb-4">
              Check your wearable, a fitness app, or take your pulse for 30
              seconds and double it.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={30}
                max={200}
                value={hrInput}
                onChange={(e) => handleHRChange(e.target.value)}
                className="w-24 px-3 py-2.5 rounded-xl border border-[#1D9E75]/20 text-[#085041] text-center font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                placeholder="70"
              />
              <span className="text-sm text-[#085041]/60">bpm</span>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-[#085041]/20 text-[#085041] font-medium hover:bg-[#085041]/5 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-[#1D9E75] hover:bg-[#17896a] text-white font-semibold py-3 px-8 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
