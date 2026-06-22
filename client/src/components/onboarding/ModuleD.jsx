import PillCheckbox from './PillCheckbox'

const GOALS = [
  { id: 'stress_anxiety', label: 'Reduce stress and anxiety' },
  { id: 'sleep', label: 'Improve sleep' },
  { id: 'athletic_performance', label: 'Improve athletic or physical performance' },
  { id: 'focus', label: 'Improve focus and mental clarity' },
  { id: 'health_condition', label: 'Manage a health condition (e.g. hypertension, asthma)' },
  { id: 'resilience', label: 'Build general resilience and wellbeing' },
  { id: 'understanding', label: 'Understand my breathing and nervous system' },
]

export default function ModuleD({ selected, onChange, onNext, onBack }) {
  const MAX = 3

  function toggle(id) {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id))
    } else if (selected.length < MAX) {
      onChange([...selected, id])
    }
  }

  const canProceed = selected.length > 0

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="font-serif text-3xl text-[#0D5C63] mb-2">Your Goals</h2>
      <p className="font-sans text-gray-600 mb-1 text-sm">
        What would you most like to achieve? Select up to 3.
      </p>
      <p className="font-sans text-xs text-gray-400 mb-6">
        {selected.length} / {MAX} selected
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        {GOALS.map(g => {
          const isSelected = selected.includes(g.id)
          const isDisabled = !isSelected && selected.length >= MAX
          return (
            <PillCheckbox
              key={g.id}
              label={g.label}
              selected={isSelected}
              onClick={() => toggle(g.id)}
              disabled={isDisabled}
            />
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="border border-gray-300 text-gray-700 font-sans font-medium py-3 px-6 rounded-full hover:border-[#0D5C63] transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 bg-[#0D5C63] text-white font-sans font-medium py-3 px-6 rounded-full hover:bg-[#094a50] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
