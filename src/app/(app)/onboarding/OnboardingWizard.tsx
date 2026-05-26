"use client";

import { useState } from "react";
import type { PrimaryGoal, ExperienceLevel } from "@/lib/assessment/pillar-weights";
import type { PillarWeights } from "@/lib/assessment/pillar-weights";
import type { SafetyGateResult } from "@/lib/safety/gates";
import { Step0Welcome } from "./steps/Step0Welcome";
import { Step1Safety } from "./steps/Step1Safety";
import { Step2BoltTest } from "./steps/Step2BoltTest";
import { Step3BreathingRate } from "./steps/Step3BreathingRate";
import { Step4BreathingPattern } from "./steps/Step4BreathingPattern";
import { Step5Lifestyle } from "./steps/Step5Lifestyle";
import { Step6StressAnxiety } from "./steps/Step6StressAnxiety";
import { Step7Goals } from "./steps/Step7Goals";
import { Step8Wearable } from "./steps/Step8Wearable";
import { Step9Generating } from "./steps/Step9Generating";
import { Step10Results } from "./steps/Step10Results";

export interface WizardState {
  currentStep: number;
  boltScore: number;
  restingBreathRate: number;
  restingHR: number;
  breathingPattern: "chest" | "diaphragmatic" | "mixed";
  neckShoulderTension: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  anxietyFrequency: 1 | 2 | 3 | 4 | 5;
  primaryGoal: PrimaryGoal;
  experience: ExperienceLevel;
  dailyMinutes: 5 | 10 | 15 | 30;
  hasWearable: boolean;
  hasCardiovascularCondition: boolean;
  hasEpilepsy: boolean;
  hasRespiratoryCondition: boolean;
  isPregnant: boolean;
  hasPanicDisorder: boolean;
  bpAbove140: boolean;
}

const TOTAL_STEPS = 11; // 0–10

interface AssessmentResult {
  weights: PillarWeights;
  gates: SafetyGateResult;
  programSlug: string;
}

interface OnboardingWizardProps {
  userId: string;
  userEmail: string;
}

export function OnboardingWizard({ userId: _userId, userEmail: _userEmail }: OnboardingWizardProps) {
  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    boltScore: 0,
    restingBreathRate: 0,
    restingHR: 0,
    breathingPattern: "mixed",
    neckShoulderTension: 3,
    sleepQuality: 3,
    stressLevel: 3,
    anxietyFrequency: 3,
    primaryGoal: "stress_calm",
    experience: "beginner",
    dailyMinutes: 10,
    hasWearable: false,
    hasCardiovascularCondition: false,
    hasEpilepsy: false,
    hasRespiratoryCondition: false,
    isPregnant: false,
    hasPanicDisorder: false,
    bpAbove140: false,
  });

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function goTo(step: number) {
    setState((s) => ({ ...s, currentStep: step }));
  }
  function goNext() {
    setState((s) => ({ ...s, currentStep: s.currentStep + 1 }));
  }
  function goBack() {
    setState((s) => ({ ...s, currentStep: Math.max(0, s.currentStep - 1) }));
  }

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  const { currentStep } = state;

  // Steps 0 and 9/10 have no progress bar
  const showProgress = currentStep > 0 && currentStep < 9;

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      {/* Progress bar */}
      {showProgress && (
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-[#1D9E75]/10 px-4 py-3">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#085041]/60">
                Step {currentStep} of 8
              </span>
              <span className="text-xs font-medium text-[#1D9E75]">
                {Math.round(((currentStep) / 8) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-[#F5F3EE] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 8) * 100}%` }}
              />
            </div>
            {/* Step dots */}
            <div className="flex gap-1.5 mt-2 justify-center">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step <= currentStep
                      ? "bg-[#1D9E75] w-4"
                      : "bg-[#085041]/10 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-8">
        {currentStep === 0 && (
          <Step0Welcome onNext={goNext} />
        )}

        {currentStep === 1 && (
          <Step1Safety
            flags={{
              hasCardiovascularCondition: state.hasCardiovascularCondition,
              hasEpilepsy: state.hasEpilepsy,
              hasRespiratoryCondition: state.hasRespiratoryCondition,
              isPregnant: state.isPregnant,
              hasPanicDisorder: state.hasPanicDisorder,
              bpAbove140: state.bpAbove140,
            }}
            onChange={(flags) => update(flags)}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 2 && (
          <Step2BoltTest
            boltScore={state.boltScore}
            onChange={(boltScore) => update({ boltScore })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 3 && (
          <Step3BreathingRate
            restingBreathRate={state.restingBreathRate}
            restingHR={state.restingHR}
            onChange={(data) => update(data)}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 4 && (
          <Step4BreathingPattern
            breathingPattern={state.breathingPattern}
            onChange={(breathingPattern) => update({ breathingPattern })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 5 && (
          <Step5Lifestyle
            neckShoulderTension={state.neckShoulderTension}
            sleepQuality={state.sleepQuality}
            onChange={(data) => update(data)}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 6 && (
          <Step6StressAnxiety
            stressLevel={state.stressLevel}
            anxietyFrequency={state.anxietyFrequency}
            onChange={(data) => update(data)}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 7 && (
          <Step7Goals
            primaryGoal={state.primaryGoal}
            experience={state.experience}
            dailyMinutes={state.dailyMinutes}
            onChange={(data) => update(data)}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 8 && (
          <Step8Wearable
            hasWearable={state.hasWearable}
            onChange={(hasWearable) => update({ hasWearable })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 9 && (
          <Step9Generating
            state={state}
            onComplete={(r) => {
              setResult(r);
              goTo(10);
            }}
            onError={(err) => {
              setError(err);
              goTo(8);
            }}
          />
        )}

        {currentStep === 10 && result && (
          <Step10Results
            weights={result.weights}
            gates={result.gates}
            programSlug={result.programSlug}
          />
        )}

        {error && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
