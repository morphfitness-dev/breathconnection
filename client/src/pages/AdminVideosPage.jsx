import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import UploadModal from '../components/admin/UploadModal'
import PreviewModal from '../components/admin/PreviewModal'

const STATUS_BADGE = {
  none: { dot: 'bg-red-500', label: 'No video' },
  processing: { dot: 'bg-yellow-400', label: 'Processing' },
  ready: { dot: 'bg-green-500', label: 'Ready' },
}

export default function AdminVideosPage() {
  const [sessions, setSessions] = useState([])
  const [programmeNames, setProgrammeNames] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterProgramme, setFilterProgramme] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [uploadSession, setUploadSession] = useState(null)
  const [previewSession, setPreviewSession] = useState(null)
  const [replaceSession, setReplaceSession] = useState(null)

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
      const data = await res.json()
      setSessions(data)
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
      setProgrammeNames(Object.fromEntries(data.map(p => [p.id, p.name])))
    }
  }

  useEffect(() => { fetchVideos(); fetchProgrammes() }, [])

  const filtered = sessions.filter(s => {
    if (filterProgramme !== 'all' && String(s.programme_id) !== filterProgramme) return false
    if (filterStatus !== 'all' && s.video_status !== filterStatus) return false
    return true
  })

  const programmes = [...new Set(sessions.map(s => s.programme_id))].sort()

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-sans text-gray-400 animate-pulse">Loading videos…</p>
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
        <h1 className="font-serif text-4xl text-[#0D5C63] mb-6">Video Management</h1>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterProgramme}
            onChange={e => setFilterProgramme(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]"
          >
            <option value="all">All programmes</option>
            {programmes.map(p => (
              <option key={p} value={String(p)}>{programmeNames[p] || `Programme ${p}`}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]"
          >
            <option value="all">All statuses</option>
            <option value="none">No video</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
          </select>
          <span className="font-sans text-sm text-gray-400 self-center">{filtered.length} sessions</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-sans text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                <th className="px-4 py-3 text-left font-sans text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                <th className="px-4 py-3 text-left font-sans text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left font-sans text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left font-sans text-xs font-medium text-gray-500 uppercase tracking-wider">Pillar</th>
                <th className="px-4 py-3 text-left font-sans text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right font-sans text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => {
                const badge = STATUS_BADGE[s.video_status] || STATUS_BADGE.none
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-sans text-sm text-gray-600">
                      {programmeNames[s.programme_id] || `P${s.programme_id}`}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-600">{s.week ?? '—'}</td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-600">{s.session_number}</td>
                    <td className="px-4 py-3 font-sans text-sm font-medium text-gray-800 max-w-xs">
                      <span className="line-clamp-1">{s.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-sans text-xs capitalize text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                        {s.pillar}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                        <span className="font-sans text-xs text-gray-600">{badge.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.video_status === 'none' && (
                        <button
                          onClick={() => setUploadSession(s)}
                          className="font-sans text-xs border border-[#0D5C63] text-[#0D5C63] rounded-lg px-3 py-1.5 hover:bg-[#0D5C63] hover:text-white transition-colors"
                        >
                          Upload
                        </button>
                      )}
                      {s.video_status === 'processing' && (
                        <span className="font-sans text-xs text-gray-400">Refreshing…</span>
                      )}
                      {s.video_status === 'ready' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewSession(s)}
                            className="font-sans text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:border-[#0D5C63] hover:text-[#0D5C63] transition-colors"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => setReplaceSession(s)}
                            className="font-sans text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:border-[#0D5C63] hover:text-[#0D5C63] transition-colors"
                          >
                            Replace
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center font-sans text-gray-400 text-sm">
              No sessions match the current filters.
            </div>
          )}
        </div>
      </div>

      {(uploadSession || replaceSession) && (
        <UploadModal
          session={uploadSession || replaceSession}
          onClose={() => { setUploadSession(null); setReplaceSession(null) }}
          onUploaded={() => fetchVideos()}
        />
      )}

      {previewSession && (
        <PreviewModal
          session={previewSession}
          onClose={() => setPreviewSession(null)}
        />
      )}
    </main>
  )
}
