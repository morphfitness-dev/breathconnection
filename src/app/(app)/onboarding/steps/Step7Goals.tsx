import type { PrimaryGoal, ExperienceLevel } from "@/lib/assessment/pillar-weights";

type DailyMinutes = 5 | 10 | 15 | 30;

interface Step7GoalsProps {
  primaryGoal: PrimaryGoal;
  experience: ExperienceLevel;
  dailyMinutes: DailyMinutes;
  onChange: (data: {
    primaryGoal?: PrimaryGoal;
    experience?: ExperienceLevel;
    dailyMinutes?: DailyMinutes;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const GOALS: Array<{
  value: PrimaryGoal;
  label: string;
  description: string;
  icon: string;
  programme: string;
}> = [
  {
    value: "stress_calm",
    label: "Stress & Calm",
    description:
      "Reduce daily stress and build a calmer baseline through HRV-targeted breathwork.",
    icon: "🌊",
    programme: "HRV Optimisation",
  },
  {
    value: "anxiety_relief",
    label: "Anxiety Relief",
    description:
      "Regulate your nervous system and reduce anxiety with evidence-based techniques.",
    icon: "🧘",
    programme: "Anxiety Management",
  },
  {
    value: "athletic_performance",
    label: "Athletic Performance",
    description:
      "Boost endurance, recovery, and VO2 max through CO2 tolerance training.",
    icon: "⚡",
    programme: "Cardiovascular Endurance",
  },
  {
    value: "sleep_improvement",
    label: "Better Sleep",
    description:
      "Reset circadian rhythms and improve sleep onset with evening wind-down protocols.",
    icon: "🌙",
    programme: "Sleep Improvement",
  },
];

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceLevel; label: string; description: string }> =
  [
    {
      value: "beginner",
      label: "Beginner",
      description: "I'm new to intentional breathwork",
    },
    {
      value: "some",
      label: "Some experience",
      description: "I've tried a few techniques before",
    },
    {
      value: "regular",
      label: "Regular practice",
      description: "I practise breathing exercises regularly",
    },
    {
      value: "advanced",
      label: "Advanced",
      description: "I have years of dedicated practice",
    },
  ];

const DAILY_MINUTES_OPTIONS: Array<{ value: DailyMinutes; label: string }> = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
];

export function Step7Goals({
  primaryGoal,
  experience,
  dailyMinutes,
  onChange,
  onNext,
  onBack,
}: Step7GoalsProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          Your Goals
        </h2>
        <p className="text-[#085041]/60 text-sm">
          Tell us what you want to achieve — this shapes your programme and the
          exercises you receive.
        </p>
      </div>

      {/* Primary Goal */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#085041]/70 uppercase tracking-wider mb-4">
          Primary goal
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {GOALS.map(({ value, label, description, icon, programme }) => {
            const selected = primaryGoal === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ primaryGoal: value })}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  selected
                    ? "border-[#1D9E75] bg-[#1D9E75]/5 shadow-sm"
                    : "border-[#085041]/10 bg-white hover:border-[#1D9E75]/40"
                }`}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <p className="font-semibold text-[#085041] text-sm mb-1">
                  {label}
                </p>
                <p className="text-xs text-[#085041]/60">{description}</p>
                <p className="text-xs text-[#1D9E75] font-medium mt-2">
                  {programme}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Experience level */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#085041]/70 uppercase tracking-wider mb-4">
          Breathwork experience
        </h3>
        <div className="space-y-2">
          {EXPERIENCE_OPTIONS.map(({ value, label, description }) => {
            const selected = experience === value;
            return (
              <label
                key={value}
                className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                  selected
                    ? "border-[#1D9E75] bg-[#1D9E75]/5"
                    : "border-[#085041]/10 bg-white hover:border-[#1D9E75]/30"
                }`}
              >
                <input
                  type="radio"
                  name="experience"
                  value={value}
                  checked={selected}
                  onChange={() => onChange({ experience: value })}
                  className="w-4 h-4 accent-[#1D9E75]"
                />
                <div>
                  <p className="text-sm font-medium text-[#085041]">{label}</p>
                  <p className="text-xs text-[#085041]/60">{description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Daily minutes */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#085041]/70 uppercase tracking-wider mb-4">
          Time available daily
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {DAILY_MINUTES_OPTIONS.map(({ value, label }) => {
            const selected = dailyMinutes === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ dailyMinutes: value })}
                className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  selected
                    ? "border-[#1D9E75] bg-[#1D9E75] text-white"
                    : "border-[#085041]/10 bg-white text-[#085041] hover:border-[#1D9E75]/40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
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
          className="bg-[#1D9E75] hover:bg-[#17896a] text-white font-semibold py-3 px-8 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2"
        >
          Next
        </button>
      </div>
    </div>
  );
}
