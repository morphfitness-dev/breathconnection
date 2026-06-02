import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assessmentCompleted, setAssessmentCompleted] = useState(null)
  const [assessmentLoading, setAssessmentLoading] = useState(true)

  async function checkAssessment(accessToken) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assessment`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      setAssessmentCompleted(json.completed ?? false)
    } catch {
      setAssessmentCompleted(false)
    } finally {
      setAssessmentLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        checkAssessment(session.access_token)
      } else {
        setAssessmentCompleted(null)
        setAssessmentLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAssessment(session.access_token)
      } else {
        setAssessmentCompleted(null)
        setAssessmentLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signOut,
      assessmentCompleted,
      setAssessmentCompleted,
      assessmentLoading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
