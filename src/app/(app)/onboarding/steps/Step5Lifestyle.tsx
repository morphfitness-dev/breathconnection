type Scale = 1 | 2 | 3 | 4 | 5;

interface Step5LifestyleProps {
  neckShoulderTension: Scale;
  sleepQuality: Scale;
  onChange: (data: {
    neckShoulderTension?: Scale;
    sleepQuality?: Scale;
  }) => void;
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

      {/* Dot indicators */}
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

export function Step5Lifestyle({
  neckShoulderTension,
  sleepQuality,
  onChange,
  onNext,
  onBack,
}: Step5LifestyleProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          Lifestyle Factors
        </h2>
        <p className="text-[#085041]/60 text-sm">
          These factors directly influence your biomechanics and neurophysiology
          pillars.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <ScaleSlider
          label="Neck & shoulder tension"
          value={neckShoulderTension}
          onChange={(v) => onChange({ neckShoulderTension: v })}
          lowLabel="No tension"
          highLabel="Constant tension"
        />
        <ScaleSlider
          label="Sleep quality"
          value={sleepQuality}
          onChange={(v) => onChange({ sleepQuality: v })}
          lowLabel="Excellent"
          highLabel="Very poor"
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
