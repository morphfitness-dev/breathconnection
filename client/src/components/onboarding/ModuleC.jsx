import SliderInput from './SliderInput'
import PillCheckbox from './PillCheckbox'

const STRESS_LABELS = { 1: 'Very low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very high' }
const ANXIETY_LABELS = { 1: 'Rarely', 2: 'Occasionally', 3: 'Sometimes', 4: 'Often', 5: 'Daily' }
const SLEEP_LABELS = { 1: 'Very poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent' }
const ENERGY_LABELS = { 1: 'Exhausted', 2: 'Low', 3: 'Moderate', 4: 'Good', 5: 'Energised' }

const PANIC_OPTIONS = [
  { id: 'never', label: 'Never' },
  { id: 'occasionally', label: 'Occasionally (few times a year)' },
  { id: 'sometimes', label: 'Sometimes (monthly)' },
  { id: 'frequently', label: 'Frequently (weekly or more)' },
]

export default function ModuleC({ data, onChange, onNext, onBack }) {
  const { stress_level, anxiety_level, sleep_quality, energy_level, panic_frequency } = data

  const canProceed = panic_frequency !== null && panic_frequency !== undefined

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="font-serif text-3xl text-[#0D5C63] mb-2">Stress, Mood &amp; Anxiety</h2>
      <p className="font-sans text-gray-600 mb-6 text-sm">
        Rate how you generally feel on a typical week.
      </p>

      <SliderInput
        label="Stress level"
        value={stress_level}
        onChange={v => onChange('stress_level', v)}
        labelMap={STRESS_LABELS}
      />
      <SliderInput
        label="How often do you feel anxious?"
        value={anxiety_level}
        onChange={v => onChange('anxiety_level', v)}
        labelMap={ANXIETY_LABELS}
      />
      <SliderInput
        label="Sleep quality"
        value={sleep_quality}
        onChange={v => onChange('sleep_quality', v)}
        labelMap={SLEEP_LABELS}
      />
      <SliderInput
        label="Energy level"
        value={energy_level}
        onChange={v => onChange('energy_level', v)}
        labelMap={ENERGY_LABELS}
      />

      <div className="mb-8">
        <p className="font-sans text-sm font-medium text-gray-700 mb-3">How often do you experience panic attacks or acute anxiety episodes?</p>
        <div className="flex flex-wrap gap-3">
          {PANIC_OPTIONS.map(o => (
            <PillCheckbox
              key={o.id}
              label={o.label}
              selected={panic_frequency === o.id}
              onClick={() => onChange('panic_frequency', o.id)}
            />
          ))}
        </div>
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
