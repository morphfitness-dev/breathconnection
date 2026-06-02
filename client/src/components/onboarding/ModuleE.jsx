import PillCheckbox from './PillCheckbox'

const ACTIVITY_OPTIONS = [
  { id: 'sedentary', label: 'Sedentary' },
  { id: 'lightly_active', label: 'Lightly active' },
  { id: 'moderately_active', label: 'Moderately active' },
  { id: 'very_active', label: 'Very active' },
  { id: 'athlete', label: 'Athlete' },
]

const TIME_OPTIONS = [
  { id: '5min', label: '5 minutes' },
  { id: '10min', label: '10 minutes' },
  { id: '15min', label: '15 minutes' },
  { id: '20plus', label: '20+ minutes' },
]

const EXPERIENCE_OPTIONS = [
  { id: 'never', label: 'Never' },
  { id: 'a_little', label: 'A little' },
  { id: 'regularly', label: 'Regularly' },
]

export default function ModuleE({ data, onChange, onSubmit, onBack, submitting }) {
  const { activity_level, time_commitment, prior_experience } = data

  const canSubmit = activity_level && time_commitment && prior_experience && !submitting

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="font-serif text-3xl text-[#0D5C63] mb-2">Your Lifestyle</h2>
      <p className="font-sans text-gray-600 mb-6 text-sm">
        A few final questions to personalise your programme.
      </p>

      <div className="mb-7">
        <p className="font-sans text-sm font-medium text-gray-700 mb-3">How would you describe your activity level?</p>
        <div className="flex flex-wrap gap-3">
          {ACTIVITY_OPTIONS.map(o => (
            <PillCheckbox
              key={o.id}
              label={o.label}
              selected={activity_level === o.id}
              onClick={() => onChange('activity_level', o.id)}
            />
          ))}
        </div>
      </div>

      <div className="mb-7">
        <p className="font-sans text-sm font-medium text-gray-700 mb-3">How much time can you commit to breathwork per day?</p>
        <div className="flex flex-wrap gap-3">
          {TIME_OPTIONS.map(o => (
            <PillCheckbox
              key={o.id}
              label={o.label}
              selected={time_commitment === o.id}
              onClick={() => onChange('time_commitment', o.id)}
            />
          ))}
        </div>
      </div>

      <div className="mb-8">
        <p className="font-sans text-sm font-medium text-gray-700 mb-3">Have you practised breathwork before?</p>
        <div className="flex flex-wrap gap-3">
          {EXPERIENCE_OPTIONS.map(o => (
            <PillCheckbox
              key={o.id}
              label={o.label}
              selected={prior_experience === o.id}
              onClick={() => onChange('prior_experience', o.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="border border-gray-300 text-gray-700 font-sans font-medium py-3 px-6 rounded-full hover:border-[#0D5C63] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1 bg-[#0D5C63] text-white font-sans font-medium py-3 px-6 rounded-full hover:bg-[#094a50] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Submitting…
            </>
          ) : (
            'Complete Assessment'
          )}
        </button>
      </div>
    </div>
  )
}
