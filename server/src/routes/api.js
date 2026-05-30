import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const router = Router()

router.get('/me', requireAuth, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('users_profile')
    .select('*')
    .eq('id', req.user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Failed to fetch profile.' })
  }

  res.json({
    id: req.user.id,
    email: req.user.email,
    profile: profile ?? null,
  })
})
