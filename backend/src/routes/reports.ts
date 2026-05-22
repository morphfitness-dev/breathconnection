import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { computeBiometricInsights, buildProgrammeAdjustmentMessage } from '../engines/biometricInsightsEngine';
import { generateAdaptiveWeekPlan } from '../engines/programmeEngine';
import { VIDEO_LIBRARY } from '../data/videoLibrary';

const prisma = new PrismaClient();
const router = Router();

router.get('/biometric-insights', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const insights = await computeBiometricInsights(userId);
  const messages = buildProgrammeAdjustmentMessage(insights);
  res.json({ insights, messages });
});

router.post('/adapt-programme', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const [programme, profile, insights] = await Promise.all([
    prisma.programme.findUnique({ where: { userId } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    computeBiometricInsights(userId),
  ]);

  if (!programme || !profile) {
    res.status(404).json({ error: 'No programme found' });
    return;
  }

  const pillarWeights = JSON.parse(profile.pillarWeights);
  const contraindications: string[] = JSON.parse(profile.contraindications);

  const nextWeek = generateAdaptiveWeekPlan(
    pillarWeights,
    profile.tier,
    contraindications,
    programme.currentWeek + 1,
    insights as unknown as Record<string, unknown>,
  );

  const weeklyPlan = JSON.parse(programme.weeklyPlan);
  weeklyPlan.push(nextWeek);

  await prisma.programme.update({
    where: { userId },
    data: { weeklyPlan: JSON.stringify(weeklyPlan) },
  });

  const adjustmentMessages = buildProgrammeAdjustmentMessage(insights);

  res.json({
    newWeek: nextWeek,
    adjustmentMessages,
    nextWeekNumber: programme.currentWeek + 1,
  });
});

router.get('/programme/full', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const programme = await prisma.programme.findUnique({ where: { userId } });
  if (!programme) {
    res.status(404).json({ error: 'No programme' });
    return;
  }

  const weeklyPlan = JSON.parse(programme.weeklyPlan);
  // Enrich all sessions with video metadata
  const enriched = weeklyPlan.map((week: any) => ({
    ...week,
    sessions: week.sessions?.map((s: any) => ({
      ...s,
      video: s.videoId ? VIDEO_LIBRARY.find(v => v.id === s.videoId) : null,
    })),
  }));

  res.json({
    currentWeek: programme.currentWeek,
    startedAt: programme.startedAt,
    weeklyPlan: enriched,
    pillarWeights: JSON.parse(programme.pillarWeights),
  });
});

export default router;
