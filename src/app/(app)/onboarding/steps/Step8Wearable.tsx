interface Step8WearableProps {
  hasWearable: boolean;
  onChange: (hasWearable: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step8Wearable({
  hasWearable,
  onChange,
  onNext,
  onBack,
}: Step8WearableProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#085041] mb-2">
          Wearable Device
        </h2>
        <p className="text-[#085041]/60 text-sm">
          Connecting a wearable lets us adapt your sessions in real time using
          your HRV, heart rate, and sleep data.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#1D9E75]/10 shadow-sm p-6 mb-6">
        <p className="text-sm font-medium text-[#085041] mb-6">
          Do you own an Oura Ring, WHOOP, Garmin, or Apple Watch?
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onChange(true)}
            className={`rounded-2xl border-2 p-5 text-center transition-all ${
              hasWearable
                ? "border-[#1D9E75] bg-[#1D9E75]/5 shadow-sm"
                : "border-[#085041]/10 bg-[#F5F3EE]/50 hover:border-[#1D9E75]/40"
            }`}
          >
            <div className="text-3xl mb-2">⌚</div>
            <p className="font-semibold text-[#085041] text-sm">Yes</p>
            <p className="text-xs text-[#085041]/60 mt-1">I have a wearable</p>
          </button>

          <button
            onClick={() => onChange(false)}
            className={`rounded-2xl border-2 p-5 text-center transition-all ${
              !hasWearable
                ? "border-[#1D9E75] bg-[#1D9E75]/5 shadow-sm"
                : "border-[#085041]/10 bg-[#F5F3EE]/50 hover:border-[#1D9E75]/40"
            }`}
          >
            <div className="text-3xl mb-2">📱</div>
            <p className="font-semibold text-[#085041] text-sm">No</p>
            <p className="text-xs text-[#085041]/60 mt-1">Using phone only</p>
          </button>
        </div>

        {hasWearable && (
          <div className="mt-4 bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-xl px-4 py-3">
            <p className="text-sm text-[#085041]">
              <span className="font-medium text-[#1D9E75]">Coming soon: </span>
              We&apos;ll connect your wearable after your programme is set up. Your
              live biometric data will unlock adaptive session adjustments.
            </p>
          </div>
        )}
      </div>

      {/* Supported devices */}
      <div className="bg-white rounded-xl border border-[#1D9E75]/10 shadow-sm p-4 mb-8">
        <p className="text-xs font-medium text-[#085041]/60 mb-3">
          Supported devices
        </p>
        <div className="flex flex-wrap gap-2">
          {["Oura Ring", "WHOOP", "Garmin", "Apple Watch"].map((device) => (
            <span
              key={device}
              className="text-xs bg-[#F5F3EE] text-[#085041]/70 px-3 py-1 rounded-full border border-[#085041]/10"
            >
              {device}
            </span>
          ))}
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
