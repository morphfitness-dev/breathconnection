type Scale = 1 | 2 | 3 | 4 | 5;

interface Step6StressAnxietyProps {
  stressLevel: Scale;
  anxietyFrequency: Scale;
  onChange: (data: { stressLevel?: Scale; anxietyFrequency?: Scale }) => void;
  onNext: () => void;
  onBack: () => void;
}

function ScaleSlider({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: Scale;
  onChange: (v: Scale) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#1D9E75]/10 shadow-sm p-6">
      <h3 className="font-semibold text-[#085041] mb-5">{label}</h3>
      <div className="space-y-3">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) as Scale)}
          className="w-full accent-[#1D9E75] h-2 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-[#085041]/60">
          <span>{lowLabel}</span>
          <span className="font-bold text-[#085041] text-base">{value}/5</span>
          <span>{highLabel}</span>
        </div>
      </div>

      <div className="flex justify-between mt-2">
        {([1, 2, 3, 4, 5] as Scale[]).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
              value === n
                ? "bg-[#1D9E75] text-white shadow-sm"
                : "bg-[#F5F3EE] text-[#085041]/50 hover:bg-[#1D9E75]/10"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Step6StressAnxiety({
  stressLevel,
  anxietyFrequency,
  onChange,
  onNext,
  onBack,
}: Step6StressAnxietyProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          Stress & Anxiety
        </h2>
        <p className="text-[#085041]/60 text-sm">
          Chronic stress and anxiety have profound effects on breathing patterns
          and your nervous system.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <ScaleSlider
          label="Typical stress level"
          value={stressLevel}
          onChange={(v) => onChange({ stressLevel: v })}
          lowLabel="Very calm"
          highLabel="Highly stressed"
        />
        <ScaleSlider
          label="Anxiety frequency"
          value={anxietyFrequency}
          onChange={(v) => onChange({ anxietyFrequency: v })}
          lowLabel="Rarely anxious"
          highLabel="Constantly anxious"
        />
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
