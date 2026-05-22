import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { VIDEO_LIBRARY } from '../data/videoLibrary';

const prisma = new PrismaClient();
const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const programme = await prisma.programme.findUnique({ where: { userId } });
  if (!programme) {
    res.status(404).json({ error: 'No programme found. Complete your assessment first.' });
    return;
  }

  const weeklyPlan = JSON.parse(programme.weeklyPlan);
  const currentWeekPlan = weeklyPlan[programme.currentWeek - 1];

  // Enrich with video metadata
  if (currentWeekPlan?.sessions) {
    currentWeekPlan.sessions = currentWeekPlan.sessions.map((s: any) => ({
      ...s,
      video: s.videoId ? VIDEO_LIBRARY.find(v => v.id === s.videoId) : null,
    }));
  }

  res.json({
    currentWeek: programme.currentWeek,
    startedAt: programme.startedAt,
    currentWeekPlan,
    pillarWeights: JSON.parse(programme.pillarWeights),
    sessionDuration: programme.sessionDuration,
  });
});

router.get('/videos', requireAuth, async (_req: AuthRequest, res: Response) => {
  res.json(VIDEO_LIBRARY);
});

router.get('/videos/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const video = VIDEO_LIBRARY.find(v => v.id === req.params.id);
  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }
  res.json(video);
});

router.post('/advance-week', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const programme = await prisma.programme.findUnique({ where: { userId } });
  if (!programme) {
    res.status(404).json({ error: 'No programme found' });
    return;
  }

  const weeklyPlan = JSON.parse(programme.weeklyPlan);
  const maxWeek = weeklyPlan.length;

  if (programme.currentWeek >= maxWeek) {
    res.json({ message: 'Programme complete', currentWeek: programme.currentWeek });
    return;
  }

  const updated = await prisma.programme.update({
    where: { userId },
    data: { currentWeek: { increment: 1 } },
  });

  res.json({ currentWeek: updated.currentWeek });
});

export default router;
