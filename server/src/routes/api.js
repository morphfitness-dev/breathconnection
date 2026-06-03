import { Router } from 'express'
import Mux from '@mux/mux-node'
import { requireAuth } from '../middleware/requireAuth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const router = Router()

async function requireAdmin(req, res, next) {
  const { data: profile } = await supabaseAdmin
    .from('users_profile')
    .select('is_admin')
    .eq('id', req.user.id)
    .single()
  if (!profile?.is_admin) return res.status(403).json({ error: 'Admin access required.' })
  next()
}

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

// Programme metadata
const PROGRAMMES = {
  1: { name: 'HRV Optimisation', description: 'Rebuilding autonomic resilience through all three pillars' },
  2: { name: 'Anxiety Management', description: 'Calming the nervous system through breath, posture, and chemistry' },
  3: { name: 'Cardiovascular Endurance', description: 'Expanding aerobic capacity through breathing efficiency' },
  4: { name: 'Sleep Improvement', description: 'Preparing the body and nervous system for deep, restorative rest' },
}

// GET /api/dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  const userId = req.user.id

  // Fetch assessment
  const { data: assessment, error: assessErr } = await supabaseAdmin
    .from('user_assessments')
    .select('assigned_programme, bolt_score')
    .eq('user_id', userId)
    .maybeSingle()

  if (assessErr) return res.status(500).json({ error: 'Failed to fetch assessment.' })
  if (!assessment) return res.status(404).json({ error: 'No assessment found.' })

  const programmeId = assessment.assigned_programme

  // Fetch all sessions for programme
  const { data: sessions, error: sessErr } = await supabaseAdmin
    .from('programme_sessions')
    .select('*')
    .eq('programme_id', programmeId)
    .order('session_number', { ascending: true })

  if (sessErr) return res.status(500).json({ error: 'Failed to fetch sessions.' })

  // Fetch completed session IDs
  const { data: completions, error: compErr } = await supabaseAdmin
    .from('user_session_completions')
    .select('session_id, comfort_rating, notes, completed_at')
    .eq('user_id', userId)

  if (compErr) return res.status(500).json({ error: 'Failed to fetch completions.' })

  const completedIds = new Set((completions || []).map(c => c.session_id))

  const sessionsWithStatus = sessions.map(s => ({
    ...s,
    completed: completedIds.has(s.id),
  }))

  const currentSession = sessionsWithStatus.find(s => !s.completed) || null

  // Last check-in
  const { data: checkins } = await supabaseAdmin
    .from('user_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  const lastCheckin = checkins?.[0] || null

  const prog = PROGRAMMES[programmeId] || {}

  res.json({
    programme_id: programmeId,
    programme_name: prog.name,
    programme_description: prog.description,
    sessions: sessionsWithStatus,
    currentSession,
    completedCount: completedIds.size,
    totalCount: sessions.length,
    lastCheckin,
    boltScore: assessment.bolt_score,
  })
})

// GET /api/sessions/current
router.get('/sessions/current', requireAuth, async (req, res) => {
  const userId = req.user.id

  const { data: assessment } = await supabaseAdmin
    .from('user_assessments')
    .select('assigned_programme')
    .eq('user_id', userId)
    .maybeSingle()

  if (!assessment) return res.status(404).json({ error: 'No assessment found.' })

  const { data: sessions } = await supabaseAdmin
    .from('programme_sessions')
    .select('*')
    .eq('programme_id', assessment.assigned_programme)
    .order('session_number', { ascending: true })

  const { data: completions } = await supabaseAdmin
    .from('user_session_completions')
    .select('session_id')
    .eq('user_id', userId)

  const completedIds = new Set((completions || []).map(c => c.session_id))
  const current = (sessions || []).find(s => !completedIds.has(s.id)) || null

  res.json(current)
})

// POST /api/sessions/:id/complete
router.post('/sessions/:id/complete', requireAuth, async (req, res) => {
  const { comfort_rating, notes } = req.body
  const { error } = await supabaseAdmin
    .from('user_session_completions')
    .upsert({
      user_id: req.user.id,
      session_id: req.params.id,
      comfort_rating: comfort_rating || null,
      notes: notes || null,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,session_id' })

  if (error) return res.status(500).json({ error: 'Failed to record completion.' })
  res.json({ ok: true })
})

// POST /api/checkins
router.post('/checkins', requireAuth, async (req, res) => {
  const { wellbeing_score, energy_score, notes } = req.body
  const { data, error } = await supabaseAdmin
    .from('user_checkins')
    .insert({
      user_id: req.user.id,
      wellbeing_score,
      energy_score,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to save check-in.' })
  res.json(data)
})

// GET /api/checkins
router.get('/checkins', requireAuth, async (req, res) => {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('user_checkins')
    .select('*')
    .eq('user_id', req.user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'Failed to fetch check-ins.' })
  res.json(data)
})

// POST /api/bolt-scores
router.post('/bolt-scores', requireAuth, async (req, res) => {
  const { bolt_score, session_id } = req.body
  const { data, error } = await supabaseAdmin
    .from('user_bolt_scores')
    .insert({
      user_id: req.user.id,
      bolt_score,
      session_id: session_id || null,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to save BOLT score.' })
  res.json(data)
})

// GET /api/sessions/:id
router.get('/sessions/:id', requireAuth, async (req, res) => {
  const { data: session, error } = await supabaseAdmin
    .from('programme_sessions')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error || !session) return res.status(404).json({ error: 'Session not found.' })

  const { data: completion } = await supabaseAdmin
    .from('user_session_completions')
    .select('comfort_rating, notes, completed_at')
    .eq('user_id', req.user.id)
    .eq('session_id', req.params.id)
    .maybeSingle()

  res.json({
    ...session,
    completed: !!completion,
    comfort_rating: completion?.comfort_rating ?? null,
    completion_notes: completion?.notes ?? null,
  })
})

// GET /api/progress
router.get('/progress', requireAuth, async (req, res) => {
  const userId = req.user.id

  // Assessment (onboarding bolt score + programme + created_at)
  const { data: assessment } = await supabaseAdmin
    .from('user_assessments')
    .select('bolt_score, assigned_programme, created_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!assessment) return res.status(404).json({ error: 'No assessment found.' })

  const programmeId = assessment.assigned_programme

  // All programme sessions
  const { data: sessions } = await supabaseAdmin
    .from('programme_sessions')
    .select('id, session_number, title, pillar, phase, week')
    .eq('programme_id', programmeId)
    .order('session_number', { ascending: true })

  // All completions for this user (with session join)
  const { data: completions } = await supabaseAdmin
    .from('user_session_completions')
    .select('session_id, completed_at, comfort_rating')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true })

  // BOLT scores (exclude onboarding — those come from user_assessments)
  const { data: boltScores } = await supabaseAdmin
    .from('user_bolt_scores')
    .select('bolt_score, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true })

  // Check-ins (last 30 days)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: checkins } = await supabaseAdmin
    .from('user_checkins')
    .select('wellbeing_score, energy_score, created_at')
    .eq('user_id', userId)
    .gte('created_at', since30)
    .order('created_at', { ascending: true })

  // Build bolt_scores array: start with onboarding score
  const allBoltScores = []
  if (assessment.bolt_score != null) {
    allBoltScores.push({ date: assessment.created_at, score: assessment.bolt_score, source: 'onboarding' })
  }
  for (const b of (boltScores || [])) {
    allBoltScores.push({ date: b.recorded_at, score: b.bolt_score, source: 'session' })
  }

  // Completed session IDs set
  const completedIds = new Set((completions || []).map(c => c.session_id))
  const completedCount = completedIds.size
  const totalCount = (sessions || []).length

  // Current session = first not completed
  const currentSession = (sessions || []).find(s => !completedIds.has(s.id))
  const currentPhase = currentSession?.phase ?? 4
  const currentWeek = currentSession?.week ?? 8
  const currentPillar = currentSession?.pillar ?? 'integration'

  // Next BOLT session: sessions 3 and 8 require BOLT scores
  const boltSessions = (sessions || []).filter(s => s.session_number === 3 || s.session_number === 8)
  const nextBoltSession = boltSessions.find(s => !completedIds.has(s.id))

  // Estimated completion: sessions remaining, 1 per day
  const remaining = totalCount - completedCount
  const estimatedCompletionDate = new Date(Date.now() + remaining * 24 * 60 * 60 * 1000).toISOString()

  // Wellbeing averages
  const allCheckins = checkins || []
  const firstWeekCheckins = allCheckins.slice(0, 7)
  const lastWeekCheckins = allCheckins.slice(-7)
  const avg = arr => arr.length ? Math.round(arr.reduce((s, c) => s + c.wellbeing_score, 0) / arr.length * 10) / 10 : null

  // Completions enriched with pillar (for heatmap)
  const sessionMap = Object.fromEntries((sessions || []).map(s => [s.id, s]))
  const enrichedCompletions = (completions || []).map(c => ({
    completed_at: c.completed_at,
    session_id: c.session_id,
    pillar: sessionMap[c.session_id]?.pillar ?? 'integration',
    session_number: sessionMap[c.session_id]?.session_number,
  }))

  const PROGRAMMES = {
    1: 'HRV Optimisation',
    2: 'Anxiety Management',
    3: 'Cardiovascular Endurance',
    4: 'Sleep Improvement',
  }

  res.json({
    bolt_scores: allBoltScores,
    checkins: allCheckins,
    completions: enrichedCompletions,
    programme: {
      id: programmeId,
      name: PROGRAMMES[programmeId] || `Programme ${programmeId}`,
      assigned_at: assessment.created_at,
      current_phase: currentPhase,
      current_week: currentWeek,
      current_pillar: currentPillar,
      estimated_completion: estimatedCompletionDate,
      total_sessions: totalCount,
    },
    onboarding_bolt: assessment.bolt_score,
    completed_count: completedCount,
    total_count: totalCount,
    next_bolt_session: nextBoltSession ? nextBoltSession.session_number : null,
    wellbeing_avg_first_week: avg(firstWeekCheckins),
    wellbeing_avg_last_week: avg(lastWeekCheckins),
  })
})

// GET /api/progress
router.get('/progress', requireAuth, async (req, res) => {
  const userId = req.user.id

  // Assessment (onboarding bolt score + programme + created_at)
  const { data: assessment } = await supabaseAdmin
    .from('user_assessments')
    .select('bolt_score, assigned_programme, created_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!assessment) return res.status(404).json({ error: 'No assessment found.' })

  const programmeId = assessment.assigned_programme

  // All programme sessions
  const { data: sessions } = await supabaseAdmin
    .from('programme_sessions')
    .select('id, session_number, title, pillar, phase, week')
    .eq('programme_id', programmeId)
    .order('session_number', { ascending: true })

  // All completions for this user (with session join)
  const { data: completions } = await supabaseAdmin
    .from('user_session_completions')
    .select('session_id, completed_at, comfort_rating')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true })

  // BOLT scores (exclude onboarding — those come from user_assessments)
  const { data: boltScores } = await supabaseAdmin
    .from('user_bolt_scores')
    .select('bolt_score, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true })

  // Check-ins (last 30 days)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: checkins } = await supabaseAdmin
    .from('user_checkins')
    .select('wellbeing_score, energy_score, created_at')
    .eq('user_id', userId)
    .gte('created_at', since30)
    .order('created_at', { ascending: true })

  // Build bolt_scores array: start with onboarding score
  const allBoltScores = []
  if (assessment.bolt_score != null) {
    allBoltScores.push({ date: assessment.created_at, score: assessment.bolt_score, source: 'onboarding' })
  }
  for (const b of (boltScores || [])) {
    allBoltScores.push({ date: b.recorded_at, score: b.bolt_score, source: 'session' })
  }

  // Completed session IDs set
  const completedIds = new Set((completions || []).map(c => c.session_id))
  const completedCount = completedIds.size
  const totalCount = (sessions || []).length

  // Current session = first not completed
  const currentSession = (sessions || []).find(s => !completedIds.has(s.id))
  const currentPhase = currentSession?.phase ?? 4
  const currentWeek = currentSession?.week ?? 8
  const currentPillar = currentSession?.pillar ?? 'integration'

  // Next BOLT session: sessions 3 and 8 require BOLT scores
  const boltSessions = (sessions || []).filter(s => s.session_number === 3 || s.session_number === 8)
  const nextBoltSession = boltSessions.find(s => !completedIds.has(s.id))

  // Estimated completion: sessions remaining, 1 per day
  const remaining = totalCount - completedCount
  const estimatedCompletionDate = new Date(Date.now() + remaining * 24 * 60 * 60 * 1000).toISOString()

  // Wellbeing averages
  const allCheckins = checkins || []
  const firstWeekCheckins = allCheckins.slice(0, 7)
  const lastWeekCheckins = allCheckins.slice(-7)
  const avg = arr => arr.length ? Math.round(arr.reduce((s, c) => s + c.wellbeing_score, 0) / arr.length * 10) / 10 : null

  // Completions enriched with pillar (for heatmap)
  const sessionMap = Object.fromEntries((sessions || []).map(s => [s.id, s]))
  const enrichedCompletions = (completions || []).map(c => ({
    completed_at: c.completed_at,
    session_id: c.session_id,
    pillar: sessionMap[c.session_id]?.pillar ?? 'integration',
    session_number: sessionMap[c.session_id]?.session_number,
  }))

  const PROGRAMMES = {
    1: 'HRV Optimisation',
    2: 'Anxiety Management',
    3: 'Cardiovascular Endurance',
    4: 'Sleep Improvement',
  }

  res.json({
    bolt_scores: allBoltScores,
    checkins: allCheckins,
    completions: enrichedCompletions,
    programme: {
      id: programmeId,
      name: PROGRAMMES[programmeId] || `Programme ${programmeId}`,
      assigned_at: assessment.created_at,
      current_phase: currentPhase,
      current_week: currentWeek,
      current_pillar: currentPillar,
      estimated_completion: estimatedCompletionDate,
      total_sessions: totalCount,
    },
    onboarding_bolt: assessment.bolt_score,
    completed_count: completedCount,
    total_count: totalCount,
    next_bolt_session: nextBoltSession ? nextBoltSession.session_number : null,
    wellbeing_avg_first_week: avg(firstWeekCheckins),
    wellbeing_avg_last_week: avg(lastWeekCheckins),
  })
})

// GET /api/admin/videos
router.get('/admin/videos', requireAuth, requireAdmin, async (req, res) => {
  const { data: sessions, error } = await supabaseAdmin
    .from('programme_sessions')
    .select('id, programme_id, phase, week, session_number, title, pillar, mux_playback_id, mux_asset_id, video_uploaded_at')
    .order('programme_id', { ascending: true })
    .order('session_number', { ascending: true })

  if (error) return res.status(500).json({ error: 'Failed to fetch sessions.' })

  const result = sessions.map(s => ({
    ...s,
    video_status: s.mux_playback_id
      ? 'ready'
      : s.mux_asset_id
        ? 'processing'
        : 'none',
  }))

  res.json(result)
})

// POST /api/admin/videos/upload-url
router.post('/admin/videos/upload-url', requireAuth, requireAdmin, async (req, res) => {
  const { session_id } = req.body
  if (!session_id) return res.status(400).json({ error: 'session_id is required.' })

  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  })

  const upload = await mux.video.uploads.create({
    new_asset_settings: { playback_policy: ['public'], mp4_support: 'none' },
    cors_origin: process.env.CLIENT_URL || 'http://localhost:3000',
  })

  await supabaseAdmin
    .from('programme_sessions')
    .update({ mux_asset_id: upload.id })
    .eq('id', session_id)

  res.json({ upload_url: upload.url, upload_id: upload.id, session_id })
})
