import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminUsersView from '../components/admin/AdminUsersView'
import AdminExportView from '../components/admin/AdminExportView'
import InviteModal from '../components/admin/InviteModal'

export default function AdminPage() {
  const [tab, setTab] = useState('users')
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Admin sub-nav */}
      <div className="bg-[#094a50] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex gap-1">
          {['users', 'export'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-sans text-sm px-4 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'}`}>
              {t}
            </button>
          ))}
          <Link to="/admin/videos"
            className="font-sans text-sm px-4 py-1.5 rounded-lg text-white/60 hover:text-white transition-colors">
            Videos
          </Link>
        </div>
        <button onClick={() => setInviteOpen(true)}
          className="bg-[#E8A87C] text-[#0D5C63] font-sans text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-amber-300 transition-colors">
          + Invite User
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'users' && <AdminUsersView />}
        {tab === 'export' && <AdminExportView />}
      </div>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  )
}
