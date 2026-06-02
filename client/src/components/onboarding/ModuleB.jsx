import PillCheckbox from './PillCheckbox'

const SYMPTOMS = [
  { id: 'neck_shoulder', label: 'Neck or shoulder tension' },
  { id: 'mouth_breathing', label: 'Breathing through your mouth during the day' },
  { id: 'dry_mouth', label: 'Waking with a dry mouth' },
  { id: 'yawning', label: 'Yawning frequently during the day' },
  { id: 'sighing', label: 'Sighing or feeling short of breath at rest' },
  { id: 'shallow_breathing', label: 'Chest tightness or frequent shallow breathing' },
  { id: 'snoring', label: 'Snoring or disrupted sleep' },
  { id: 'digestive', label: 'Digestive issues (bloating, sluggish digestion)' },
]

export default function ModuleB({ selected, onChange, onNext, onBack }) {
  function toggle(id) {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id))
    } else {
      onChange([...selected, id])
    }
  }

  function handleNone() {
    onChange([])
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="font-serif text-3xl text-[#0D5C63] mb-2">Current Symptoms</h2>
      <p className="font-sans text-gray-600 mb-6 text-sm">
        Select any symptoms you regularly experience. This helps us tailor your programme.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        {SYMPTOMS.map(s => (
          <PillCheckbox
            key={s.id}
            label={s.label}
            selected={selected.includes(s.id)}
            onClick={() => toggle(s.id)}
          />
        ))}
        <PillCheckbox
          label="None of the above"
          selected={selected.length === 0}
          onClick={handleNone}
        />
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
          className="flex-1 bg-[#0D5C63] text-white font-sans font-medium py-3 px-6 rounded-full hover:bg-[#094a50] transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
