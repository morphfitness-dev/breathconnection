import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import UserDetailView from './UserDetailView'

function FlagBadge({ flag }) {
  const colors = { yellow: 'bg-yellow-400', orange: 'bg-orange-400' }
  return (
    <span title={flag.label} className={`inline-block w-2.5 h-2.5 rounded-full ${colors[flag.color]} mr-1`} />
  )
}

function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col) return <span className="ml-1 text-white/30">↕</span>
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRelative(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const COLUMNS = [
  { key: 'full_name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'signup_date', label: 'Sign-up' },
  { key: 'programme', label: 'Programme' },
  { key: 'current_week', label: 'Week' },
  { key: 'sessions_completed', label: 'Sessions' },
  { key: 'last_active', label: 'Last Active' },
  { key: 'bolt_start', label: 'BOLT' },
  { key: 'wellbeing_avg', label: 'Wellbeing' },
  { key: 'flags', label: 'Flags' },
]

export default function AdminUsersView() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('signup_date')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedUserId, setSelectedUserId] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      let av = a[sortBy]
      let bv = b[sortBy]
      if (sortBy === 'flags') { av = a.flags.length; bv = b.flags.length }
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [users, sortBy, sortDir])

  if (selectedUserId) {
    return (
      <UserDetailView
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-[#0D5C63]">Users</h1>
        <span className="font-sans text-sm text-gray-400">{users.length} total</span>
      </div>

      {loading && (
        <div className="text-center py-16 font-sans text-gray-400">Loading users…</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 font-sans text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0D5C63] text-white">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-4 py-3 text-left font-sans text-xs font-medium uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:bg-[#094a50] transition-colors"
                    >
                      {col.label}
                      <SortIcon col={col.key} sortBy={sortBy} sortDir={sortDir} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className="hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-sans text-sm font-medium text-gray-900 whitespace-nowrap">
                      {user.full_name}
                      {user.is_admin && <span className="ml-2 text-xs bg-[#0D5C63] text-white px-1.5 py-0.5 rounded">admin</span>}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-500 whitespace-nowrap">{user.email}</td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-500 whitespace-nowrap">{formatDate(user.signup_date)}</td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-700 whitespace-nowrap">{user.programme}</td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-700 text-center">{user.current_week ?? '—'}</td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-700 text-center">
                      {user.total_sessions > 0 ? `${user.sessions_completed}/${user.total_sessions}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-500 whitespace-nowrap">{formatRelative(user.last_active)}</td>
                    <td className="px-4 py-3 font-sans text-sm text-gray-700 text-center">
                      {user.bolt_start != null ? (
                        <span>
                          {user.bolt_start}
                          {user.bolt_latest != null && user.bolt_latest !== user.bolt_start && (
                            <span className={`ml-1 text-xs font-medium ${user.bolt_latest > user.bolt_start ? 'text-green-600' : 'text-red-500'}`}>
                              →{user.bolt_latest}
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-center">
                      {user.wellbeing_avg != null ? (
                        <span className={`font-medium ${user.wellbeing_avg >= 4 ? 'text-green-600' : user.wellbeing_avg >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                          {user.wellbeing_avg}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center flex-wrap gap-0.5">
                        {user.flags.map((flag, i) => <FlagBadge key={i} flag={flag} />)}
                        {user.flags.length === 0 && <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-12 text-center font-sans text-sm text-gray-400">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
