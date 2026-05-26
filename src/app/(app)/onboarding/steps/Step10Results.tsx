"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { PillarWeights } from "@/lib/assessment/pillar-weights";
import type { SafetyGateResult } from "@/lib/safety/gates";

interface Step10ResultsProps {
  weights: PillarWeights;
  gates: SafetyGateResult;
  programSlug: string;
}

const PROGRAMME_INFO: Record<
  string,
  { name: string; expectations: string[] }
> = {
  "hrv-optimisation": {
    name: "HRV Optimisation",
    expectations: [
      "Daily resonance breathing to train your cardiac coherence",
      "Progressive CO2 tolerance exercises to improve biochemistry",
      "Evening protocols to boost overnight HRV recovery",
      "Measurable improvement in resting HRV within 4 weeks",
    ],
  },
  "anxiety-management": {
    name: "Anxiety Management",
    expectations: [
      "Fast-acting techniques for acute anxiety moments",
      "Systematic nervous system regulation training",
      "CO2 tolerance building to reduce panic sensitivity",
      "Evidence-based protocols adapted to your safety profile",
    ],
  },
  "cardiovascular-endurance": {
    name: "Cardiovascular Endurance",
    expectations: [
      "Intermittent hypoxic training for performance gains",
      "Nasal breathing drills to optimise oxygen use",
      "VO2 max improvement through progressive CO2 work",
      "Recovery breathing for faster post-training adaptation",
    ],
  },
  "sleep-improvement": {
    name: "Sleep Improvement",
    expectations: [
      "Evening wind-down breathing routines before bed",
      "Nervous system downregulation for faster sleep onset",
      "CO2 normalisation to reduce nighttime awakenings",
      "Morning protocols to set healthy circadian rhythms",
    ],
  },
};

const PILLAR_COLOURS = {
  biomechanics: "#1D9E75",
  biochemistry: "#085041",
  neurophysiology: "#2D6A4F",
};

const PILLAR_LABELS = {
  biomechanics: "Biomechanics",
  biochemistry: "Biochemistry",
  neurophysiology: "Neurophysiology",
};

const PILLAR_DESCRIPTIONS = {
  biomechanics: "How you breathe — mechanics and pattern",
  biochemistry: "What you breathe — CO2 & O2 balance",
  neurophysiology: "Nervous system regulation",
};

export function Step10Results({
  weights,
  programSlug,
}: Step10ResultsProps) {
  const router = useRouter();
  const programmeInfo = PROGRAMME_INFO[programSlug] ?? {
    name: programSlug,
    expectations: [
      "Personalised breathing exercises tailored to your profile",
      "Progressive difficulty tiers to build your practice",
      "Science-backed techniques across all three pillars",
      "Measurable improvement tracked over 4 weeks",
    ],
  };

  const pillars = (
    ["biomechanics", "biochemistry", "neurophysiology"] as const
  ).map((key) => ({
    key,
    label: PILLAR_LABELS[key],
    description: PILLAR_DESCRIPTIONS[key],
    value: Math.round(weights[key]),
    color: PILLAR_COLOURS[key],
  }));

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1D9E75] mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          Your breathing profile
        </h2>
        <p className="text-[#085041]/60 text-sm">
          Based on your assessment, here&apos;s how your three pillars break down.
        </p>
      </div>

      {/* Pillar bars */}
      <div className="bg-white rounded-2xl border border-[#1D9E75]/10 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-[#085041] mb-5">Pillar weights</h3>
        <div className="space-y-5">
          {pillars.map(({ key, label, description, value, color }, index) => (
            <div key={key}>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-semibold text-[#085041]">
                    {label}
                  </p>
                  <p className="text-xs text-[#085041]/60">{description}</p>
                </div>
                <span className="text-lg font-bold text-[#085041]">
                  {value}%
                </span>
              </div>
              <div className="h-3 bg-[#F5F3EE] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{
                    duration: 1,
                    delay: index * 0.2,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Programme */}
      <div className="bg-[#085041] rounded-2xl p-6 mb-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#1D9E75] mb-2">
          Your programme
        </p>
        <h3 className="text-xl font-bold mb-4">{programmeInfo.name}</h3>
        <ul className="space-y-2">
          {programmeInfo.expectations.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <svg
                className="w-4 h-4 text-[#1D9E75] mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-white/80">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => router.push("/home")}
        className="w-full bg-[#1D9E75] hover:bg-[#17896a] text-white font-semibold py-4 px-8 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2 text-lg"
      >
        Start my programme
      </button>
    </div>
  );
}
