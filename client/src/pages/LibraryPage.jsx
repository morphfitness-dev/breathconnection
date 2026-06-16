import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import Spinner from '../components/Spinner'

const PILLAR_INFO = {
  biomechanics: { label: 'Biomechanics', color: '#3B82F6', description: 'Posture, diaphragm function, and ribcage mobility' },
  biochemistry: { label: 'Biochemistry', color: '#8B5CF6', description: 'CO₂ tolerance and breath chemistry training' },
  neurophysiology: { label: 'Neurophysiology', color: '#F59E0B', description: 'Nervous system regulation and vagal tone' },
  integration: { label: 'Integration', color: '#0D5C63', description: 'Combining all three pillars into daily practice' },
}

const PILLAR_ORDER = ['biomechanics', 'biochemistry', 'neurophysiology', 'integration']

export default function LibraryPage() {
  const { data, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-sans text-gray-500">{error || 'Unable to load your library.'}</p>
      </div>
    )
  }

  const sessions = data.sessions || []
  const grouped = PILLAR_ORDER.map(pillar => ({
    pillar,
    info: PILLAR_INFO[pillar],
    sessions: sessions.filter(s => s.pillar === pillar),
  })).filter(group => group.sessions.length > 0)

  return (
    <div className="min-h-screen bg-[#FAF8F5] px-6 py-10 max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl text-[#0D5C63] mb-2">Exercise Library</h1>
      <p className="font-sans text-gray-500 mb-8">{data.programme_name} — browse every exercise in your programme</p>

      <div className="flex flex-col gap-10">
        {grouped.map(({ pillar, info, sessions }) => (
          <div key={pillar}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
              <h2 className="font-serif text-xl text-[#0D5C63]">{info.label}</h2>
            </div>
            <p className="font-sans text-sm text-gray-500 mb-4">{info.description}</p>
            <div className="flex flex-col gap-3">
              {sessions.map(session => (
                <Link
                  key={session.id}
                  to={`/session/${session.id}`}
                  className="bg-white rounded-xl px-5 py-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-sans font-medium text-gray-800">
                      Week {session.week} · {session.title}
                    </p>
                    <p className="font-sans text-sm text-gray-400">
                      {session.duration_minutes ? `${session.duration_minutes} min` : 'Variable duration'}
                      {session.has_breath_holds ? ' · Includes breath holds' : ''}
                    </p>
                  </div>
                  {session.completed && (
                    <span className="text-xs font-sans font-medium text-white bg-[#0D5C63] px-3 py-1 rounded-full">
                      Completed
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
