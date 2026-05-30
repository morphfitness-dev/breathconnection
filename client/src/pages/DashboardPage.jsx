import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl text-[#0D5C63] mb-2">
          Hello, {user?.user_metadata?.full_name || user?.email}
        </h1>
        <p className="font-sans text-gray-500 text-lg mb-10">
          Your breathing dashboard is being built. More coming soon.
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8A87C]/20 flex items-center justify-center text-2xl">🌬️</div>
          <div>
            <h2 className="font-serif text-xl text-[#0D5C63]">Welcome to The Breath Connection</h2>
            <p className="font-sans text-sm text-gray-500 mt-1">Your personalised breathing programmes will appear here.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
