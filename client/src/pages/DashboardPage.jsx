import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDashboard } from '../hooks/useDashboard'
import PillarBadge from '../components/dashboard/PillarBadge'
import CheckInModal from '../components/dashboard/CheckInModal'

const WELLBEING_EMOJIS = ['😔', '😐', '🙂', '😊', '😄']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function ProgressGrid({ sessions }) {
  const PHASE_LABELS = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

  // Group into pairs of 2 (each phase = 2 sessions by session_number)
  const phases = [
    sessions.slice(0, 2),
    sessions.slice(2, 4),
    sessions.slice(4, 6),
    sessions.slice(6, 8),
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-serif text-xl text-[#0D5C63] mb-4">8-Week Programme</h2>
      <div className="space-y-4">
        {phases.map((phaseSessions, phaseIdx) => (
          <div key={phaseIdx} className="flex items-center gap-4">
            <span className="font-sans text-xs text-gray-400 w-16 shrink-0">{PHASE_LABELS[phaseIdx]}</span>
            <div className="flex gap-3">
              {phaseSessions.map((session, i) => {
                const num = phaseIdx * 2 + i + 1
                const isCurrent = !session.completed && (
                  phaseIdx * 2 + i === sessions.findIndex(s => !s.completed)
                )
                if (session.completed) {
                  return (
                    <div key={session.id} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-[#0D5C63] flex items-center justify-center text-white text-sm font-sans font-medium">
                        ✓
                      </div>
                      <span className="text-xs font-sans text-gray-400">Wk {num}</span>
                    </div>
                  )
                }
                if (isCurrent) {
                  return (
                    <div key={session.id} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full border-2 border-[#0D5C63] flex items-center justify-center text-[#0D5C63] text-sm font-sans font-medium animate-pulse">
                        {num}
                      </div>
                      <span className="text-xs font-sans text-[#0D5C63] font-medium">Wk {num}</span>
                    </div>
                  )
                }
                return (
                  <div key={session.id} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-sans">
                      {num}
                    </div>
                    <span className="text-xs font-sans text-gray-300">Wk {num}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, refresh } = useDashboard()
  const navigate = useNavigate()
  const [checkinOpen, setCheckinOpen] = useState(false)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const greeting = getGreeting()

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-sans text-gray-400 animate-pulse">Loading your dashboard…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-sans text-gray-500">{error || 'No programme assigned yet.'}</p>
      </main>
    )
  }

  const { programme_name, programme_description, sessions, currentSession, completedCount, totalCount, lastCheckin, boltScore } = data
  const allDone = completedCount === totalCount

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-serif text-4xl text-[#0D5C63]">{greeting}, {firstName}</h1>
          <p className="font-sans text-gray-500 mt-1">{programme_name} &mdash; {programme_description}</p>
        </div>

        {/* Today's Session Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="font-sans text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Today's Session</p>
          {allDone ? (
            <div className="text-center py-6">
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-serif text-2xl text-[#0D5C63]">Programme complete</p>
              <p className="font-sans text-gray-500 mt-1">You've completed all 8 sessions.</p>
            </div>
          ) : currentSession ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <PillarBadge pillar={currentSession.pillar} />
                  <span className="font-sans text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Text guide</span>
                  {currentSession.duration_minutes && (
                    <span className="font-sans text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      {currentSession.duration_minutes} min
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-2xl text-[#0D5C63]">{currentSession.title}</h2>
                <p className="font-sans text-sm text-gray-500 mt-1">Session {currentSession.session_number} of {totalCount}</p>
              </div>
              <button
                onClick={() => navigate(`/session/${currentSession.id}`)}
                className="shrink-0 bg-[#0D5C63] text-white font-sans font-medium rounded-xl px-8 py-3 hover:bg-[#0a474d] transition-colors"
              >
                Begin Session
              </button>
            </div>
          ) : null}
        </div>

        {/* Progress Grid */}
        {sessions.length > 0 && <ProgressGrid sessions={sessions} />}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-sans text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">BOLT Score</p>
            <p className="font-serif text-3xl text-[#0D5C63]">{boltScore ?? '—'}{boltScore ? 's' : ''}</p>
            <p className="font-sans text-xs text-gray-400 mt-1">Retest weekly</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-sans text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Wellbeing</p>
            {lastCheckin ? (
              <>
                <p className="text-3xl">{WELLBEING_EMOJIS[lastCheckin.wellbeing_score - 1]}</p>
                <p className="font-sans text-xs text-gray-400 mt-1">
                  Energy {lastCheckin.energy_score}/5 &middot; {new Date(lastCheckin.created_at).toLocaleDateString()}
                </p>
              </>
            ) : (
              <>
                <p className="font-serif text-lg text-gray-400">Not yet logged</p>
                <p className="font-sans text-xs text-gray-400 mt-1">Log your first check-in</p>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-sans text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Sessions</p>
            <p className="font-serif text-3xl text-[#0D5C63]">{completedCount} <span className="text-gray-300 text-2xl">/ {totalCount}</span></p>
            <p className="font-sans text-xs text-gray-400 mt-1">complete</p>
          </div>
        </div>

        {/* Daily Check-in Button */}
        <div className="flex justify-center pb-4">
          <button
            onClick={() => setCheckinOpen(true)}
            className="border-2 border-[#E8A87C] text-[#E8A87C] font-sans font-medium rounded-xl px-8 py-3 hover:bg-[#E8A87C]/10 transition-colors"
          >
            Log today's check-in
          </button>
        </div>
      </div>

      {checkinOpen && (
        <CheckInModal
          onClose={() => setCheckinOpen(false)}
          onSave={() => refresh()}
        />
      )}
    </main>
  )
}
