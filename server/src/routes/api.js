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

// GET /api/assessment — check if user has completed assessment
router.get('/assessment', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('user_assessments')
    .select('id, assigned_programme')
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: 'Failed to check assessment.' })
  }

  res.json({
    completed: !!data,
    assigned_programme: data?.assigned_programme ?? null,
  })
})

// POST /api/assessment — submit assessment
router.post('/assessment', requireAuth, async (req, res) => {
  // Check if already submitted
  const { data: existing, error: checkError } = await supabaseAdmin
    .from('user_assessments')
    .select('id')
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (checkError) {
    return res.status(500).json({ error: 'Failed to check existing assessment.' })
  }

  if (existing) {
    return res.status(409).json({ error: 'Assessment already submitted.' })
  }

  const {
    bolt_score,
    symptoms = [],
    stress_level,
    anxiety_level,
    sleep_quality,
    energy_level,
    panic_frequency,
    goals = [],
    activity_level,
    time_commitment,
    prior_experience,
    contraindications = [],
  } = req.body

  // Programme scoring
  const scores = { 1: 0, 2: 0, 3: 0, 4: 0 }

  // Programme 1 (HRV/Resilience)
  if (stress_level >= 4) scores[1] += 3
  if (goals.includes('resilience')) scores[1] += 2
  if (goals.includes('focus')) scores[1] += 2
  if (symptoms.includes('dry_mouth')) scores[1] += 1
  if (symptoms.includes('yawning')) scores[1] += 1
  if (symptoms.includes('shallow_breathing')) scores[1] += 1
  if (bolt_score >= 20 && bolt_score <= 30) scores[1] += 2

  // Programme 2 (Anxiety)
  if (anxiety_level >= 4) scores[2] += 4
  if (panic_frequency === 'sometimes' || panic_frequency === 'frequently') scores[2] += 3
  if (goals.includes('stress_anxiety')) scores[2] += 3
  if (bolt_score < 20) scores[2] += 2
  if (symptoms.includes('mouth_breathing')) scores[2] += 2

  // Programme 3 (Cardiovascular)
  if (activity_level === 'very_active' || activity_level === 'athlete') scores[3] += 4
  if (goals.includes('athletic_performance')) scores[3] += 3
  if (bolt_score < 20) scores[3] += 2
  if (time_commitment === '15min' || time_commitment === '20plus') scores[3] += 2
  if (goals.includes('resilience')) scores[3] += 1

  // Programme 4 (Sleep)
  if (sleep_quality <= 2) scores[4] += 4
  if (goals.includes('sleep')) scores[4] += 3
  if (symptoms.includes('snoring')) scores[4] += 2
  if (symptoms.includes('dry_mouth')) scores[4] += 2
  if (bolt_score < 20) scores[4] += 2

  // Assign programme with highest score (ties broken by lowest number)
  let assigned_programme = 1
  let maxScore = scores[1]
  for (let p = 2; p <= 4; p++) {
    if (scores[p] > maxScore) {
      maxScore = scores[p]
      assigned_programme = p
    }
  }

  // Pillar weights
  const pillarMap = {
    1: { biomechanics: 30, biochemistry: 30, neurophysiology: 40 },
    2: { biomechanics: 20, biochemistry: 40, neurophysiology: 40 },
    3: { biomechanics: 40, biochemistry: 40, neurophysiology: 20 },
    4: { biomechanics: 30, biochemistry: 40, neurophysiology: 30 },
  }
  const pillar_weights = pillarMap[assigned_programme]

  const { error: insertError } = await supabaseAdmin
    .from('user_assessments')
    .insert({
      user_id: req.user.id,
      bolt_score: bolt_score ?? null,
      symptoms,
      stress_level,
      anxiety_level,
      sleep_quality,
      energy_level,
      panic_frequency,
      goals,
      activity_level,
      time_commitment,
      prior_experience,
      contraindications,
      assigned_programme,
      pillar_weights,
    })

  if (insertError) {
    return res.status(500).json({ error: 'Failed to save assessment.' })
  }

  res.json({ assigned_programme, pillar_weights })
})
