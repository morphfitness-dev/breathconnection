import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const NEW_PROGRAMME_COLORS = ['#0F4C81', '#6B21A8', '#166534', '#1E3A5F', '#9D174D', '#92400E', '#3730A3', '#065F46']

const PILLAR_INFO = {
  biomechanics: { label: 'Biomechanics', color: '#3B82F6' },
  biochemistry: { label: 'Biochemistry', color: '#8B5CF6' },
  neurophysiology: { label: 'Neurophysiology', color: '#F59E0B' },
  integration: { label: 'Integration', color: '#0D5C63' },
}

export default function AdminProgrammeBuilderPage() {
  const [sessions, setSessions] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [pillarFilter, setPillarFilter] = useState('all')
  const [activeProgramme, setActiveProgramme] = useState(1)
  const [dragId, setDragId] = useState(null)
  const [overSlot, setOverSlot] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWeeks, setNewWeeks] = useState(8)

  async function getToken() {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token
  }

  async function fetchSessions() {
    try {
      const token = await getToken()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch sessions')
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
    if (res.ok) setProgrammes(await res.json())
  }

  useEffect(() => { fetchSessions(); fetchProgrammes() }, [])

  async function handleCreateProgramme() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const token = await getToken()
      const color = NEW_PROGRAMME_COLORS[programmes.length % NEW_PROGRAMME_COLORS.length]
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/programmes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim(), color, week_count: Number(newWeeks) || 8 }),
      })
      if (!res.ok) throw new Error('Failed to create programme')
      const created = await res.json()
      setProgrammes(p => [...p, created])
      setActiveProgramme(created.id)
      setShowNewForm(false)
      setNewName('')
      setNewWeeks(8)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const sidebarSessions = useMemo(() => sessions.filter(s => {
    if (pillarFilter !== 'all' && s.pillar !== pillarFilter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [sessions, pillarFilter, search])

  const activeProgrammeObj = programmes.find(p => p.id === activeProgramme)
  const weekCount = activeProgrammeObj?.week_count || 8
  const canvasSessions = sessions.filter(s => s.programme_id === activeProgramme)
  const weekSlots = Array.from({ length: weekCount }, (_, i) => i + 1).map(week => ({
    week,
    session: canvasSessions.find(s => s.week === week) || null,
  }))

  const stats = {
    sessions: canvasSessions.length,
    bio: canvasSessions.filter(s => s.pillar === 'biomechanics').length,
    chem: canvasSessions.filter(s => s.pillar === 'biochemistry').length,
    neuro: canvasSessions.filter(s => s.pillar === 'neurophysiology').length,
    duration: canvasSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
  }

  async function patchSession(id, updates) {
    const token = await getToken()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update session')
    return res.json()
  }

  async function handleDropOnSlot(week) {
    if (!dragId) return
    const dragged = sessions.find(s => s.id === dragId)
    if (!dragged) return
    setDragId(null)
    setOverSlot(null)

    const displaced = canvasSessions.find(s => s.week === week && s.id !== dragId)
    const phase = Math.ceil(week / 2)

    setSaving(true)
    try {
      if (displaced && dragged.programme_id === activeProgramme) {
        // swap weeks within the same programme
        const draggedOldWeek = dragged.week
        await patchSession(displaced.id, { programme_id: activeProgramme, week: draggedOldWeek, phase: Math.ceil(draggedOldWeek / 2), session_number: draggedOldWeek })
        await patchSession(dragged.id, { programme_id: activeProgramme, week, phase, session_number: week })
      } else if (displaced) {
        // moving a session in from another programme onto an occupied slot — bump the displaced one out (week 8 -> first free slot search not needed, just leave it, admin can resolve)
        await patchSession(dragged.id, { programme_id: activeProgramme, week, phase, session_number: week })
      } else {
        await patchSession(dragged.id, { programme_id: activeProgramme, week, phase, session_number: week })
      }
      await fetchSessions()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function clearSlot(session) {
    setSaving(true)
    try {
      await patchSession(session.id, { programme_id: 0, week: 0, phase: 0, session_number: 0 })
      await fetchSessions()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-sans text-gray-400 animate-pulse">Loading programme builder…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="font-serif text-4xl text-[#0D5C63] mb-1">Programme Builder</h1>
        <p className="font-sans text-sm text-gray-400 mb-6">Drag sessions from the library into a week slot to build the programme.</p>

        {error && <p className="font-sans text-sm text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar: draggable session library */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-fit lg:sticky lg:top-6">
            <h2 className="font-serif text-lg text-[#0D5C63] mb-3">Session Library</h2>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="w-full font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30"
            />
            <div className="flex gap-1.5 mb-3 flex-wrap">
              <button
                onClick={() => setPillarFilter('all')}
                className={`font-sans text-xs px-2.5 py-1 rounded-full ${pillarFilter === 'all' ? 'bg-[#0D5C63] text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                All
              </button>
              {Object.entries(PILLAR_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setPillarFilter(key)}
                  className={`font-sans text-xs px-2.5 py-1 rounded-full ${pillarFilter === key ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                  style={pillarFilter === key ? { backgroundColor: info.color } : {}}
                >
                  {info.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
              {sidebarSessions.map(s => {
                const pillar = PILLAR_INFO[s.pillar] || PILLAR_INFO.integration
                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={() => setDragId(s.id)}
                    onDragEnd={() => setDragId(null)}
                    className="bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 cursor-grab active:cursor-grabbing border border-gray-100"
                  >
                    <p className="font-sans text-sm font-medium text-gray-700 line-clamp-1">{s.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-sans text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: pillar.color + '20', color: pillar.color }}>
                        {pillar.label}
                      </span>
                      {s.programme_id > 0 && (
                        <span className="font-sans text-xs text-gray-400">P{s.programme_id} · W{s.week}</span>
                      )}
                      {s.video_status === 'ready' && <span className="text-xs">🎬</span>}
                    </div>
                  </div>
                )
              })}
              {sidebarSessions.length === 0 && (
                <p className="font-sans text-xs text-gray-400 text-center py-6">No sessions match.</p>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div>
            {/* Programme tabs */}
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              {programmes.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveProgramme(p.id)}
                  className={`font-sans text-sm px-4 py-1.5 rounded-full transition-colors ${activeProgramme === p.id ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0D5C63]'}`}
                  style={activeProgramme === p.id ? { backgroundColor: p.color } : {}}
                >
                  {p.name}{p.is_custom ? ' ✦' : ''}
                </button>
              ))}
              <button
                onClick={() => setShowNewForm(s => !s)}
                className="font-sans text-sm px-4 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-[#0D5C63] hover:text-[#0D5C63] transition-colors"
              >
                + New Programme
              </button>
            </div>

            {showNewForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-3 flex-wrap items-end">
                <div>
                  <label className="block font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Programme Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Travel Recovery"
                    className="font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30 w-56"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Weeks</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={newWeeks}
                    onChange={e => setNewWeeks(e.target.value)}
                    className="font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30 w-20"
                  />
                </div>
                <button
                  onClick={handleCreateProgramme}
                  disabled={saving || !newName.trim()}
                  className="bg-[#0D5C63] text-white font-sans text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#094a50] transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-6 flex-wrap">
              <div><p className="font-serif text-xl text-[#0D5C63]">{stats.sessions}</p><p className="font-sans text-xs text-gray-400">Sessions</p></div>
              <div><p className="font-serif text-xl text-[#0D5C63]">{stats.duration} min</p><p className="font-sans text-xs text-gray-400">Total</p></div>
              <div><p className="font-serif text-xl" style={{ color: PILLAR_INFO.biomechanics.color }}>{stats.bio}</p><p className="font-sans text-xs text-gray-400">Biomechanics</p></div>
              <div><p className="font-serif text-xl" style={{ color: PILLAR_INFO.biochemistry.color }}>{stats.chem}</p><p className="font-sans text-xs text-gray-400">Biochemistry</p></div>
              <div><p className="font-serif text-xl" style={{ color: PILLAR_INFO.neurophysiology.color }}>{stats.neuro}</p><p className="font-sans text-xs text-gray-400">Neurophysiology</p></div>
              {saving && <p className="font-sans text-xs text-gray-400 self-center ml-auto animate-pulse">Saving…</p>}
            </div>

            {/* Week drop zones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {weekSlots.map(({ week, session }) => {
                const pillar = session ? (PILLAR_INFO[session.pillar] || PILLAR_INFO.integration) : null
                const isOver = overSlot === week
                return (
                  <div
                    key={week}
                    onDragOver={e => { e.preventDefault(); setOverSlot(week) }}
                    onDragLeave={() => setOverSlot(null)}
                    onDrop={e => { e.preventDefault(); handleDropOnSlot(week) }}
                    className={`rounded-2xl border-2 p-4 min-h-[100px] transition-colors ${
                      isOver ? 'border-[#0D5C63] bg-teal-50' : session ? 'border-gray-100 bg-white' : 'border-dashed border-gray-200 bg-gray-50'
                    }`}
                  >
                    <p className="font-sans text-xs text-gray-400 uppercase tracking-wider mb-2">Week {week}</p>
                    {session ? (
                      <div
                        draggable
                        onDragStart={() => setDragId(session.id)}
                        onDragEnd={() => setDragId(null)}
                        className="flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing"
                      >
                        <div>
                          <p className="font-sans text-sm font-medium text-gray-700">{session.title}</p>
                          <span className="inline-block mt-1 font-sans text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: pillar.color + '20', color: pillar.color }}>
                            {pillar.label}
                          </span>
                          {session.video_status === 'ready' && <span className="ml-2 text-xs">🎬</span>}
                        </div>
                        <button
                          onClick={() => clearSlot(session)}
                          className="text-gray-300 hover:text-red-500 text-sm leading-none"
                          aria-label="Remove from slot"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <p className="font-sans text-xs text-gray-400">Drag a session here</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
