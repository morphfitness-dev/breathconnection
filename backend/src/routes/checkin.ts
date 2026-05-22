import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calculateNSScore } from '../engines/nsScoreEngine';
import { computeBiometricInsights, buildProgrammeAdjustmentMessage } from '../engines/biometricInsightsEngine';
import { generateMonthlyReport } from '../engines/monthlyReportEngine';

const prisma = new PrismaClient();
const router = Router();

const morningCheckInSchema = z.object({
  subjectiveStress: z.number().min(1).max(5),
  sleepScore: z.number().min(0).max(100).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  neckShoulderTension: z.number().min(1).max(5).optional(),
  hrv: z.number().min(1).max(200).optional(),
  rhr: z.number().min(30).max(120).optional(),
});

router.post('/morning', requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = morningCheckInSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const { subjectiveStress, sleepScore, sleepHours, neckShoulderTension, hrv, rhr } = parse.data;

  const entries = [];

  if (hrv !== undefined) {
    entries.push({ userId, type: 'hrv', value: hrv, source: 'manual', context: 'morning' });
  }
  if (rhr !== undefined) {
    entries.push({ userId, type: 'rhr', value: rhr, source: 'manual', context: 'morning' });
  }

  // Derived sleep score from hours if no score given
  const effectiveSleepScore = sleepScore ?? (sleepHours !== undefined ? Math.min(100, (sleepHours / 9) * 100) : undefined);

  if (entries.length > 0) {
    await prisma.metricEntry.createMany({ data: entries as any });
  }

  // Get HRV 7-day average
  const hrv7day = await prisma.metricEntry.findMany({
    where: { userId, type: 'hrv', recordedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    orderBy: { recordedAt: 'desc' },
    take: 7,
  });
  const hrv7DayAverage = hrv7day.length > 0
    ? hrv7day.reduce((s, m) => s + m.value, 0) / hrv7day.length
    : undefined;

  const latestHrv = hrv ?? hrv7day[0]?.value;
  const latestRhr = rhr ?? (await prisma.metricEntry.findFirst({ where: { userId, type: 'rhr' }, orderBy: { recordedAt: 'desc' } }))?.value;

  const nsScoreResult = calculateNSScore({
    hrv: latestHrv,
    hrv7DayAverage,
    rhr: latestRhr,
    sleepScore: effectiveSleepScore,
    subjectiveStress,
  });

  await prisma.metricEntry.create({
    data: { userId, type: 'ns_score', value: nsScoreResult.score, source: 'manual', context: 'morning' },
  });

  // Compute programme insights
  const insights = await computeBiometricInsights(userId);
  const adjustmentMessages = buildProgrammeAdjustmentMessage(insights);

  res.json({
    nsScore: nsScoreResult,
    insights: {
      flags: insights,
      messages: adjustmentMessages,
    },
  });
});

router.post('/monthly-report', requireAuth, async (req: AuthRequest, res: Response) => {
  const { month } = req.body; // YYYY-MM format
  const reportMonth = month ?? new Date().toISOString().slice(0, 7);
  const report = await generateMonthlyReport(req.userId!, reportMonth);
  res.json(report);
});

router.get('/monthly-report/:month', requireAuth, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.monthlyReport.findFirst({
    where: { userId: req.userId!, reportMonth: req.params.month },
  });
  if (!existing) {
    res.status(404).json({ error: 'No report found for that month' });
    return;
  }
  res.json(existing);
});

router.get('/monthly-reports', requireAuth, async (req: AuthRequest, res: Response) => {
  const reports = await prisma.monthlyReport.findMany({
    where: { userId: req.userId! },
    orderBy: { reportMonth: 'desc' },
  });
  res.json(reports);
});

export default router;
