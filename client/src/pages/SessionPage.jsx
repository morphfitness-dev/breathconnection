import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MuxPlayer from '@mux/mux-player-react'
import { useAuth } from '../context/AuthContext'
import PillarBadge from '../components/dashboard/PillarBadge'
import BreathPacer from '../components/session/BreathPacer'
import SessionTimer from '../components/session/SessionTimer'
import StopModal from '../components/session/StopModal'

const PILLAR_COLORS = {
  biomechanics: '#3B82F6',
  biochemistry: '#8B5CF6',
  neurophysiology: '#F59E0B',
  integration: '#0D5C63',
}

const COMFORT_OPTIONS = [
  { value: 1, emoji: '💫', label: 'Very challenging' },
  { value: 2, emoji: '😅', label: 'Challenging' },
  { value: 3, emoji: '😌', label: 'Just right' },
  { value: 4, emoji: '🙂', label: 'Easy' },
  { value: 5, emoji: '😴', label: 'Too easy' },
]

export default function SessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // UI state
  const [safetyDismissed, setSafetyDismissed] = useState(false)
  const [activeTab, setActiveTab] = useState(null) // 'reference' | 'about' | null
  const [timerRunning, setTimerRunning] = useState(false)
  const [showStopModal, setShowStopModal] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)

  // Completion form
  const [comfortRating, setComfortRating] = useState(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [boltScore, setBoltScore] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function getToken() {
    const { data } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())
    return data?.session?.access_token
  }

  useEffect(() => {
    async function fetchSession() {
      try {
        const token = await getToken()
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Session not found')
        const data = await res.json()
        setSession(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [id])

  async function handleDone() {
    if (!comfortRating) return
    setSubmitting(true)
    try {
      const token = await getToken()
      await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comfort_rating: comfortRating, notes: completionNotes }),
      })
      if (boltScore && !isNaN(Number(boltScore))) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/bolt-scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bolt_score: Number(boltScore), session_id: id }),
        })
      }
      navigate('/dashboard')
    } catch {
      setSubmitting(false)
    }
  }

  function handleBack() {
    if (timerRunning) {
      if (window.confirm('Leave this session?')) navigate('/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center">
        <p className="font-sans text-white/50 animate-pulse">Loading session…</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-sans text-gray-500">{error || 'Session not found.'}</p>
      </div>
    )
  }

  const pillarColor = PILLAR_COLORS[session.pillar] || '#0D5C63'
  const hasVideo = !!session.mux_playback_id
  const needsBolt = session.session_number === 3 || session.session_number === 8

  if (showCompletion) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-12 ${hasVideo ? 'bg-[#FAF8F5]' : 'bg-[#0A0F0D]'}`}>
        <div className={`max-w-lg w-full rounded-2xl p-8 shadow-xl ${hasVideo ? 'bg-white' : 'bg-white/5 border border-white/10'}`}>
          <div className={`text-center mb-6 ${hasVideo ? '' : 'text-white'}`}>
            <div className="text-4xl mb-3">✓</div>
            <h1 className={`font-serif text-2xl mb-1 ${hasVideo ? 'text-[#0D5C63]' : 'text-white'}`}>Session Complete</h1>
            <p className={`font-sans text-sm ${hasVideo ? 'text-gray-500' : 'text-white/60'}`}>{session.title}</p>
          </div>

          <p className={`font-sans text-sm font-medium mb-3 ${hasVideo ? 'text-gray-700' : 'text-white/80'}`}>How did that feel?</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {COMFORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setComfortRating(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-sans border transition-colors ${
                  comfortRating === opt.value
                    ? 'bg-[#0D5C63] text-white border-[#0D5C63]'
                    : hasVideo
                      ? 'border-gray-200 text-gray-600 hover:border-[#0D5C63]'
                      : 'border-white/20 text-white/70 hover:border-white/50'
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={completionNotes}
            onChange={e => setCompletionNotes(e.target.value)}
            placeholder="Optional notes…"
            rows={3}
            className={`w-full rounded-lg px-3 py-2 font-sans text-sm mb-4 border resize-none focus:outline-none focus:ring-2 focus:ring-[#0D5C63] ${
              hasVideo
                ? 'border-gray-200 bg-white text-gray-700'
                : 'border-white/20 bg-white/5 text-white placeholder-white/30'
            }`}
          />

          {needsBolt && (
            <div className="mb-4">
              <label className={`block font-sans text-sm font-medium mb-1.5 ${hasVideo ? 'text-gray-700' : 'text-white/80'}`}>
                Record your BOLT score (seconds):
              </label>
              <input
                type="number"
                value={boltScore}
                onChange={e => setBoltScore(e.target.value)}
                placeholder="e.g. 25"
                min={0}
                className={`w-32 rounded-lg px-3 py-2 font-sans text-sm border focus:outline-none focus:ring-2 focus:ring-[#0D5C63] ${
                  hasVideo
                    ? 'border-gray-200 bg-white text-gray-700'
                    : 'border-white/20 bg-white/5 text-white placeholder-white/30'
                }`}
              />
            </div>
          )}

          <button
            onClick={handleDone}
            disabled={!comfortRating || submitting}
            className="w-full bg-[#0D5C63] text-white font-sans font-medium py-3 rounded-xl hover:bg-[#094a50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${hasVideo ? 'bg-[#FAF8F5]' : 'bg-[#0A0F0D]'}`}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 bg-[#0A0F0D] z-40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-white/70 hover:text-white text-xl leading-none transition-colors shrink-0"
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="text-white font-sans font-medium text-sm flex-1 truncate">{session.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <PillarBadge pillar={session.pillar} />
          {session.duration_minutes && (
            <span className="bg-white/10 text-white/70 font-sans text-xs rounded-full px-2 py-0.5">
              {session.duration_minutes} min
            </span>
          )}
        </div>
      </div>

      {/* Main content, padded for top bar */}
      <div className="pt-14 flex flex-col flex-1">
        {/* Safety banner */}
        {session.has_breath_holds && !safetyDismissed && (
          <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 text-sm font-sans text-amber-800 flex items-start justify-between gap-2">
            <span>⚠️ This session includes breath holds. Never practise near or in water. Stop if you feel faint or experience chest pain.</span>
            <button onClick={() => setSafetyDismissed(true)} className="ml-4 text-amber-600 underline text-xs shrink-0">Dismiss</button>
          </div>
        )}

        {hasVideo ? (
          /* STATE A — Video available */
          <div>
            <div className="aspect-video w-full bg-black">
              <MuxPlayer
                playbackId={session.mux_playback_id}
                streamType="on-demand"
                accentColor="#0D5C63"
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Collapsible tabs */}
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
              {/* Reference tab */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setActiveTab(activeTab === 'reference' ? null : 'reference')}
                  className="w-full px-5 py-4 flex items-center justify-between font-sans text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>📖 Reference</span>
                  <span className="text-gray-400">{activeTab === 'reference' ? '▲' : '▼'}</span>
                </button>
                {activeTab === 'reference' && session.content && (
                  <div className="px-5 pb-5 pt-1 font-sans text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {session.content}
                  </div>
                )}
              </div>

              {/* About tab */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setActiveTab(activeTab === 'about' ? null : 'about')}
                  className="w-full px-5 py-4 flex items-center justify-between font-sans text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>ℹ️ About</span>
                  <span className="text-gray-400">{activeTab === 'about' ? '▲' : '▼'}</span>
                </button>
                {activeTab === 'about' && (
                  <div className="px-5 pb-5 pt-1 space-y-2 font-sans text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Pillar:</span>
                      <PillarBadge pillar={session.pillar} />
                    </div>
                    {session.phase && <p><span className="text-gray-400">Phase:</span> {session.phase}</p>}
                    {session.week && <p><span className="text-gray-400">Week:</span> {session.week}</p>}
                    {session.duration_minutes && <p><span className="text-gray-400">Duration:</span> {session.duration_minutes} minutes</p>}
                    <p>
                      <span className="text-gray-400">Breath holds:</span>{' '}
                      {session.has_breath_holds ? '⚠️ Yes — see safety notice' : 'No'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* STATE B — No video */
          <div className="flex flex-col items-center px-4 pb-6">
            <BreathPacer pillarColor={pillarColor} defaultInhale={4} defaultExhale={6} />

            <span className="bg-white/10 text-white/50 font-sans text-xs rounded-full px-3 py-1 mb-8">
              Video guide coming soon
            </span>

            {session.content && (
              <div className="max-w-2xl mx-auto text-center">
                <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-line">
                  {session.content}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Shared bottom bar */}
        <div className={`sticky bottom-0 border-t px-4 py-4 flex items-center justify-between gap-4 mt-auto ${hasVideo ? 'bg-white border-gray-100' : 'bg-[#0A0F0D] border-white/10'}`}>
          <div className={hasVideo ? 'text-gray-700' : 'text-white'}>
            <SessionTimer
              durationMinutes={session.duration_minutes || 10}
              onComplete={() => setShowCompletion(true)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStopModal(true)}
              className={`font-sans text-xs ${hasVideo ? 'text-gray-400 hover:text-gray-600' : 'text-white/40 hover:text-white/70'} transition-colors`}
            >
              I need to stop
            </button>
            <button
              onClick={() => setShowCompletion(true)}
              className="bg-[#0D5C63] text-white font-sans text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#094a50] transition-colors"
            >
              Complete Session
            </button>
          </div>
        </div>
      </div>

      {showStopModal && (
        <StopModal
          onContinue={() => setShowStopModal(false)}
          onEnd={() => navigate('/dashboard')}
        />
      )}
    </div>
  )
}
