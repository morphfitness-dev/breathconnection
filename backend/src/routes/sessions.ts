import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calculateNSScore } from '../engines/nsScoreEngine';
import { selectDailySession, evaluateInSessionSignals, applyPostSessionSignals } from '../engines/adaptiveGate';
import { checkBoltMilestones, checkHoldMilestones, checkCoherenceStreakMilestones, calculatePillarRings } from '../engines/gamificationEngine';
import { VIDEO_LIBRARY } from '../data/videoLibrary';

const prisma = new PrismaClient();
const router = Router();

router.get('/today', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) {
    res.status(404).json({ error: 'Profile not found. Complete assessment first.' });
    return;
  }

  // Get latest HRV and RHR metrics
  const metrics = await prisma.metricEntry.findMany({
    where: { userId, type: { in: ['hrv', 'rhr', 'ns_score'] } },
    orderBy: { recordedAt: 'desc' },
    take: 20,
  });

  const latestHrv = metrics.find(m => m.type === 'hrv')?.value;
  const latestRhr = metrics.find(m => m.type === 'rhr')?.value;
  const hrv7day = metrics.filter(m => m.type === 'hrv').slice(0, 7);
  const hrv7DayAverage = hrv7day.length > 0
    ? hrv7day.reduce((s, m) => s + m.value, 0) / hrv7day.length
    : undefined;

  const nsScoreResult = calculateNSScore({
    hrv: latestHrv,
    hrv7DayAverage,
    rhr: latestRhr,
  });

  // Get recent sessions for recency tracking
  const recentSessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: { pillar: true },
  });

  const pillarWeights = JSON.parse(profile.pillarWeights);
  const contraindications: string[] = JSON.parse(profile.contraindications);

  const adapted = selectDailySession(
    nsScoreResult,
    pillarWeights,
    profile.tier,
    contraindications,
    recentSessions.map(s => s.pillar),
  );

  const video = VIDEO_LIBRARY.find(v => v.id === adapted.videoId);

  // Save NS score
  await prisma.metricEntry.create({
    data: {
      userId,
      type: 'ns_score',
      value: nsScoreResult.score,
      source: 'manual',
      context: 'morning',
    },
  });

  res.json({
    nsScore: nsScoreResult,
    session: adapted,
    video: video ?? null,
  });
});

const startSchema = z.object({
  videoId: z.string(),
});

router.post('/start', requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = startSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const video = VIDEO_LIBRARY.find(v => v.id === parse.data.videoId);
  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const latestHrv = await prisma.metricEntry.findFirst({
    where: { userId, type: 'hrv' },
    orderBy: { recordedAt: 'desc' },
  });

  const session = await prisma.session.create({
    data: {
      userId,
      videoId: video.id,
      pillar: video.pillar,
      tier: video.tier,
      preHrv: latestHrv?.value,
      preNsScore: (await prisma.metricEntry.findFirst({
        where: { userId, type: 'ns_score' },
        orderBy: { recordedAt: 'desc' },
      }))?.value ?? undefined,
    },
  });

  res.json({ sessionId: session.id, video });
});

const inSessionSchema = z.object({
  sessionId: z.string(),
  hrv: z.number().optional(),
  sessionStartHrv: z.number().optional(),
  eegBetaAlphaRatio: z.number().optional(),
  breathingRate: z.number().optional(),
  spo2: z.number().optional(),
  userDiscomfort: z.boolean().optional(),
});

router.post('/adapt', requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = inSessionSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const adaptation = evaluateInSessionSignals(parse.data);
  res.json({ adaptation });
});

const completeSchema = z.object({
  sessionId: z.string(),
  durationSeconds: z.number(),
  postHrv: z.number().optional(),
  eegAlphaRatio: z.number().optional(),
  subjectiveRating: z.number().min(1).max(5).optional(),
  boltScore: z.number().optional(),
  holdDurationSeconds: z.number().optional(),
});

router.post('/complete', requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = completeSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const { sessionId, durationSeconds, postHrv, eegAlphaRatio, subjectiveRating, boltScore, holdDurationSeconds } = parse.data;

  const session = await prisma.session.findFirst({ where: { id: sessionId, userId } });
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      completedAt: new Date(),
      durationSeconds,
      postHrv,
      eegAlphaRatio,
      subjectiveRating,
    },
  });

  await prisma.userProfile.update({
    where: { userId },
    data: { totalSessions: { increment: 1 } },
  });

  const gamificationEvents: Array<{ type: string; data: Record<string, unknown> }> = [];

  // Handle BOLT score
  if (boltScore !== undefined) {
    const prevBolt = await prisma.boltScore.findFirst({
      where: { userId },
      orderBy: { testedAt: 'desc' },
    });
    const triggers = checkBoltMilestones(prevBolt?.score ?? null, boltScore);

    const isPR = !prevBolt || boltScore > prevBolt.score;
    await prisma.boltScore.create({ data: { userId, score: boltScore, isPersonalRecord: isPR } });

    for (const t of triggers) {
      gamificationEvents.push({ type: t.type, data: t.data });
      await prisma.userMilestone.create({ data: { userId, milestoneType: t.type, data: JSON.stringify(t.data) } });
    }
  }

  // Handle breath hold record
  if (holdDurationSeconds !== undefined) {
    const prevHold = await prisma.breathHoldRecord.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });
    const triggers = checkHoldMilestones(prevHold?.durationSeconds ?? null, holdDurationSeconds);

    const isPR = !prevHold || holdDurationSeconds > prevHold.durationSeconds;
    await prisma.breathHoldRecord.create({ data: { userId, durationSeconds: holdDurationSeconds, isPersonalRecord: isPR, sessionId } });

    for (const t of triggers) {
      gamificationEvents.push({ type: t.type, data: t.data });
      await prisma.userMilestone.create({ data: { userId, milestoneType: t.type, data: JSON.stringify(t.data) } });
    }
  }

  // Handle coherence streak
  const postEvents = applyPostSessionSignals(session.preHrv ?? undefined, postHrv, eegAlphaRatio, userId);
  if (postEvents.coherence_achieved) {
    const streak = await prisma.streakEntry.findFirst({
      where: { userId, type: 'coherence', isActive: true },
      orderBy: { startedAt: 'desc' },
    });

    const newCount = (streak?.count ?? 0) + 1;
    if (streak) {
      await prisma.streakEntry.update({ where: { id: streak.id }, data: { count: newCount, lastUpdatedAt: new Date() } });
    } else {
      await prisma.streakEntry.create({ data: { userId, type: 'coherence', count: 1 } });
    }

    const coherenceTriggers = checkCoherenceStreakMilestones(streak?.count ?? 0, newCount);
    for (const t of coherenceTriggers) {
      gamificationEvents.push({ type: t.type, data: t.data });
      await prisma.userMilestone.create({ data: { userId, milestoneType: t.type, data: JSON.stringify(t.data) } });
    }
  }

  // Pillar rings
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekSessions = await prisma.session.findMany({
    where: { userId, completedAt: { gte: weekStart } },
    select: { pillar: true },
  });
  const rings = calculatePillarRings(weekSessions);

  res.json({
    completed: true,
    gamificationEvents,
    coherenceAchieved: postEvents.coherence_achieved,
    pillarRings: rings,
  });
});

router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.userId!, completedAt: { not: null } },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });
  res.json(sessions);
});

export default router;
