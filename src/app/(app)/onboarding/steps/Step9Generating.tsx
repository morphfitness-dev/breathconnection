"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { WizardState } from "../OnboardingWizard";
import type { PillarWeights } from "@/lib/assessment/pillar-weights";
import type { SafetyGateResult } from "@/lib/safety/gates";

interface Step9GeneratingProps {
  state: WizardState;
  onComplete: (result: {
    weights: PillarWeights;
    gates: SafetyGateResult;
    programSlug: string;
  }) => void;
  onError: (err: string) => void;
}

const PHASES = [
  "Analysing your breathing profile",
  "Calculating pillar weights",
  "Building your programme",
];

export function Step9Generating({
  state,
  onComplete,
  onError,
}: Step9GeneratingProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const completeMutation = trpc.assessment.complete.useMutation();

  useEffect(() => {
    // Progress through phases
    const t1 = setTimeout(() => setPhaseIndex(1), 1200);
    const t2 = setTimeout(() => setPhaseIndex(2), 2400);

    // Call the mutation
    completeMutation.mutate(
      {
        boltScore: state.boltScore,
        restingBreathRate: state.restingBreathRate,
        restingHR: state.restingHR,
        breathingPattern: state.breathingPattern,
        neckShoulderTension: state.neckShoulderTension,
        sleepQuality: state.sleepQuality,
        stressLevel: state.stressLevel,
        anxietyFrequency: state.anxietyFrequency,
        primaryGoal: state.primaryGoal,
        experience: state.experience,
        dailyMinutes: state.dailyMinutes,
        hasWearable: state.hasWearable,
        hasCardiovascularCondition: state.hasCardiovascularCondition,
        hasEpilepsy: state.hasEpilepsy,
        hasRespiratoryCondition: state.hasRespiratoryCondition,
        isPregnant: state.isPregnant,
        hasPanicDisorder: state.hasPanicDisorder,
        bpAbove140: state.bpAbove140,
      },
      {
        onSuccess: (data) => {
          // Wait at least 3s for the animation before proceeding
          setTimeout(
            () => {
              onComplete({
                weights: data.weights,
                gates: data.gates,
                programSlug: data.programSlug,
              });
            },
            3000
          );
        },
        onError: (err) => {
          onError(err.message);
        },
      }
    );

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
      {/* Animated logo */}
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#1D9E75]/20 flex items-center justify-center animate-pulse">
            <div className="w-10 h-10 rounded-full bg-[#1D9E75] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
          <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75] absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1" />
        </div>
        <div
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: "4s", animationDirection: "reverse" }}
        >
          <div className="w-2 h-2 rounded-full bg-[#085041] absolute bottom-0 right-0" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#085041] mb-4">
        Analysing your results
      </h2>

      <div className="space-y-3 w-full max-w-sm">
        {PHASES.map((phase, i) => (
          <div
            key={phase}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500 ${
              i <= phaseIndex
                ? "bg-[#1D9E75]/10 text-[#085041]"
                : "bg-[#F5F3EE] text-[#085041]/40"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                i < phaseIndex
                  ? "bg-[#1D9E75]"
                  : i === phaseIndex
                  ? "bg-[#1D9E75]/20 animate-pulse"
                  : "bg-[#085041]/10"
              }`}
            >
              {i < phaseIndex && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">{phase}</span>
          </div>
        ))}
      </div>

      {completeMutation.isError && (
        <div className="mt-6 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 max-w-sm">
          Something went wrong. Please try again.
        </div>
      )}
    </div>
  );
}
