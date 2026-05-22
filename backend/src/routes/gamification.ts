import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { MILESTONES, evaluateStageAdvancement, checkStageMilestone, calculatePillarRings } from '../engines/gamificationEngine';

const prisma = new PrismaClient();
const router = Router();

router.get('/milestones', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const achieved = await prisma.userMilestone.findMany({
    where: { userId },
    orderBy: { achievedAt: 'desc' },
  });

  const achievedTypes = new Set(achieved.map(m => m.milestoneType));
  const enriched = MILESTONES.map(m => ({
    ...m,
    achieved: achievedTypes.has(m.type),
    achievedAt: achieved.find(a => a.milestoneType === m.type)?.achievedAt ?? null,
  }));

  res.json(enriched);
});

router.get('/bolt-leaderboard', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const userBolt = await prisma.boltScore.findFirst({
    where: { userId },
    orderBy: { testedAt: 'desc' },
  });

  // Anonymised community percentile (simulated for MVP)
  const allBolts = await prisma.boltScore.findMany({
    orderBy: { score: 'desc' },
    distinct: ['userId'],
    select: { score: true, userId: true },
  });

  const userRank = userBolt
    ? allBolts.findIndex(b => b.userId === userId) + 1
    : null;
  const percentile = userRank && allBolts.length > 0
    ? Math.round((1 - userRank / allBolts.length) * 100)
    : null;

  res.json({
    personal: {
      current: userBolt?.score ?? null,
      stage: profile?.stage ?? 'explorer',
    },
    community: {
      percentile,
      totalUsers: allBolts.length,
      message: percentile !== null ? `You're in the top ${100 - percentile}% of users` : null,
    },
  });
});

router.get('/streaks', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const streaks = await prisma.streakEntry.findMany({
    where: { userId },
    orderBy: { lastUpdatedAt: 'desc' },
  });

  const coherenceStreak = streaks.find(s => s.type === 'coherence' && s.isActive);
  const practiceStreak = streaks.find(s => s.type === 'daily_practice' && s.isActive);

  res.json({
    coherence: coherenceStreak ?? null,
    practice: practiceStreak ?? null,
    all: streaks,
  });
});

router.get('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const [profile, bolt, streaks, milestones, sessions] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.boltScore.findFirst({ where: { userId }, orderBy: { testedAt: 'desc' } }),
    prisma.streakEntry.findMany({ where: { userId, isActive: true } }),
    prisma.userMilestone.count({ where: { userId } }),
    prisma.session.count({ where: { userId, completedAt: { not: null } } }),
  ]);

  const coherenceStreak = streaks.find(s => s.type === 'coherence');
  const nsScores = await prisma.metricEntry.findMany({
    where: { userId, type: 'ns_score', recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  });

  const nsAvg30d = nsScores.length > 0
    ? nsScores.reduce((s, m) => s + m.value, 0) / nsScores.length
    : 0;

  const monthlyReportCount = await prisma.monthlyReport.count({ where: { userId } });

  const wearable = await prisma.wearableConnection.findFirst({
    where: { userId, isConnected: true },
  });

  const newStage = profile ? evaluateStageAdvancement(
    profile.stage,
    bolt?.score ?? 0,
    coherenceStreak?.count ?? 0,
    nsAvg30d,
    sessions,
    !!wearable,
    monthlyReportCount,
  ) : 'explorer';

  if (profile && newStage !== profile.stage) {
    const stageTrigger = checkStageMilestone(profile.stage, newStage);
    await prisma.userProfile.update({ where: { userId }, data: { stage: newStage } });
    if (stageTrigger) {
      await prisma.userMilestone.create({
        data: { userId, milestoneType: stageTrigger.type, data: JSON.stringify(stageTrigger.data) },
      });
    }
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekSessions = await prisma.session.findMany({
    where: { userId, completedAt: { gte: weekStart } },
    select: { pillar: true },
  });
  const rings = calculatePillarRings(weekSessions);

  res.json({
    stage: newStage,
    tier: profile?.tier ?? 1,
    totalSessions: sessions,
    totalMilestones: milestones,
    coherenceStreak: coherenceStreak?.count ?? 0,
    nsAvg30d,
    pillarRings: rings,
    pillarWeights: profile ? JSON.parse(profile.pillarWeights) : null,
  });
});

export default router;
