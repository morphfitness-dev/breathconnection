import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await window.fetch(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (!res.ok) { setError('Failed to load dashboard'); setLoading(false); return }
    setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refresh: fetch }
}
