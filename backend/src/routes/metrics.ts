import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { normaliseMetric, calculate7DayAverage, detectBiometricAlerts, isBPSafe, getBPSourceLabel } from '../engines/normalisationLayer';
import { interpretNSScore } from '../engines/nsScoreEngine';
import { checkBoltMilestones } from '../engines/gamificationEngine';

const prisma = new PrismaClient();
const router = Router();

const metricSchema = z.object({
  type: z.enum(['hrv', 'rhr', 'rr', 'spo2', 'blood_pressure', 'ns_score', 'eeg_alpha', 'daytime_rr', 'bolt']),
  value: z.number(),
  systolic: z.number().optional(),
  diastolic: z.number().optional(),
  source: z.enum(['manual', 'oura', 'whoop', 'apple_health', 'tymewear', 'spire']).default('manual'),
  context: z.string().optional(),
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = metricSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const { type, value, systolic, diastolic, source, context } = parse.data;

  // Blood pressure safety gate
  let bpWarning: string | undefined;
  if (type === 'blood_pressure' && systolic !== undefined && diastolic !== undefined) {
    if (!isBPSafe(systolic, diastolic)) {
      bpWarning = 'Blood pressure above 140/90 — hold durations will be capped and breath hold intensity reduced. Please consult your healthcare provider.';

      // Update contraindications
      const profile = await prisma.userProfile.findUnique({ where: { userId } });
      if (profile) {
        const existing: string[] = JSON.parse(profile.contraindications);
        const updated = [...new Set([...existing, 'hold_duration_cap', 'no_tier_3_biochemistry'])];
        await prisma.userProfile.update({
          where: { userId },
          data: { contraindications: JSON.stringify(updated) },
        });
      }
    }
  }

  const entry = await prisma.metricEntry.create({
    data: { userId, type, value, systolic, diastolic, source, context },
  });

  const alerts = detectBiometricAlerts([{ type, value, recordedAt: new Date() }]);

  // BOLT score — also persist to BoltScore model and check milestones
  let boltMilestones: Array<{ type: string; data: Record<string, unknown> }> = [];
  if (type === 'bolt') {
    const prevBolt = await prisma.boltScore.findFirst({ where: { userId }, orderBy: { testedAt: 'desc' } });
    const isPR = !prevBolt || value > prevBolt.score;
    await prisma.boltScore.create({ data: { userId, score: value, isPersonalRecord: isPR } });
    const triggers = checkBoltMilestones(prevBolt?.score ?? null, value);
    for (const t of triggers) {
      boltMilestones.push({ type: t.type, data: t.data });
      await prisma.userMilestone.create({ data: { userId, milestoneType: t.type, data: JSON.stringify(t.data) } });
    }
  }

  res.status(201).json({
    entry,
    bpLabel: type === 'blood_pressure' ? getBPSourceLabel(source) : undefined,
    bpWarning,
    alerts,
    boltMilestones: boltMilestones.length > 0 ? boltMilestones : undefined,
  });
});

router.post('/bulk', requireAuth, async (req: AuthRequest, res: Response) => {
  const bulkSchema = z.array(metricSchema);
  const parse = bulkSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const entries = await prisma.metricEntry.createMany({
    data: parse.data.map(m => ({ userId, ...m })),
  });

  res.status(201).json({ created: entries.count });
});

router.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const [boltHistory, holdRecords, streaks, metrics, recentNS] = await Promise.all([
    prisma.boltScore.findMany({ where: { userId }, orderBy: { testedAt: 'asc' }, take: 20 }),
    prisma.breathHoldRecord.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' }, take: 10 }),
    prisma.streakEntry.findMany({ where: { userId, isActive: true } }),
    prisma.metricEntry.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    }),
    prisma.metricEntry.findFirst({ where: { userId, type: 'ns_score' }, orderBy: { recordedAt: 'desc' } }),
  ]);

  const hrv7day = metrics.filter(m => m.type === 'hrv').slice(0, 7);
  const hrv30day = metrics.filter(m => m.type === 'hrv').slice(0, 30);
  const latestHrv = hrv7day[0];

  const hrv7dayAvg = hrv7day.length > 0 ? hrv7day.reduce((s, m) => s + m.value, 0) / hrv7day.length : null;
  const hrv30dayAvg = hrv30day.length > 0 ? hrv30day.reduce((s, m) => s + m.value, 0) / hrv30day.length : null;

  let hrvTrend: 'up' | 'stable' | 'down' = 'stable';
  if (hrv7dayAvg !== null && hrv30dayAvg !== null) {
    if (hrv7dayAvg > hrv30dayAvg * 1.05) hrvTrend = 'up';
    else if (hrv7dayAvg < hrv30dayAvg * 0.95) hrvTrend = 'down';
  }

  const latestRhr = metrics.find(m => m.type === 'rhr');
  const latestRR = metrics.find(m => m.type === 'rr');
  const latestSpO2 = metrics.find(m => m.type === 'spo2');
  const latestBP = metrics.find(m => m.type === 'blood_pressure');

  const nsInterpretation = recentNS ? interpretNSScore(recentNS.value) : null;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekSessions = await prisma.session.findMany({
    where: { userId, completedAt: { gte: weekStart } },
    select: { pillar: true },
  });

  const pillarCounts = { biomechanics: 0, biochemistry: 0, neurophysiology: 0 };
  for (const s of weekSessions) {
    if (s.pillar in pillarCounts) pillarCounts[s.pillar as keyof typeof pillarCounts]++;
  }

  res.json({
    nsScore: recentNS ? { score: recentNS.value, ...nsInterpretation } : null,
    bolt: {
      current: boltHistory[boltHistory.length - 1]?.score ?? null,
      history: boltHistory,
    },
    hrv: {
      latest: latestHrv?.value ?? null,
      trend: hrvTrend,
      history: hrv7day.map(m => ({ value: m.value, date: m.recordedAt })),
    },
    rhr: latestRhr?.value ?? null,
    restingRR: latestRR?.value ?? null,
    spO2: latestSpO2?.value ?? null,
    bloodPressure: latestBP ? {
      systolic: latestBP.systolic,
      diastolic: latestBP.diastolic,
      label: getBPSourceLabel(latestBP.source as any),
    } : null,
    streaks,
    holdRecords: holdRecords.slice(0, 5),
    pillarRings: {
      biomechanics: Math.min(1, pillarCounts.biomechanics / 3),
      biochemistry: Math.min(1, pillarCounts.biochemistry / 3),
      neurophysiology: Math.min(1, pillarCounts.neurophysiology / 3),
    },
  });
});

export default router;
