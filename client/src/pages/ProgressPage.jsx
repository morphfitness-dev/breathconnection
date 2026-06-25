import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BoltChart from '../components/progress/BoltChart'
import WellbeingChart from '../components/progress/WellbeingChart'
import SessionHeatmap from '../components/progress/SessionHeatmap'
import BiometricsChart from '../components/progress/BiometricsChart'
import BiometricsLogModal from '../components/progress/BiometricsLogModal'
import Footer from '../components/Footer'

const PILLAR_LABELS = {
  biomechanics: 'Biomechanics',
  biochemistry: 'Biochemistry',
  neurophysiology: 'Neurophysiology',
  integration: 'Integration',
}

const PILLAR_COLORS = {
  biomechanics: '#3B82F6',
  biochemistry: '#8B5CF6',
  neurophysiology: '#F59E0B',
  integration: '#0D5C63',
}

export default function ProgressPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBiometricsModal, setShowBiometricsModal] = useState(false)

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/progress`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) { setError('Unable to load your progress. Please try again.'); setLoading(false); return }
    setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <p className="font-sans text-gray-400 animate-pulse">Loading your progress…</p>
    </main>
  )

  if (error || !data) return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <p className="font-sans text-gray-500">{error || 'No data yet.'}</p>
    </main>
  )

  const {
    bolt_scores, checkins, completions, programme, biometrics,
    onboarding_bolt, completed_count, total_count,
    next_bolt_session, wellbeing_avg_first_week, wellbeing_avg_last_week,
  } = data
  const mostRecentBiometric = biometrics && biometrics.length > 0 ? biometrics[biometrics.length - 1] : null
  const workoutHistory = [...completions].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

  const mostRecentBolt = bolt_scores.length > 0 ? bolt_scores[bolt_scores.length - 1].score : null
  const pillarColor = PILLAR_COLORS[programme.current_pillar] || '#0D5C63'

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-serif text-4xl text-[#0D5C63]">Your Progress</h1>
          <p className="font-sans text-gray-500 mt-1">{programme.name}</p>
        </div>

        {/* Programme Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-serif text-xl text-[#0D5C63] mb-4">Programme Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Started</p>
              <p className="font-sans text-sm font-medium text-gray-700">{formatDate(programme.assigned_at)}</p>
            </div>
            <div>
              <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Current Phase</p>
              <p className="font-sans text-sm font-medium text-gray-700">Phase {programme.current_phase}, Week {programme.current_week}</p>
            </div>
            <div>
              <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Current Focus</p>
              <span className="inline-block font-sans text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: pillarColor + '20', color: pillarColor }}>
                {PILLAR_LABELS[programme.current_pillar]}
              </span>
            </div>
            <div>
              <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Est. Completion</p>
              <p className="font-sans text-sm font-medium text-gray-700">{formatDate(programme.estimated_completion)}</p>
            </div>
          </div>
        </div>

        {/* Metrics Recap */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-serif text-xl text-[#0D5C63] mb-4">How You've Changed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-2">BOLT Score</p>
              <div className="flex items-center gap-3">
                <span className="font-serif text-2xl text-gray-400">{onboarding_bolt != null ? `${onboarding_bolt}s` : '—'}</span>
                <span className="text-gray-300 font-sans">→</span>
                <span className="font-serif text-2xl text-[#0D5C63]">{mostRecentBolt != null ? `${mostRecentBolt}s` : '—'}</span>
              </div>
              <p className="font-sans text-xs text-gray-400 mt-1">onboarding → most recent</p>
            </div>
            <div>
              <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-2">Avg Wellbeing</p>
              <div className="flex items-center gap-3">
                <span className="font-serif text-2xl text-gray-400">{wellbeing_avg_first_week != null ? `${wellbeing_avg_first_week}/5` : '—'}</span>
                <span className="text-gray-300 font-sans">→</span>
                <span className="font-serif text-2xl text-[#0D5C63]">{wellbeing_avg_last_week != null ? `${wellbeing_avg_last_week}/5` : '—'}</span>
              </div>
              <p className="font-sans text-xs text-gray-400 mt-1">first 7 days → last 7 days</p>
            </div>
            <div>
              <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-2">Sessions</p>
              <p className="font-serif text-2xl text-[#0D5C63]">{completed_count} <span className="text-gray-300 text-xl">/ {total_count}</span></p>
              <p className="font-sans text-xs text-gray-400 mt-1">complete</p>
            </div>
          </div>
        </div>

        {/* BOLT Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-serif text-xl text-[#0D5C63] mb-1">BOLT Score Over Time</h2>
          <p className="font-sans text-xs text-gray-400 mb-4">Seconds — higher is better</p>
          {bolt_scores.length >= 2 ? (
            <BoltChart data={bolt_scores} />
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="font-sans text-sm text-gray-500">
                Complete more sessions to see your BOLT score trend.
                {next_bolt_session && <> Your next BOLT test is in <strong>Session {next_bolt_session}</strong>.</>}
              </p>
            </div>
          )}
        </div>

        {/* Wellbeing Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-serif text-xl text-[#0D5C63] mb-1">Daily Wellbeing</h2>
          <p className="font-sans text-xs text-gray-400 mb-4">Last 30 days — scale 1–5</p>
          {checkins.length > 0 ? (
            <WellbeingChart data={checkins} />
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="font-sans text-sm text-gray-500 mb-3">No check-ins recorded yet.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#0D5C63] text-white font-sans text-sm font-medium px-5 py-2 rounded-full hover:bg-[#094a50] transition-colors"
              >
                Log today's check-in
              </button>
            </div>
          )}
        </div>

        {/* Biometrics */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-xl text-[#0D5C63]">Biometrics</h2>
            <button
              onClick={() => setShowBiometricsModal(true)}
              className="bg-[#0D5C63] text-white font-sans text-sm font-medium px-4 py-1.5 rounded-full hover:bg-[#094a50] transition-colors"
            >
              Log Entry
            </button>
          </div>
          <p className="font-sans text-xs text-gray-400 mb-4">Last 90 days — resting heart rate &amp; sleep</p>
          {biometrics && biometrics.length >= 2 ? (
            <BiometricsChart data={biometrics} />
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="font-sans text-sm text-gray-500">Log at least two entries to see your trend.</p>
            </div>
          )}
          {mostRecentBiometric && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Resting HR</p>
                <p className="font-sans text-sm font-medium text-gray-700">{mostRecentBiometric.resting_heart_rate ?? '—'} bpm</p>
              </div>
              <div>
                <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">HRV</p>
                <p className="font-sans text-sm font-medium text-gray-700">{mostRecentBiometric.hrv ?? '—'} ms</p>
              </div>
              <div>
                <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Sleep</p>
                <p className="font-sans text-sm font-medium text-gray-700">{mostRecentBiometric.sleep_hours ?? '—'} hrs</p>
              </div>
              <div>
                <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Blood Pressure</p>
                <p className="font-sans text-sm font-medium text-gray-700">
                  {mostRecentBiometric.systolic && mostRecentBiometric.diastolic
                    ? `${mostRecentBiometric.systolic}/${mostRecentBiometric.diastolic}`
                    : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-serif text-xl text-[#0D5C63] mb-1">Session Consistency</h2>
          <p className="font-sans text-xs text-gray-400 mb-4">Last 8 weeks</p>
          <SessionHeatmap completions={completions} />
          <p className="font-sans text-sm text-gray-500 mt-4">
            You've completed <strong>{completed_count}</strong> of <strong>{total_count}</strong> sessions in your programme.
          </p>
        </div>

        {/* Workout History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-serif text-xl text-[#0D5C63] mb-1">Workout History</h2>
          <p className="font-sans text-xs text-gray-400 mb-4">Every completed session, most recent first</p>
          {workoutHistory.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {workoutHistory.map(w => (
                <div key={w.session_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-sans text-sm font-medium text-gray-700">
                      {w.title || `Session ${w.session_number}`}
                    </p>
                    <p className="font-sans text-xs text-gray-400">{formatDate(w.completed_at)}</p>
                  </div>
                  {w.comfort_rating != null && (
                    <span className="font-sans text-xs font-medium text-gray-500">Comfort: {w.comfort_rating}/5</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-sm text-gray-500">No sessions completed yet.</p>
          )}
        </div>

        <p className="font-sans text-xs text-gray-400 text-center pb-4">
          Your data is private and only visible to you.
        </p>
      </div>
    </main>
    <Footer />
    {showBiometricsModal && (
      <BiometricsLogModal onClose={() => setShowBiometricsModal(false)} onSave={load} />
    )}
    </div>
  )
}

