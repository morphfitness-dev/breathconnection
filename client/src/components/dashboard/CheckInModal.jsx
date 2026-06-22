import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Spinner from '../Spinner'

const WELLBEING_EMOJIS = ['😔', '😐', '🙂', '😊', '😄']

export default function CheckInModal({ onClose, onSave }) {
  const [wellbeing, setWellbeing] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!wellbeing || !energy) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    await window.fetch(`${import.meta.env.VITE_API_URL}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ wellbeing_score: wellbeing, energy_score: energy, notes: notes || null }),
    })
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="font-serif text-2xl text-[#0D5C63] mb-6">How are you feeling today?</h2>

        <div className="mb-6">
          <p className="font-sans text-sm font-medium text-gray-600 mb-3">Wellbeing</p>
          <div className="flex gap-3">
            {WELLBEING_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setWellbeing(i + 1)}
                className={`text-3xl rounded-xl p-2 transition-all ${
                  wellbeing === i + 1
                    ? 'ring-2 ring-[#0D5C63] bg-teal-50'
                    : 'opacity-50 hover:opacity-80'
                }`}
                aria-label={`Wellbeing ${i + 1}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="font-sans text-sm font-medium text-gray-600 mb-3">Energy level</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setEnergy(n)}
                className={`w-12 h-12 rounded-xl font-sans font-semibold text-sm transition-all ${
                  energy === n
                    ? 'bg-[#0D5C63] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-label={`Energy ${n}`}
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
          disabled={saving || !wellbeing || !energy}
          className="w-full bg-[#0D5C63] text-white font-sans font-medium rounded-xl py-3 hover:bg-[#0a474d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Spinner />}
          {saving ? 'Saving…' : 'Save Check-in'}
        </button>
      </div>
    </div>
  )
}
