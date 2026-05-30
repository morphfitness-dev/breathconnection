import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthCard from '../components/AuthCard'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/dashboard')
  }

  return (
    <AuthCard title="Create account" subtitle="Start your breathing journey">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]"
          />
        </div>
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
        <div>
          <label className="block font-sans text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C63]"
          />
        </div>
        {error && <p className="font-sans text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#0D5C63] text-white font-sans font-medium py-2.5 rounded-lg hover:bg-[#094a50] transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="font-sans text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0D5C63] hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthCard>
  )
}
