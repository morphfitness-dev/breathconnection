type BreathingPattern = "chest" | "diaphragmatic" | "mixed";

interface Step4BreathingPatternProps {
  breathingPattern: BreathingPattern;
  onChange: (pattern: BreathingPattern) => void;
  onNext: () => void;
  onBack: () => void;
}

const PATTERNS: Array<{
  value: BreathingPattern;
  label: string;
  emoji: string;
  description: string;
}> = [
  {
    value: "chest",
    label: "Chest breathing",
    emoji: "⬆️",
    description:
      "Your shoulders rise and chest expands when you inhale. Common with stress — limits diaphragm function and can lead to over-breathing.",
  },
  {
    value: "diaphragmatic",
    label: "Belly breathing",
    emoji: "🫁",
    description:
      "Your belly expands when you inhale while your chest stays relatively still. The most efficient pattern — maximises gas exchange and activates the parasympathetic nervous system.",
  },
  {
    value: "mixed",
    label: "Mixed",
    emoji: "↕️",
    description:
      "Some belly movement but chest involvement too. Common for most people — there's room to improve efficiency.",
  },
];

export function Step4BreathingPattern({
  breathingPattern,
  onChange,
  onNext,
  onBack,
}: Step4BreathingPatternProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          Breathing Pattern
        </h2>
        <p className="text-[#085041]/60 text-sm">
          Place one hand on your chest and one on your belly. Take three natural
          breaths. Which best describes what happens?
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {PATTERNS.map(({ value, label, emoji, description }) => {
          const selected = breathingPattern === value;
          return (
            <button
              key={value}
              onClick={() => onChange(value)}
              className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                selected
                  ? "border-[#1D9E75] bg-[#1D9E75]/5 shadow-sm"
                  : "border-[#085041]/10 bg-white hover:border-[#1D9E75]/40 hover:bg-[#1D9E75]/2"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 flex-shrink-0">{emoji}</span>
                <div>
                  <p className="font-semibold text-[#085041] mb-1">{label}</p>
                  <p className="text-sm text-[#085041]/60">{description}</p>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      selected
                        ? "border-[#1D9E75] bg-[#1D9E75]"
                        : "border-[#085041]/30"
                    }`}
                  >
                    {selected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
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
