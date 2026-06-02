-- Programme sessions (seed data included below)
create table if not exists public.programme_sessions (
  id                  uuid primary key default gen_random_uuid(),
  programme_id        integer not null check (programme_id between 1 and 4),
  phase               integer not null check (phase between 1 and 4),
  week                integer not null check (week between 1 and 8),
  session_number      integer not null,
  title               text not null,
  pillar              text not null check (pillar in ('biomechanics','biochemistry','neurophysiology','integration')),
  duration_minutes    integer,
  content             text not null,
  has_breath_holds    boolean not null default false,
  mux_playback_id     text,
  mux_asset_id        text,
  video_uploaded_at   timestamptz,
  created_at          timestamptz not null default now()
);

-- User session completions
create table if not exists public.user_session_completions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  session_id        uuid not null references public.programme_sessions(id) on delete cascade,
  completed_at      timestamptz not null default now(),
  comfort_rating    integer check (comfort_rating between 1 and 5),
  notes             text,
  unique(user_id, session_id)
);

-- Daily check-ins
create table if not exists public.user_checkins (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  wellbeing_score   integer not null check (wellbeing_score between 1 and 5),
  energy_score      integer not null check (energy_score between 1 and 5),
  notes             text,
  created_at        timestamptz not null default now()
);

-- BOLT score history
create table if not exists public.user_bolt_scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  bolt_score  integer not null,
  session_id  uuid references public.programme_sessions(id),
  recorded_at timestamptz not null default now()
);

-- RLS
alter table public.programme_sessions enable row level security;
create policy "Anyone can read sessions" on public.programme_sessions for select using (true);

alter table public.user_session_completions enable row level security;
create policy "Users own completions" on public.user_session_completions for all using (auth.uid() = user_id);

alter table public.user_checkins enable row level security;
create policy "Users own checkins" on public.user_checkins for all using (auth.uid() = user_id);

alter table public.user_bolt_scores enable row level security;
create policy "Users own bolt scores" on public.user_bolt_scores for all using (auth.uid() = user_id);

-- SEED: Programme 1 — HRV Optimisation
insert into public.programme_sessions (programme_id, phase, week, session_number, title, pillar, duration_minutes, content, has_breath_holds) values
(1, 1, 1, 1, '90/90 Diaphragmatic Reset', 'biomechanics', 10,
'Lie on your back, knees bent at 90°, feet on a wall or elevated surface. Place one hand on your lower ribcage, one on your upper chest. Your goal: only the lower hand moves. Inhale through the nose for 4 seconds, directing air into the lower ribcage and back — feel it expand in all three directions. Exhale slowly for 6 seconds, allowing the ribs to fall naturally inward. On the last 20% of the exhale, gently draw the lower abdomen in. Complete 10 breath cycles. Note which part of the ribcage expands most easily and whether you notice any asymmetry between left and right. This is your biomechanics baseline.',
false),

(1, 1, 2, 2, 'Standing 3D Ribcage Expansion', 'biomechanics', 10,
'Stand with feet shoulder-width apart. Place hands on the sides of your lower ribcage. Inhale through the nose for 4 seconds — feel your hands pushed outward laterally, and feel expansion into the back. Exhale for 6 seconds. After 5 cycles: place one hand on the front of the lower chest, one on the back. Repeat 5 more cycles feeling front-to-back expansion. Final 5 cycles: arms by your sides. Observe whether the expansion continues without tactile feedback. Does the ribcage expand in all three dimensions — front/back, left/right, top/bottom?',
false),

(1, 2, 3, 3, 'BOLT Baseline + Nasal Reset', 'biochemistry', 12,
'Begin with your BOLT score test: sit quietly, breathe normally, then after a relaxed natural exhale through your nose, pinch your nose and time the first definite urge to breathe. Record this score — it is your Week 3 biochemistry baseline. Then 5 minutes of nasal-only breathing: 4-second inhale, 6-second exhale. Reduce volume slightly — breathe less than you want to. The goal is a mild, comfortable air hunger. Week 3 target: 8 exhale breath holds of 5–8 seconds. Inhale through nose, exhale through nose, hold, release, recover with 3 nasal breaths. Close with 2 minutes of unrestricted nasal breathing.',
true),

(1, 2, 4, 4, 'BOLT Training — Extended Holds', 'biochemistry', 12,
'5-minute nasal breathing warm-up: 4-in/6-out, moderate volume. Then 8 exhale breath holds of 10–15 seconds as comfort allows. After each hold, recover with 3–4 nasal breaths (approximately 25 seconds). The air hunger should be moderate — a strong but comfortable shortage, not distress. Close with 2 minutes of nasal breathing. At the end of this session, retest your BOLT score and compare it to your Week 3 baseline. A 3–5 second improvement indicates good adaptation.',
true),

(1, 3, 5, 5, 'Coherent Breathing — Finding Your Resonance', 'neurophysiology', 15,
'Sit upright comfortably. Begin nasal breathing at your normal rate for 1 minute to settle. Start coherent breathing: inhale through the nose for 5.5 seconds, exhale through the nose for 5.5 seconds. Use a metronome or the in-app pacer. Continue for 10 minutes. The coherence state typically emerges after 3–5 minutes — a sense of physiological settling. If 5.5 seconds feels uncomfortable, start at 5 seconds each way and shift to 5.5 next week. Close with 3 minutes of natural nasal breathing and notice whether the breath has slowed.',
false),

(1, 3, 6, 6, 'Alternate Nostril Breathing (Nadi Shodhana)', 'neurophysiology', 15,
'Sit upright. Use your right thumb to close the right nostril, ring finger to close the left. Close the right nostril. Exhale fully through the left, then inhale fully through the left (4–5 seconds). Close both nostrils briefly (1 second), release the right. Exhale fully through the right, inhale fully through the right. Close both briefly, release the left. Exhale through the left. This is one full cycle. Continue for 10 minutes — approximately 20–25 cycles. Close with 3 minutes of natural nasal breathing.',
false),

(1, 4, 7, 7, 'Full Three-Pillar Daily Practice', 'integration', 20,
'BIOMECHANICS (5 min): 90/90 breathing or standing 3D expansion. 10 breath cycles at 4-in/6-out. Establish ribcage freedom before proceeding. BIOCHEMISTRY (5 min): 6 exhale breath holds of 10–15 seconds with 25-second nasal recovery between each. NEUROPHYSIOLOGY (10 min): Coherent breathing at 5.5 BPM for 7 minutes, then alternate nostril breathing for 3 minutes. The sequence matters — biomechanics first, then biochemistry, then neurophysiology.',
true),

(1, 4, 8, 8, 'Programme Completion — Retest and Reflect', 'integration', 20,
'Complete your full three-pillar practice (as Session 7). Then retest your BOLT score and record it. Compare to your onboarding score. Expected at Week 8: BOLT score improvement of 5–10 seconds from baseline. Resting respiratory rate trending below 12 breaths per minute. A subjective sense of baseline calm improved. Take a moment to note what you have noticed most in your practice over these 8 weeks.',
true);

-- SEED: Programme 2 — Anxiety Management
insert into public.programme_sessions (programme_id, phase, week, session_number, title, pillar, duration_minutes, content, has_breath_holds) values
(2, 1, 1, 1, 'Supine Diaphragmatic Reset', 'biomechanics', 10,
'Lie on your back with knees bent, feet flat on the floor. Close your eyes if comfortable. Place both hands lightly on your lower abdomen, below the navel. Breathe in through the nose for 4 seconds — your hands should rise. If only your chest rises, actively try to push your hands upward with the breath. Breathe out slowly for 6 seconds. Let everything soften downward. Complete 10 cycles. If 4-6 feels difficult, start at 3-5. Comfortable and nasal is the priority — there is no benefit in straining.',
false),

(2, 1, 2, 2, 'Nasal Breathing Habit Reset', 'biomechanics', 10,
'This is a lifestyle session, not just a practice session. Morning check: on waking, observe whether you are breathing through your nose or mouth — close your mouth if it is open. Desk/screen check: every 30 minutes, notice your breathing pattern and correct gently. Walking practice: take a 10-minute walk breathing exclusively through the nose — slow down if needed. Evening: 5 minutes of supine diaphragmatic breathing before sleep. Track what percentage of waking hours you are nasal breathing. Target: 80% or more by end of Week 2.',
false),

(2, 2, 3, 3, 'Reduced-Volume Breathing — Over-Breathing Correction', 'biochemistry', 12,
'Sit or lie comfortably. Begin with 2 minutes of natural nasal breathing to settle. Reduce breath volume: inhale for 4 seconds but take in only about 70% of what you normally would — the breath is smaller. Exhale for 6 seconds. You should feel a mild, comfortable sense of not quite enough air. This is the CO₂ signal — not danger, but recalibration. Sit with it gently. Maintain this for 8 minutes. If the air hunger becomes more than mild, allow a slightly larger breath, then return. Close with 2 minutes of unrestricted nasal breathing. NOTE: No breath holds in this programme phase.',
false),

(2, 2, 4, 4, 'Nasal Breathing and CO₂ Consolidation', 'biochemistry', 12,
'Begin with 3 minutes of natural nasal breathing, observing your rate without trying to change it. Then 8 minutes of reduced-volume nasal breathing (70% of normal volume, 4-in/6-out). After each minute, briefly note whether the air hunger is comfortable or becoming distressing. Comfortable = continue. Distressing = take a normal breath and return. Close with 2 minutes of natural nasal breathing. Count your resting breaths for 1 minute — target below 12 BPM by end of Week 4.',
false),

(2, 3, 5, 5, 'Left-Nostril Breathing Protocol', 'neurophysiology', 12,
'Sit upright. Use your right thumb to close your right nostril. Breathe exclusively through the left nostril for the entire session. Inhale through the left nostril for 4 seconds. Exhale through the left nostril for 6 seconds. Continue for 10 minutes. If closing the right nostril feels uncomfortable, hold the hand position lightly — the goal is simply directing primary airflow through the left side. Close with 2 minutes of natural nasal breathing and notice any shift in calm. Rate your anxiety level 0–10 before and after.',
false),

(2, 3, 6, 6, 'Extended Exhale and Box Breathing', 'neurophysiology', 15,
'Part 1 — Extended exhale (8 min): Inhale through the nose for 4 seconds. Exhale through the nose for 8 seconds. A 1:2 inhale-to-exhale ratio maximises vagal activation. If 8-second exhale is too long, begin at 4:6 and extend toward 4:8 across this week. Part 2 — Box breathing for acute regulation (4 min): Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds. Complete 5 cycles. This technique is used by military personnel for real-time stress regulation. Part 3 — Settling breath (3 min): natural nasal breathing, no counting.',
false),

(2, 4, 7, 7, 'Daily Integrated Anxiety Protocol', 'integration', 20,
'BIOMECHANICS (4 min): Supine diaphragmatic breathing, 4-in/6-out, 8 cycles. Restore postural ground. BIOCHEMISTRY (5 min): Reduced-volume nasal breathing, 70% volume, 4-in/6-out. Settle CO₂ chemistry. NEUROPHYSIOLOGY (11 min): Left-nostril breathing for 5 minutes, then extended exhale (4:8) for 3 minutes, then box breathing for 5 cycles as closing anchor. Real-world application: deploy box breathing at the first sign of anxiety rising. Use left-nostril breathing for 5 minutes before high-stress events.',
false),

(2, 4, 8, 8, 'Programme Completion and Integration', 'integration', 20,
'Complete your full integrated protocol (as Session 7). Then reflect: How has your resting respiratory rate changed since Week 1? Are you nasal breathing more consistently during the day? Can you deploy box breathing automatically when needed? Expected at Week 8: resting respiratory rate below 12 BPM, reduced perceived anxiety in daily life, box breathing available as a reliable real-world tool.',
false);

-- SEED: Programme 3 — Cardiovascular Endurance
insert into public.programme_sessions (programme_id, phase, week, session_number, title, pillar, duration_minutes, content, has_breath_holds) values
(3, 1, 1, 1, 'Athlete Diaphragm Activation', 'biomechanics', 10,
'Begin in 90/90 position (supine, hips and knees at 90°). Perform 10 diaphragmatic breaths: 4-in through nose / 6-out. Feel three-dimensional ribcage expansion. Progress to standing: 10 breaths maintaining the same expansion quality. If upper chest dominates, return to 90/90. Final 5 breaths: walk slowly while maintaining nasal-only breathing. Does the quality hold when you add movement? If not, slow down. Pre-workout habit: perform 5 diaphragmatic breaths before every training session for the remainder of the programme.',
false),

(3, 1, 2, 2, 'Nasal Breathing Integration in Training', 'biomechanics', null,
'Week 1: nasal-only breathing during all walking. If you break to mouth breathe, slow down until nasal breathing is comfortable. Expand distance/duration daily. Week 2: nasal-only breathing during all low-intensity training (conversational pace or below 60% max HR). Slow down as much as needed. The point at which nasal breathing becomes impossible is exactly where CO₂ tolerance training occurs — train at that edge. Measure your BOLT score at the start of Week 3. This is your biochemistry baseline. Most untrained individuals score 15–20 seconds.',
false),

(3, 2, 3, 3, 'BOLT Training Protocol — Level 1', 'biochemistry', 12,
'Record your BOLT score (Week 3 baseline). 5-minute nasal breathing warm-up: 4-in/6-out. Then 8 exhale breath holds: exhale through the nose, hold for 10–15 seconds, release, recover with 3–4 nasal breaths (25–30 seconds). The air hunger should be moderate — a strong but comfortable shortage. McKeown describes this as a ''strong but comfortable air shortage'', never distress. Close with 2 minutes of nasal breathing. Measure BOLT score at end of Week 4 and compare.',
true),

(3, 2, 4, 4, 'BOLT Training — Level 2', 'biochemistry', 12,
'Nasal breathing warm-up: 4 minutes. Then 10 exhale breath holds, targeting 15–20 seconds per hold, with 30-second nasal recovery between each. Maintain nasal-only breathing throughout — any mouth breathing invalidates the hold''s training effect. Close with 2 minutes of natural nasal breathing. Record your longest comfortable hold. This becomes your performance benchmark.',
true),

(3, 3, 5, 5, 'Simulated Altitude Walk Protocol', 'biochemistry', 15,
'Begin walking at a comfortable pace. 30 seconds of nasal breathing to settle. Exhale through the nose. Pinch the nose closed. Walk and count steps until you feel a moderate-to-strong urge to breathe. Release the nose. Breathe through the nose only. Continue walking 60–90 seconds recovery. Repeat 8–10 times. Record your step count on each hold. Target range: 40–80 steps per hold initially. Week 5: use during walking. Week 6: experiment with hold-and-jog intervals at light intensity. A 20-step improvement over 2 weeks indicates strong adaptation.',
true),

(3, 3, 6, 6, 'Pre-Training Respiratory Primer', 'biochemistry', 8,
'Use this 10–15 minutes before any training session. Phase 1 (2 min): Nasal breathing at walking pace, 4-in/6-out — warm the respiratory system. Phase 2 (3 min): 5 exhale breath holds of 10–12 seconds, 30-second nasal recovery between each. Phase 3 (2 min): Return to nasal breathing, build energy without opening the mouth. One minute of natural nasal breathing, then begin your session. Effect: pre-exercise nasal breathing with short holds reduces the oxygen deficit at exercise onset — the body reaches aerobic steady-state faster.',
true),

(3, 4, 7, 7, 'Full Performance Breathing System', 'integration', null,
'PRE-TRAINING (8 min): Diaphragm activation (5 breaths) + respiratory primer protocol. DURING TRAINING: nasal-only at all intensities below threshold. At high intensity, maintain nasal breathing for as long as comfortable before allowing mouth breathing. Track nasal-only duration — extend it weekly. POST-TRAINING (10 min): 2 minutes natural nasal breathing. Then 8 gentle exhale holds (8–10 sec) with nasal recovery. Then coherent breathing at 5.5 BPM for 5 minutes to support parasympathetic recovery. WEEKLY: BOLT score Monday morning before first training session.',
true),

(3, 4, 8, 8, 'Performance Assessment and Reflection', 'integration', 20,
'Complete your full performance breathing system. Retest your BOLT score. Compare to your onboarding score. Assess your nasal breathing threshold: at what training intensity can you now sustain nasal-only breathing vs. Week 1? Expected outcomes: BOLT score from below 20 toward 25–30+. Reduced perceived breathlessness at equivalent exercise intensities. Faster post-training recovery. These are breathing efficiency improvements — they amplify the benefits of your existing training.',
true);

-- SEED: Programme 4 — Sleep Improvement
insert into public.programme_sessions (programme_id, phase, week, session_number, title, pillar, duration_minutes, content, has_breath_holds) values
(4, 1, 1, 1, 'Evening Ribcage Release', 'biomechanics', 10,
'30 minutes before bed, dim the lights. Find a comfortable supine position. Phones away. Place your hands on your lower ribcage, one on each side. Inhale slowly through the nose for 4 seconds — feel your hands pushed outward. Exhale slowly for 6–8 seconds. As you exhale, consciously release any holding in the ribcage, jaw, shoulders, and neck. Complete 10 cycles. Final 2 cycles: allow the exhale to be even longer — 8–10 seconds if comfortable. Let the breath find its own natural rhythm afterward.',
false),

(4, 1, 2, 2, 'Nasal Breathing Before Sleep — Baseline', 'biomechanics', 10,
'This week: establish the habit of nasal breathing in the 30 minutes before bed. No mouth breathing after your chosen wind-down time. If you catch yourself mouth breathing, gently close your mouth and redirect. Evening check: 5 minutes of relaxed nasal breathing lying down, 4-in/6-out. Notice whether the transition to sleep feels different with consistent nasal breathing. Morning note: did you wake with a dry mouth? This is the clearest indicator of nocturnal mouth breathing.',
false),

(4, 2, 3, 3, 'Pre-Sleep CO₂ Reset', 'biochemistry', 12,
'In bed, lights off or very dim. Lie on your side or back. 2 minutes of natural nasal breathing — observe your current rate without trying to change it. Then reduced-volume nasal breathing for 8 minutes: inhale for 4 seconds at about 70% of normal volume, exhale for 6 seconds. The breath should become quieter and smaller. If the body sighs spontaneously — good, let it, then return to the small quiet breath. The goal: the breath becomes almost imperceptible — slow, nasal, minimal. As if you are already asleep.',
false),

(4, 2, 4, 4, 'CO₂ Reset and Sleep Consolidation', 'biochemistry', 12,
'Pre-sleep routine: 2 minutes natural nasal breathing to observe your current state. Then 10 minutes of reduced-volume breathing (70% volume, 4-in/6-out). This week: every time you catch yourself mouth breathing during the night (if you wake), gently redirect to nasal breathing. In the morning, note whether you woke with a dry mouth — this is your primary tracking metric this week. Also note time to fall asleep vs. Week 1.',
false),

(4, 3, 5, 5, 'Left-Nostril Sleep Protocol', 'neurophysiology', 15,
'In bed, in your sleeping position. Use your right thumb to close the right nostril. Breathe exclusively through the left nostril for 10 minutes. Inhale for 4 seconds, exhale for 6–8 seconds. After the first few cycles, let the breath find its own slow rhythm through the left nostril. If you fall asleep during the practice, that is the desired outcome — no need to complete the session. Close the right nostril with a folded tissue if maintaining hand position is uncomfortable.',
false),

(4, 3, 6, 6, '4-7-8 Breathing for Sleep', 'neurophysiology', 8,
'Sit upright initially (can be done lying down once familiar). Place the tip of your tongue behind your upper front teeth. Exhale completely. Inhale through the nose for 4 counts. Hold for 7 counts. Exhale slowly for 8 counts. Complete 4 cycles to begin — build to 8 cycles over this week and next. The extended hold and exhale create strong parasympathetic activation. Use 4-7-8 as the closing technique before sleep, or during any nighttime waking where the mind is active and sleep is not returning.',
false),

(4, 4, 7, 7, 'Complete Evening Sleep Protocol', 'integration', 25,
'45 minutes before bed: begin blue light reduction. 30 minutes before bed — BIOMECHANICS (8 min): Evening ribcage release. 10 cycles of 4-in/6-8-out. Release the day''s tension. 20 minutes before bed — BIOCHEMISTRY (8 min): Pre-sleep CO₂ reset. Reduced-volume nasal breathing until the breath is quiet and small. 10 minutes before bed — NEUROPHYSIOLOGY (8 min): Left-nostril breathing for 5 minutes, then 4-7-8 for 4 cycles. In bed: left-nostril breathing until sleep. If waking at night: 4-7-8 for 4–8 cycles. Do not check the time or your phone.',
false),

(4, 4, 8, 8, 'Sleep Programme Completion', 'integration', 20,
'Complete your full evening sleep protocol. Morning reflection: How has your sleep onset time changed since Week 1? Are you waking less often? Has your morning energy improved? Expected outcomes at Week 8: faster sleep onset, improved subjective sleep quality, reduction in snoring (if applicable). If you have been tracking your morning BOLT score, compare it to your onboarding score — improved CO₂ tolerance correlates with less nocturnal mouth breathing and better sleep architecture.',
false);
