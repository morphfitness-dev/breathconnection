import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthCard from '../components/AuthCard'

const TRIAL_MODE = import.meta.env.VITE_TRIAL_MODE === 'true'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')

    // Validate invite code if provided or required
    if (TRIAL_MODE || inviteCode.trim()) {
      if (!inviteCode.trim()) return setError('An invite code is required to sign up.')
      const validateRes = await fetch(`${import.meta.env.VITE_API_URL}/api/validate-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() }),
      })
      const validateData = await validateRes.json()
      if (!validateRes.ok || !validateData.valid) {
        return setError(validateData.error || 'Invalid or already used invite code.')
      }
    }

    setLoading(true)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    if (signUpError) return setError(signUpError.message)

    // Mark invite code as used if one was entered
    if (inviteCode.trim() && signUpData?.session) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/use-invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${signUpData.session.access_token}`,
          },
          body: JSON.stringify({ code: inviteCode.trim() }),
        })
      } catch {
        // Non-fatal — don't block navigation
      }
    }

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
          <label className="block font-sans text-sm font-medium text-gray-700 mb-1">
            Invite Code
            {TRIAL_MODE ? <span className="text-red-500 ml-1">*</span> : <span className="text-gray-400 ml-1 font-normal">(optional)</span>}
          </label>
          <input
            type="text"
            required={TRIAL_MODE}
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder={TRIAL_MODE ? 'Required to sign up' : 'Enter code if you have one'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 font-sans text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D5C63]"
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
