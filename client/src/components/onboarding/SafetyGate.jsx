import { useState } from 'react'
import PillCheckbox from './PillCheckbox'

const CONDITIONS = [
  { id: 'cardiovascular', label: 'Cardiovascular disease or hypertension' },
  { id: 'epilepsy', label: 'Epilepsy or seizure disorders' },
  { id: 'asthma_copd', label: 'Moderate-to-severe asthma or COPD' },
  { id: 'pregnancy', label: 'Pregnancy' },
  { id: 'psychiatric', label: 'Active psychiatric condition (psychosis, mania, or severe panic disorder)' },
]

export default function SafetyGate({ onClear, onDefer }) {
  const [selected, setSelected] = useState([])

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleNone() {
    setSelected([])
    onClear([])
  }

  const hasSelections = selected.length > 0

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="font-serif text-3xl text-[#0D5C63] mb-2">Before we begin</h1>
        <p className="font-sans text-gray-600 mb-6">Do any of the following apply to you?</p>

        <div className="flex flex-wrap gap-3 mb-4">
          {CONDITIONS.map(c => (
            <PillCheckbox
              key={c.id}
              label={c.label}
              selected={selected.includes(c.id)}
              onClick={() => toggle(c.id)}
            />
          ))}
          <PillCheckbox
            label="None of the above"
            selected={selected.length === 0}
            onClick={handleNone}
          />
        </div>

        {hasSelections && (
          <div className="bg-amber-50 border border-[#E8A87C] rounded-xl p-4 mb-6">
            <p className="font-sans text-sm text-amber-800 font-medium mb-1">Please consult your doctor first</p>
            <p className="font-sans text-sm text-amber-700">
              One or more of the conditions you selected may require medical supervision before beginning a breathwork programme.
              We recommend speaking with your healthcare provider. If you already have clearance, you are welcome to continue.
            </p>
          </div>
        )}

        {hasSelections ? (
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              type="button"
              onClick={() => onClear(selected)}
              className="flex-1 bg-[#0D5C63] text-white font-sans font-medium py-3 px-6 rounded-full hover:bg-[#094a50] transition-colors"
            >
              I have clearance — continue
            </button>
            <button
              type="button"
              onClick={onDefer}
              className="flex-1 border border-gray-300 text-gray-700 font-sans font-medium py-3 px-6 rounded-full hover:border-[#0D5C63] transition-colors"
            >
              I'll get clearance first
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onClear([])}
            className="w-full bg-[#0D5C63] text-white font-sans font-medium py-3 px-6 rounded-full hover:bg-[#094a50] transition-colors mt-2"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
