import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import UploadModal from '../components/admin/UploadModal'
import PreviewModal from '../components/admin/PreviewModal'

const PILLAR_INFO = {
  biomechanics: { label: 'Biomechanics', color: '#3B82F6' },
  biochemistry: { label: 'Biochemistry', color: '#8B5CF6' },
  neurophysiology: { label: 'Neurophysiology', color: '#F59E0B' },
  integration: { label: 'Integration', color: '#0D5C63' },
}

const STATUS_BADGE = {
  none: { dot: 'bg-red-500', label: 'No video' },
  processing: { dot: 'bg-yellow-400', label: 'Processing' },
  ready: { dot: 'bg-green-500', label: 'Ready' },
}

export default function AdminLibraryPage() {
  const [sessions, setSessions] = useState([])
  const [programmes, setProgrammes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [uploadSession, setUploadSession] = useState(null)
  const [previewSession, setPreviewSession] = useState(null)

  async function getToken() {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token
  }

  async function fetchVideos() {
    try {
      const token = await getToken()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch videos')
      setSessions(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProgrammes() {
    const token = await getToken()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/programmes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setProgrammes(Object.fromEntries(data.map(p => [p.id, p.name])))
    }
  }

  useEffect(() => { fetchVideos(); fetchProgrammes() }, [])

  const filtered = sessions.filter(s => {
    if (tab !== 'all' && s.pillar !== tab) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-sans text-gray-400 animate-pulse">Loading library…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-sans text-red-500">{error}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Video Library</p>
            <h1 className="font-serif text-4xl text-[#0D5C63]">Breathing Sessions</h1>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="font-sans text-sm border border-gray-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30 w-64"
          />
        </div>

        {/* Pillar tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setTab('all')}
            className={`font-sans text-sm px-4 py-1.5 rounded-full transition-colors ${tab === 'all' ? 'bg-[#0D5C63] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0D5C63]'}`}
          >
            All Sessions
          </button>
          {Object.entries(PILLAR_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 font-sans text-sm px-4 py-1.5 rounded-full transition-colors ${tab === key ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0D5C63]'}`}
              style={tab === key ? { backgroundColor: info.color } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tab === key ? 'white' : info.color }} />
              {info.label}
            </button>
          ))}
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(s => {
            const badge = STATUS_BADGE[s.video_status] || STATUS_BADGE.none
            const pillar = PILLAR_INFO[s.pillar] || PILLAR_INFO.integration
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div
                  className="h-32 flex items-center justify-center text-3xl"
                  style={{ backgroundColor: pillar.color + '15' }}
                >
                  🎬
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span
                    className="self-start font-sans text-xs font-medium px-2 py-0.5 rounded-full mb-2"
                    style={{ backgroundColor: pillar.color + '20', color: pillar.color }}
                  >
                    {pillar.label}
                  </span>
                  <p className="font-sans text-sm font-medium text-gray-800 line-clamp-2 mb-1">{s.title}</p>
                  <p className="font-sans text-xs text-gray-400 mb-3">
                    {s.programme_id > 0 ? `${programmes[s.programme_id] || `Programme ${s.programme_id}`} · Week ${s.week} · Session ${s.session_number}` : 'Unassigned'}
                  </p>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                    <span className="font-sans text-xs text-gray-500">{badge.label}</span>
                  </div>
                  <div className="mt-auto flex gap-2">
                    {s.video_status === 'ready' ? (
                      <>
                        <button
                          onClick={() => setPreviewSession(s)}
                          className="flex-1 font-sans text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:border-[#0D5C63] hover:text-[#0D5C63] transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setUploadSession(s)}
                          className="flex-1 font-sans text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:border-[#0D5C63] hover:text-[#0D5C63] transition-colors"
                        >
                          Replace
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setUploadSession(s)}
                        disabled={s.video_status === 'processing'}
                        className="flex-1 font-sans text-xs border border-[#0D5C63] text-[#0D5C63] rounded-lg px-3 py-1.5 hover:bg-[#0D5C63] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {s.video_status === 'processing' ? 'Processing…' : 'Upload'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <p className="font-sans text-sm text-gray-400 text-center py-12">No sessions match the current filters.</p>
        )}
      </div>

      {uploadSession && (
        <UploadModal
          session={uploadSession}
          onClose={() => setUploadSession(null)}
          onUploaded={() => fetchVideos()}
        />
      )}
      {previewSession && (
        <PreviewModal session={previewSession} onClose={() => setPreviewSession(null)} />
      )}
    </main>
  )
}
