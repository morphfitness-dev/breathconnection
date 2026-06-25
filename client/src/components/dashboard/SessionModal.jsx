import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import PillarBadge from './PillarBadge'

export default function SessionModal({ session, onClose, onComplete }) {
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleComplete() {
    setSaving(true)
    const { data: { session: authSession } } = await supabase.auth.getSession()
    await window.fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${session.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession.access_token}`,
      },
      body: JSON.stringify({ comfort_rating: rating || null, notes: notes || null }),
    })
    setSaving(false)
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="mb-2">
          <PillarBadge pillar={session.pillar} />
        </div>
        <h2 className="font-serif text-2xl text-[#0D5C63] mb-2">{session.title}</h2>

        {session.duration_minutes && (
          <span className="inline-block text-xs font-sans text-gray-500 bg-gray-100 rounded-full px-3 py-1 mb-4">
            {session.duration_minutes} min
          </span>
        )}

        {session.has_breath_holds && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-sans text-amber-800">
            <span className="font-semibold">Warning:</span> This session includes breath holds. Do not practise near water, while driving, or unsupervised if you have any cardiovascular or respiratory conditions.
          </div>
        )}

        <p className="font-sans text-gray-700 leading-relaxed whitespace-pre-line mb-8">
          {session.content}
        </p>

        <div className="border-t border-gray-100 pt-6">
          <p className="font-sans text-sm font-medium text-gray-700 mb-3">Comfort rating (optional)</p>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`text-2xl transition-opacity ${n <= rating ? 'opacity-100' : 'opacity-30'}`}
                aria-label={`${n} star`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes from this session? (optional)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-sans text-gray-700 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30 mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 bg-[#0D5C63] text-white font-sans font-medium rounded-xl py-3 hover:bg-[#0a474d] transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Complete Session'}
            </button>
            <button
              onClick={onClose}
              className="px-6 border border-gray-200 text-gray-600 font-sans font-medium rounded-xl py-3 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
