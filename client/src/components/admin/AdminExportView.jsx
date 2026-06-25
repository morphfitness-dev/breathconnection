import { supabase } from '../../lib/supabase'

export default function AdminExportView() {
  async function handleExport() {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/export`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'breathconnection-users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl text-[#0D5C63] mb-2">Export</h1>
      <p className="font-sans text-gray-500 text-sm mb-6">
        Download a CSV of all users with their programme, BOLT scores, and wellbeing averages.
        Includes: Name, Email, Sign-up Date, Programme, Sessions Completed, BOLT Start, BOLT Latest, Wellbeing Avg (7d).
      </p>
      <button
        onClick={handleExport}
        className="bg-[#0D5C63] text-white font-sans font-medium px-6 py-3 rounded-xl hover:bg-[#094a50] transition-colors"
      >
        Export All Users (CSV)
      </button>
    </div>
  )
}
