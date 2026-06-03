import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const PROGRAMME_NAMES = { 1: 'HRV Optimisation', 2: 'Anxiety Management', 3: 'Cardiovascular Endurance', 4: 'Sleep Improvement' }
const PANIC_LABELS = { never: 'Never', occasionally: 'Occasionally', sometimes: 'Sometimes (monthly)', frequently: 'Frequently (weekly+)' }
const ACTIVITY_LABELS = { sedentary: 'Sedentary', lightly_active: 'Lightly active', moderately_active: 'Moderately active', very_active: 'Very active', athlete: 'Athlete' }
const TIME_LABELS = { '5min': '5 minutes', '10min': '10 minutes', '15min': '15 minutes', '20plus': '20+ minutes' }
const EXPERIENCE_LABELS = { never: 'Never', a_little: 'A little', regularly: 'Regularly' }
const WELLBEING_EMOJIS = ['', '😔', '😐', '🙂', '😊', '😄']

const PILLAR_COLORS = {
  biomechanics: 'bg-blue-100 text-blue-700',
  biochemistry: 'bg-green-100 text-green-700',
  neurophysiology: 'bg-purple-100 text-purple-700',
  integration: 'bg-amber-100 text-amber-700',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Stars({ rating }) {
  if (!rating) return <span className="text-gray-300 text-xs">—</span>
  return (
    <span className="text-sm">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <h2 className="font-serif text-xl text-[#0D5C63]">{title}</h2>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}

function AssessmentField({ label, value }) {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="font-sans text-sm text-gray-500 w-40 shrink-0">{label}</span>
      <span className="font-sans text-sm text-gray-800">
        {Array.isArray(value) ? value.join(', ') : String(value)}
      </span>
    </div>
  )
}

export default function UserDetailView({ userId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteError, setNoteError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch user details')
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  async function saveNote(e) {
    e.preventDefault()
    if (!noteText.trim()) return
    setSavingNote(true)
    setNoteError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ target_user_id: userId, note: noteText.trim() }),
      })
      if (!res.ok) throw new Error('Failed to save note')
      const newNote = await res.json()
      setData(d => ({ ...d, admin_notes: [newNote, ...d.admin_notes] }))
      setNoteText('')
    } catch (e) {
      setNoteError(e.message)
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16 font-sans text-gray-400">Loading user details…</div>
    )
  }

  if (error) {
    return (
      <div>
        <button onClick={onBack} className="font-sans text-sm text-[#0D5C63] hover:underline mb-4">← Back to users</button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 font-sans text-sm text-red-600">{error}</div>
      </div>
    )
  }

  const { profile, assessment, completions, bolt_scores, checkins, admin_notes, email } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={onBack} className="font-sans text-sm text-[#0D5C63] hover:underline mb-3 flex items-center gap-1">
          ← Back to users
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl text-[#0D5C63]">{profile?.full_name || '—'}</h1>
            <p className="font-sans text-sm text-gray-500 mt-1">{email} · Joined {formatDate(profile?.created_at)}</p>
          </div>
          {profile?.is_admin && (
            <span className="bg-[#0D5C63] text-white text-xs font-sans px-2 py-1 rounded">Admin</span>
          )}
        </div>
      </div>

      {/* Assessment */}
      <Section title="Assessment Responses">
        {assessment ? (
          <div className="divide-y divide-gray-50">
            <AssessmentField label="Programme" value={PROGRAMME_NAMES[assessment.assigned_programme]} />
            <AssessmentField label="BOLT Score" value={assessment.bolt_score} />
            <AssessmentField label="Stress Level" value={assessment.stress_level != null ? `${assessment.stress_level}/5` : null} />
            <AssessmentField label="Anxiety Level" value={assessment.anxiety_level != null ? `${assessment.anxiety_level}/5` : null} />
            <AssessmentField label="Sleep Quality" value={assessment.sleep_quality != null ? `${assessment.sleep_quality}/5` : null} />
            <AssessmentField label="Energy Level" value={assessment.energy_level != null ? `${assessment.energy_level}/5` : null} />
            <AssessmentField label="Panic Frequency" value={PANIC_LABELS[assessment.panic_frequency]} />
            <AssessmentField label="Activity Level" value={ACTIVITY_LABELS[assessment.activity_level]} />
            <AssessmentField label="Time Commitment" value={TIME_LABELS[assessment.time_commitment]} />
            <AssessmentField label="Prior Experience" value={EXPERIENCE_LABELS[assessment.prior_experience]} />
            <AssessmentField label="Symptoms" value={assessment.symptoms} />
            <AssessmentField label="Goals" value={assessment.goals} />
            <AssessmentField label="Contraindications" value={assessment.contraindications} />
          </div>
        ) : (
          <p className="font-sans text-sm text-gray-400">No assessment completed yet.</p>
        )}
      </Section>

      {/* Session History */}
      <Section title="Session History">
        {completions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Date</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Session</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Pillar</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Comfort</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completions.map((c, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 font-sans text-sm text-gray-500 whitespace-nowrap">{formatDate(c.completed_at)}</td>
                    <td className="py-2.5 pr-4 font-sans text-sm text-gray-800">
                      {c.session ? (
                        <span>
                          <span className="text-gray-400 mr-1">#{c.session.session_number}</span>
                          {c.session.title}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      {c.session?.pillar ? (
                        <span className={`font-sans text-xs px-2 py-0.5 rounded-full capitalize ${PILLAR_COLORS[c.session.pillar] || 'bg-gray-100 text-gray-600'}`}>
                          {c.session.pillar}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 pr-4"><Stars rating={c.comfort_rating} /></td>
                    <td className="py-2.5 font-sans text-sm text-gray-500">{c.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="font-sans text-sm text-gray-400">No sessions completed yet.</p>
        )}
      </Section>

      {/* BOLT Score History */}
      <Section title="BOLT Score History">
        {bolt_scores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Date</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Score</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...bolt_scores].reverse().map((b, i, arr) => {
                  const prev = i > 0 ? arr[i - 1].bolt_score : null
                  const delta = prev != null ? b.bolt_score - prev : null
                  return (
                    <tr key={i}>
                      <td className="py-2.5 pr-4 font-sans text-sm text-gray-500 whitespace-nowrap">{formatDateTime(b.recorded_at)}</td>
                      <td className="py-2.5 pr-4 font-sans text-sm font-medium text-gray-800">{b.bolt_score}s</td>
                      <td className="py-2.5 font-sans text-sm font-medium">
                        {delta == null ? <span className="text-gray-300">—</span> : (
                          <span className={delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}>
                            {delta > 0 ? '+' : ''}{delta}s
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="font-sans text-sm text-gray-400">No BOLT scores recorded yet.</p>
        )}
      </Section>

      {/* Check-in History */}
      <Section title="Check-in History">
        {checkins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Date</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Wellbeing</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2 pr-4">Energy</th>
                  <th className="text-left font-sans text-xs text-gray-400 font-medium pb-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {checkins.map((c, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 font-sans text-sm text-gray-500 whitespace-nowrap">{formatDate(c.created_at)}</td>
                    <td className="py-2.5 pr-4 font-sans text-sm">
                      <span className="text-lg" title={`Wellbeing: ${c.wellbeing_score}/5`}>{WELLBEING_EMOJIS[c.wellbeing_score] || c.wellbeing_score}</span>
                      <span className="text-gray-400 text-xs ml-1">{c.wellbeing_score}/5</span>
                    </td>
                    <td className="py-2.5 pr-4 font-sans text-sm text-gray-700">{c.energy_score}/5</td>
                    <td className="py-2.5 font-sans text-sm text-gray-500">{c.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="font-sans text-sm text-gray-400">No check-ins yet.</p>
        )}
      </Section>

      {/* Admin Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-serif text-xl text-[#0D5C63] mb-4">Admin Notes</h2>

        {admin_notes.length > 0 && (
          <div className="space-y-3 mb-5">
            {admin_notes.map(note => (
              <div key={note.id} className="bg-gray-50 rounded-xl p-4">
                <p className="font-sans text-sm text-gray-800 whitespace-pre-wrap">{note.note}</p>
                <p className="font-sans text-xs text-gray-400 mt-2">{formatDateTime(note.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={saveNote} className="space-y-3">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note about this user…"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63] resize-none"
          />
          {noteError && <p className="font-sans text-sm text-red-500">{noteError}</p>}
          <button
            type="submit"
            disabled={savingNote || !noteText.trim()}
            className="bg-[#0D5C63] text-white font-sans text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#094a50] transition-colors disabled:opacity-50"
          >
            {savingNote ? 'Saving…' : 'Save Note'}
          </button>
        </form>
      </div>
    </div>
  )
}
