import { trpc } from "@/lib/trpc/client";

interface SafetyFlags {
  hasCardiovascularCondition: boolean;
  hasEpilepsy: boolean;
  hasRespiratoryCondition: boolean;
  isPregnant: boolean;
  hasPanicDisorder: boolean;
  bpAbove140: boolean;
}

interface Step1SafetyProps {
  flags: SafetyFlags;
  onChange: (flags: Partial<SafetyFlags>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SAFETY_QUESTIONS: Array<{
  key: keyof SafetyFlags;
  question: string;
  notice: string;
}> = [
  {
    key: "hasCardiovascularCondition",
    question:
      "Do you have a diagnosed heart condition, arrhythmia, or have you had a heart attack in the last 12 months?",
    notice:
      "We'll adapt your programme to keep you safe. Breath holds and high-intensity exercises will be avoided.",
  },
  {
    key: "hasEpilepsy",
    question: "Do you have epilepsy or a history of seizures?",
    notice:
      "We'll adapt your programme to keep you safe. Hyperventilation techniques will be excluded from your plan.",
  },
  {
    key: "hasRespiratoryCondition",
    question:
      "Do you have a diagnosed respiratory condition such as COPD, emphysema, or severe asthma?",
    notice:
      "We'll adapt your programme to keep you safe. High-altitude and IHT protocols won't be included.",
  },
  {
    key: "isPregnant",
    question: "Are you currently pregnant?",
    notice:
      "We'll adapt your programme to keep you safe. Only gentle, restorative breathwork will be recommended.",
  },
  {
    key: "hasPanicDisorder",
    question: "Have you been diagnosed with panic disorder?",
    notice:
      "We'll adapt your programme to keep you safe. Exercises are designed to build confidence gradually.",
  },
  {
    key: "bpAbove140",
    question:
      "Has your blood pressure been measured above 140/90 mmHg in the last 6 months?",
    notice:
      "We'll adapt your programme to keep you safe. Please share your data with your healthcare provider.",
  },
];

export function Step1Safety({
  flags,
  onChange,
  onNext,
  onBack,
}: Step1SafetyProps) {
  const updateSafetyFlags = trpc.assessment.updateSafetyFlags.useMutation();

  async function handleNext() {
    await updateSafetyFlags.mutateAsync(flags).catch(() => {
      // Non-blocking — flags are also sent with the complete mutation
    });
    onNext();
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          Safety Screening
        </h2>
        <p className="text-[#085041]/60 text-sm">
          These questions help us tailor your programme. Any &lsquo;Yes&rsquo; answer won&rsquo;t
          stop you from continuing — we&rsquo;ll simply adapt your exercises.
        </p>
      </div>

      <div className="space-y-6">
        {SAFETY_QUESTIONS.map(({ key, question, notice }) => (
          <div key={key}>
            <div className="bg-white rounded-xl border border-[#1D9E75]/10 p-5 shadow-sm">
              <p className="text-sm font-medium text-[#085041] mb-4">
                {question}
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name={key}
                    value="no"
                    checked={!flags[key]}
                    onChange={() => onChange({ [key]: false })}
                    className="w-4 h-4 accent-[#1D9E75]"
                  />
                  <span className="text-sm text-[#085041] group-hover:text-[#1D9E75] transition-colors">
                    No
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name={key}
                    value="yes"
                    checked={flags[key]}
                    onChange={() => onChange({ [key]: true })}
                    className="w-4 h-4 accent-[#1D9E75]"
                  />
                  <span className="text-sm text-[#085041] group-hover:text-[#1D9E75] transition-colors">
                    Yes
                  </span>
                </label>
              </div>
            </div>

            {flags[key] && (
              <div className="mt-2 bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-xl px-4 py-3">
                <p className="text-sm text-[#085041]">
                  <span className="font-medium text-[#1D9E75]">Note: </span>
                  {notice}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-[#085041]/20 text-[#085041] font-medium hover:bg-[#085041]/5 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={updateSafetyFlags.isPending}
          className="bg-[#1D9E75] hover:bg-[#17896a] text-white font-semibold py-3 px-8 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2 disabled:opacity-60"
        >
          {updateSafetyFlags.isPending ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
}
