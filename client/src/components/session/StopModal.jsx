export default function StopModal({ onContinue, onEnd }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-3xl mb-4">🫁</div>
        <h2 className="font-serif text-xl text-[#0D5C63] mb-3">It's okay to pause</h2>
        <p className="font-sans text-gray-600 text-sm leading-relaxed mb-6">
          It's important to listen to your body. Take a moment to breathe naturally.<br /><br />
          If you feel unwell, stop and rest. If symptoms persist, contact your healthcare provider.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="bg-[#0D5C63] text-white font-sans font-medium py-2.5 rounded-lg hover:bg-[#094a50] transition-colors"
          >
            Continue session
          </button>
          <button
            onClick={onEnd}
            className="text-gray-500 font-sans text-sm hover:text-gray-700"
          >
            End session for today
          </button>
        </div>
      </div>
    </div>
  )
}
