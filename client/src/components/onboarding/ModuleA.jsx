function getBoltLabel(val) {
  if (val === null || val === '') return null
  const n = Number(val)
  if (n < 10) return { text: 'Very low — significant room for improvement', color: 'text-[#E8A87C]' }
  if (n <= 20) return { text: 'Below average', color: 'text-[#E8A87C]' }
  if (n <= 30) return { text: 'Average — a solid foundation', color: 'text-[#0D5C63]' }
  return { text: 'Good — well above average', color: 'text-green-600' }
}

export default function ModuleA({ value, onChange, onNext }) {
  const label = getBoltLabel(value)
  const hasValue = value !== null && value !== '' && !isNaN(Number(value))

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="font-serif text-3xl text-[#0D5C63] mb-3">Your BOLT Score</h2>
      <p className="font-sans text-gray-600 mb-2 text-sm leading-relaxed">
        The Body Oxygen Level Test (BOLT) measures your breathing efficiency and CO₂ tolerance.
      </p>
      <ol className="font-sans text-sm text-gray-600 mb-6 space-y-1 list-decimal list-inside">
        <li>Breathe in normally, then breathe out normally through your nose.</li>
        <li>Pinch your nose and start a timer.</li>
        <li>Hold until you feel the <strong>first definite urge</strong> to breathe (not until you gasp).</li>
        <li>Enter the number of seconds below.</li>
      </ol>

      <div className="flex flex-col items-center mb-6">
        <input
          type="number"
          min="0"
          max="120"
          value={value ?? ''}
          onChange={e => {
            const v = e.target.value
            onChange(v === '' ? null : Number(v))
          }}
          placeholder="0"
          className="text-center font-sans font-bold text-gray-800 border-2 border-gray-200 rounded-xl focus:border-[#0D5C63] focus:outline-none transition-colors"
          style={{ fontSize: '5rem', width: '140px', lineHeight: 1.1, paddingTop: '8px', paddingBottom: '8px' }}
        />
        <span className="font-sans text-gray-400 text-sm mt-1">seconds</span>
        {label && (
          <p className={`font-sans text-sm font-medium mt-3 ${label.color}`}>{label.text}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasValue}
        className="w-full bg-[#0D5C63] text-white font-sans font-medium py-3 px-6 rounded-full hover:bg-[#094a50] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}
