interface Step0WelcomeProps {
  onNext: () => void;
}

export function Step0Welcome({ onNext }: Step0WelcomeProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto">
      {/* Brand icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1D9E75] mb-6">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-[#085041] mb-4">
        Welcome to The Breath Connection
      </h1>

      <p className="text-[#085041]/70 text-base leading-relaxed mb-8">
        Your breathing shapes every aspect of your health — from your stress
        response and sleep quality to your athletic performance. This assessment
        analyses your breathing across three scientifically validated pillars:{" "}
        <span className="font-semibold text-[#1D9E75]">Biomechanics</span>{" "}
        (how you breathe),{" "}
        <span className="font-semibold text-[#1D9E75]">Biochemistry</span>{" "}
        (what you breathe), and{" "}
        <span className="font-semibold text-[#1D9E75]">Neurophysiology</span>{" "}
        (how breathing affects your nervous system). The results will create a
        personalised programme built around your unique profile. It takes about
        8 minutes.
      </p>

      <div className="flex gap-4 w-full max-w-xs flex-col">
        <div className="flex items-center gap-3 text-left bg-white rounded-xl p-4 shadow-sm border border-[#1D9E75]/10">
          <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[#1D9E75]">1</span>
          </div>
          <span className="text-sm text-[#085041]">Safety screening</span>
        </div>
        <div className="flex items-center gap-3 text-left bg-white rounded-xl p-4 shadow-sm border border-[#1D9E75]/10">
          <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[#1D9E75]">2</span>
          </div>
          <span className="text-sm text-[#085041]">Physiological tests</span>
        </div>
        <div className="flex items-center gap-3 text-left bg-white rounded-xl p-4 shadow-sm border border-[#1D9E75]/10">
          <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[#1D9E75]">3</span>
          </div>
          <span className="text-sm text-[#085041]">
            Personalised programme
          </span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="mt-10 bg-[#1D9E75] hover:bg-[#17896a] text-white font-semibold py-4 px-10 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2 text-lg"
      >
        Begin assessment
      </button>
    </div>
  );
}
