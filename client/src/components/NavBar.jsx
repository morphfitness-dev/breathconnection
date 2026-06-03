import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HelpModal from './HelpModal'

export default function NavBar() {
  const { user, profile, signOut } = useAuth()
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <>
      <nav className="bg-[#0D5C63] text-white px-6 py-4 flex items-center justify-between shadow-sm">
        <Link to="/" className="font-serif text-xl tracking-wide">
          The Breath Connection
        </Link>

        {user && (
          <div className="flex items-center gap-4 font-sans text-sm">
            {profile?.is_admin && (
              <Link
                to="/admin"
                className="text-white/80 hover:text-white transition-colors"
              >
                Admin
              </Link>
            )}
            <Link to="/progress" className="text-white/80 hover:text-white transition-colors">Progress</Link>
            <button onClick={() => setHelpOpen(true)} className="text-white/60 hover:text-white font-sans text-sm transition-colors">Help</button>
            <span className="text-white/80">{user.email}</span>
            <button
              onClick={signOut}
              className="bg-[#E8A87C] text-[#0D5C63] font-medium px-4 py-1.5 rounded-full hover:bg-amber-300 transition-colors"
            >
              Log Out
            </button>
          </div>
        )}
      </nav>
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  )
}
