import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Spinner from '../Spinner'

export default function BiometricsLogModal({ onClose, onSave }) {
  const [restingHeartRate, setRestingHeartRate] = useState('')
  const [hrv, setHrv] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [sleepQuality, setSleepQuality] = useState(0)
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    await window.fetch(`${import.meta.env.VITE_API_URL}/api/biometrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        resting_heart_rate: restingHeartRate ? Number(restingHeartRate) : null,
        hrv: hrv ? Number(hrv) : null,
        sleep_hours: sleepHours ? Number(sleepHours) : null,
        sleep_quality: sleepQuality || null,
        systolic: systolic ? Number(systolic) : null,
        diastolic: diastolic ? Number(diastolic) : null,
        notes: notes || null,
      }),
    })
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="font-serif text-2xl text-[#0D5C63] mb-6">Log Biometrics</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-sans text-sm font-medium text-gray-600 mb-1">Resting HR (bpm)</label>
            <input
              type="number"
              value={restingHeartRate}
              onChange={e => setRestingHeartRate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30"
            />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-gray-600 mb-1">HRV (ms)</label>
            <input
              type="number"
              value={hrv}
              onChange={e => setHrv(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30"
            />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-gray-600 mb-1">Sleep (hours)</label>
            <input
              type="number"
              step="0.5"
              value={sleepHours}
              onChange={e => setSleepHours(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30"
            />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-gray-600 mb-1">Blood pressure</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Sys"
                value={systolic}
                onChange={e => setSystolic(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30"
              />
              <input
                type="number"
                placeholder="Dia"
                value={diastolic}
                onChange={e => setDiastolic(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="font-sans text-sm font-medium text-gray-600 mb-2">Sleep quality</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setSleepQuality(n)}
                className={`w-10 h-10 rounded-xl font-sans font-semibold text-sm transition-all ${
                  sleepQuality === n
                    ? 'bg-[#0D5C63] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-label={`Sleep quality ${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything to note?"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-sans text-gray-700 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30 mb-4"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#0D5C63] text-white font-sans font-medium rounded-xl py-3 hover:bg-[#0a474d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Spinner />}
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </div>
  )
}
