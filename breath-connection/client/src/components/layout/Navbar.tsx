import { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

interface NavbarProps {
  session: Session
}

export default function Navbar({ session }: NavbarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="bg-teal-primary shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="font-serif text-xl text-white tracking-wide">
          The Breath Connection
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-teal-50 hidden sm:block">
            {session.user.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  )
}
