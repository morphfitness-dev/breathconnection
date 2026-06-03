import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthCard from '../components/AuthCard'
import Spinner from '../components/Spinner'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/dashboard')
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]"
          />
        </div>
        <div>
          <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]"
          />
        </div>
        {error && <p className="font-sans text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#0D5C63] text-white font-sans font-medium py-2.5 rounded-lg hover:bg-[#094a50] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <div className="flex items-center justify-between font-sans text-sm text-gray-500">
          <Link to="/signup" className="hover:text-[#0D5C63]">Create an account</Link>
          <button type="button" className="hover:text-[#0D5C63]" onClick={() => alert('Password reset coming soon.')}>
            Forgot password?
          </button>
        </div>
      </form>
    </AuthCard>
  )
}
