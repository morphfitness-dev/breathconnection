import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calculatePillarWeights, determineContraindications, determineTier } from '../engines/assessmentEngine';
import { generateFourWeekProgramme } from '../engines/programmeEngine';

const prisma = new PrismaClient();
const router = Router();

const assessmentSchema = z.object({
  boltScore: z.number().min(0).max(120).optional(),
  restingRR: z.number().min(2).max(60).optional(),
  restingHR: z.number().min(30).max(120).optional(),
  hrv: z.number().min(1).max(200).optional(),
  breathingPattern: z.enum(['chest_dominant', 'diaphragmatic', 'mixed']).optional(),
  hasStressIssues: z.boolean().optional(),
  hasSleepIssues: z.boolean().optional(),
  hasFocusIssues: z.boolean().optional(),
  hasAnxiety: z.boolean().optional(),
  hasFatigue: z.boolean().optional(),
  primaryGoal: z.string().optional(),
  secondaryGoals: z.array(z.string()).optional(),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'athlete']).optional(),
  hasHypertension: z.boolean().optional(),
  hasHeartCondition: z.boolean().optional(),
  hasEpilepsy: z.boolean().optional(),
  isPregnant: z.boolean().optional(),
  hasCOPD: z.boolean().optional(),
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = assessmentSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const data = parse.data;
  const userId = req.userId!;

  const pillarWeights = calculatePillarWeights(data);
  const contraindications = determineContraindications(data);
  const tier = determineTier(data.boltScore, data.hrv);

  // Save assessment
  await prisma.assessment.upsert({
    where: { userId },
    update: {
      boltScore: data.boltScore,
      restingRR: data.restingRR,
      restingHR: data.restingHR,
      hrv: data.hrv,
      breathingPattern: data.breathingPattern,
      hasStressIssues: data.hasStressIssues ?? false,
      hasSleepIssues: data.hasSleepIssues ?? false,
      hasFocusIssues: data.hasFocusIssues ?? false,
      hasAnxiety: data.hasAnxiety ?? false,
      hasFatigue: data.hasFatigue ?? false,
      primaryGoal: data.primaryGoal,
      secondaryGoals: JSON.stringify(data.secondaryGoals ?? []),
      activityLevel: data.activityLevel,
      hasHypertension: data.hasHypertension ?? false,
      hasHeartCondition: data.hasHeartCondition ?? false,
      hasEpilepsy: data.hasEpilepsy ?? false,
      isPregnant: data.isPregnant ?? false,
      hasCOPD: data.hasCOPD ?? false,
    },
    create: {
      userId,
      boltScore: data.boltScore,
      restingRR: data.restingRR,
      restingHR: data.restingHR,
      hrv: data.hrv,
      breathingPattern: data.breathingPattern,
      hasStressIssues: data.hasStressIssues ?? false,
      hasSleepIssues: data.hasSleepIssues ?? false,
      hasFocusIssues: data.hasFocusIssues ?? false,
      hasAnxiety: data.hasAnxiety ?? false,
      hasFatigue: data.hasFatigue ?? false,
      primaryGoal: data.primaryGoal,
      secondaryGoals: JSON.stringify(data.secondaryGoals ?? []),
      activityLevel: data.activityLevel,
      hasHypertension: data.hasHypertension ?? false,
      hasHeartCondition: data.hasHeartCondition ?? false,
      hasEpilepsy: data.hasEpilepsy ?? false,
      isPregnant: data.isPregnant ?? false,
      hasCOPD: data.hasCOPD ?? false,
    },
  });

  // Update profile
  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      pillarWeights: JSON.stringify(pillarWeights),
      contraindications: JSON.stringify(contraindications),
      tier,
    },
    create: {
      userId,
      pillarWeights: JSON.stringify(pillarWeights),
      contraindications: JSON.stringify(contraindications),
      tier,
    },
  });

  // Generate 4-week programme
  const weekPlan = generateFourWeekProgramme(pillarWeights, tier, contraindications);
  await prisma.programme.upsert({
    where: { userId },
    update: {
      weeklyPlan: JSON.stringify(weekPlan),
      pillarWeights: JSON.stringify(pillarWeights),
    },
    create: {
      userId,
      weeklyPlan: JSON.stringify(weekPlan),
      pillarWeights: JSON.stringify(pillarWeights),
    },
  });

  // Save BOLT score if provided
  if (data.boltScore !== undefined) {
    await prisma.boltScore.create({
      data: { userId, score: data.boltScore },
    });
  }

  res.status(201).json({
    pillarWeights,
    contraindications,
    tier,
    programmeGenerated: true,
    message: 'Assessment complete. Your programme has been generated.',
  });
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const assessment = await prisma.assessment.findUnique({ where: { userId: req.userId! } });
  if (!assessment) {
    res.status(404).json({ error: 'No assessment found' });
    return;
  }
  res.json(assessment);
});

export default router;
