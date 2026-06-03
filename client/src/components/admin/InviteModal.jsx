import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Spinner from '../Spinner'

export default function InviteModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to send invite')
      setResult(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <h2 className="font-serif text-2xl text-[#0D5C63] mb-2">Invite User</h2>
        <p className="font-sans text-sm text-gray-500 mb-6">
          Generate an invite code and send it to a user's email address.
        </p>

        {result ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-sans text-sm text-green-700 font-medium">Invite created!</p>
              <p className="font-sans text-sm text-green-600 mt-1">
                Sent to: <strong>{result.email}</strong>
              </p>
              <div className="mt-3 bg-white border border-green-200 rounded-lg px-4 py-3">
                <p className="font-sans text-xs text-gray-400 mb-1">Invite Code</p>
                <p className="font-mono text-xl font-bold text-[#0D5C63] tracking-widest">{result.code}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#0D5C63] text-white font-sans font-medium py-2.5 rounded-xl hover:bg-[#094a50] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]"
              />
            </div>
            {error && <p className="font-sans text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 font-sans text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#0D5C63] text-white font-sans text-sm font-medium py-2.5 rounded-xl hover:bg-[#094a50] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Spinner />}
                {loading ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
