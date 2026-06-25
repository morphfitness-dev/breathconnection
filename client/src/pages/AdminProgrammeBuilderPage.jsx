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
  const [nameDraft, setNameDraft] = useState('')

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

  const activeProgrammeObj = programmes.find(p => p.id === activeProgramme)
  useEffect(() => { setNameDraft(activeProgrammeObj?.name || '') }, [activeProgrammeObj?.id, activeProgrammeObj?.name])

  async function patchProgramme(id, updates) {
    const token = await getToken()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/programmes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update programme')
    const updated = await res.json()
    setProgrammes(ps => ps.map(p => (p.id === id ? updated : p)))
    return updated
  }

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

  async function handleRenameProgramme() {
    if (!activeProgrammeObj || !nameDraft.trim() || nameDraft === activeProgrammeObj.name) return
    setSaving(true)
    try {
      await patchProgramme(activeProgrammeObj.id, { name: nameDraft.trim() })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddWeek() {
    if (!activeProgrammeObj) return
    setSaving(true)
    try {
      await patchProgramme(activeProgrammeObj.id, { week_count: (activeProgrammeObj.week_count || 8) + 1 })
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
      } else {
        // moving in from the library, or from another programme onto an occupied slot
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

  async function handleClearProgramme() {
    if (!canvasSessions.length) return
    setSaving(true)
    try {
      await Promise.all(canvasSessions.map(s => patchSession(s.id, { programme_id: 0, week: 0, phase: 0, session_number: 0 })))
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
        <p className="font-sans text-sm text-gray-400 mb-6">Drag sessions from the library into a week to build the programme.</p>

        {error && <p className="font-sans text-sm text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar: draggable session library + saved programmes */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
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
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto">
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

            {/* Saved Programmes — switch which programme the canvas edits */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-serif text-lg text-[#0D5C63] mb-3">Saved Programmes</h2>
              <div className="flex flex-col gap-1.5">
                {programmes.map(p => {
                  const sessionCount = sessions.filter(s => s.programme_id === p.id).length
                  const duration = sessions.filter(s => s.programme_id === p.id).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveProgramme(p.id)}
                      className={`flex items-center justify-between text-left rounded-xl px-3 py-2.5 transition-colors ${
                        activeProgramme === p.id ? 'bg-[#0D5C63]/10 ring-1 ring-[#0D5C63]/30' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <div>
                          <p className="font-sans text-sm font-medium text-gray-700">{p.name}{p.is_custom ? ' ✦' : ''}</p>
                          <p className="font-sans text-xs text-gray-400">{sessionCount} sessions · {duration} min</p>
                        </div>
                      </div>
                      <span className="text-gray-300 font-sans text-xs">→</span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setShowNewForm(s => !s)}
                className="w-full mt-3 font-sans text-sm px-4 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-[#0D5C63] hover:text-[#0D5C63] transition-colors"
              >
                + New Programme
              </button>
              {showNewForm && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Programme name"
                    className="w-full font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={newWeeks}
                      onChange={e => setNewWeeks(e.target.value)}
                      className="w-20 font-sans text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5C63]/30"
                    />
                    <span className="font-sans text-xs text-gray-400 self-center">weeks</span>
                    <button
                      onClick={handleCreateProgramme}
                      disabled={saving || !newName.trim()}
                      className="ml-auto bg-[#0D5C63] text-white font-sans text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#094a50] transition-colors disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div>
            {/* Canvas header: editable programme name + actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-end justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block font-sans text-xs text-gray-400 uppercase tracking-wider mb-1">Programme Name</label>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onBlur={handleRenameProgramme}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                  className="w-full font-serif text-lg text-[#0D5C63] border-b border-transparent hover:border-gray-200 focus:border-[#0D5C63] focus:outline-none px-1 py-1 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleClearProgramme} className="font-sans text-xs border border-gray-200 text-gray-500 rounded-lg px-3 py-1.5 hover:border-red-300 hover:text-red-500 transition-colors">
                  Clear
                </button>
                <button onClick={handleAddWeek} className="font-sans text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:border-[#0D5C63] hover:text-[#0D5C63] transition-colors">
                  + Week
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-6 flex-wrap">
              <div><p className="font-serif text-xl text-[#0D5C63]">{stats.sessions}</p><p className="font-sans text-xs text-gray-400">Sessions</p></div>
              <div><p className="font-serif text-xl text-[#0D5C63]">{weekCount}</p><p className="font-sans text-xs text-gray-400">Weeks</p></div>
              <div><p className="font-serif text-xl text-[#0D5C63]">{stats.duration} min</p><p className="font-sans text-xs text-gray-400">Total</p></div>
              <div><p className="font-serif text-xl" style={{ color: PILLAR_INFO.biomechanics.color }}>{stats.bio}</p><p className="font-sans text-xs text-gray-400">Biomechanics</p></div>
              <div><p className="font-serif text-xl" style={{ color: PILLAR_INFO.biochemistry.color }}>{stats.chem}</p><p className="font-sans text-xs text-gray-400">Biochemistry</p></div>
              <div><p className="font-serif text-xl" style={{ color: PILLAR_INFO.neurophysiology.color }}>{stats.neuro}</p><p className="font-sans text-xs text-gray-400">Neurophysiology</p></div>
              {saving && <p className="font-sans text-xs text-gray-400 self-center ml-auto animate-pulse">Saving…</p>}
            </div>

            {/* Drop zone: ordered list of week slots, like a day-by-day programme canvas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              {canvasSessions.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-2xl mb-2">↙</div>
                  <p className="font-sans text-sm font-medium text-gray-600">Drag sessions here</p>
                  <p className="font-sans text-xs text-gray-400 mt-1">From the library on the left · Drop into any week below</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {weekSlots.map(({ week, session }) => {
                  const pillar = session ? (PILLAR_INFO[session.pillar] || PILLAR_INFO.integration) : null
                  const isOver = overSlot === week
                  return (
                    <div key={week} className="flex items-stretch gap-3">
                      <div className="w-16 shrink-0 flex flex-col items-center justify-center font-sans text-xs text-gray-400 uppercase tracking-wider">
                        Week<span className="font-serif text-lg text-[#0D5C63]">{week}</span>
                      </div>
                      <div
                        onDragOver={e => { e.preventDefault(); setOverSlot(week) }}
                        onDragLeave={() => setOverSlot(null)}
                        onDrop={e => { e.preventDefault(); handleDropOnSlot(week) }}
                        className={`flex-1 rounded-xl border-2 px-4 py-3 transition-colors ${
                          isOver ? 'border-[#0D5C63] bg-teal-50' : session ? 'border-gray-100 bg-gray-50' : 'border-dashed border-gray-200'
                        }`}
                      >
                        {session ? (
                          <div
                            draggable
                            onDragStart={() => setDragId(session.id)}
                            onDragEnd={() => setDragId(null)}
                            className="flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
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
                              className="text-gray-300 hover:text-red-500 text-base leading-none"
                              aria-label="Remove from slot"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <p className="font-sans text-xs text-gray-400">Drag a session here</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
