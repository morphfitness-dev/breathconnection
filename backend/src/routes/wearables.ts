import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Supported wearables with their capabilities
const WEARABLE_CATALOGUE = {
  oura: {
    name: 'Oura Ring Gen 4',
    modalities: ['hrv', 'rhr', 'spo2', 'rr_sleep'],
    description: 'Best-in-class HRV accuracy. Primary recommended wearable.',
    price: '$349 + $5.99/month',
    tier: 'primary',
    authType: 'oauth',
  },
  whoop: {
    name: 'WHOOP 5.0',
    modalities: ['hrv', 'rhr', 'rr_sleep'],
    description: '0.99 ICC for HRV. Athlete-focused.',
    price: '$239 + $30/month',
    tier: 'secondary',
    authType: 'oauth',
  },
  apple_health: {
    name: 'Apple HealthKit',
    modalities: ['hrv_spot', 'rhr', 'spo2'],
    description: 'Universal fallback. Works with most Apple Watch models.',
    price: 'Free (requires compatible device)',
    tier: 'fallback',
    authType: 'healthkit',
  },
  google_health: {
    name: 'Google Health Connect',
    modalities: ['hrv_spot', 'rhr'],
    description: 'Android data aggregation layer.',
    price: 'Free',
    tier: 'fallback',
    authType: 'health_connect',
  },
  muse: {
    name: 'Muse S Athena',
    modalities: ['eeg'],
    description: 'Real-time brainwave biofeedback. Phase 2 feature.',
    price: '$399',
    tier: 'eeg',
    authType: 'sdk',
  },
  flowtime: {
    name: 'Flowtime Biosensing Headband',
    modalities: ['eeg', 'hrv'],
    description: 'Mid-range EEG option.',
    price: '~$199',
    tier: 'eeg',
    authType: 'sdk',
  },
  tymewear: {
    name: 'Tymewear VitalPro',
    modalities: ['breathing_rate', 'tidal_volume', 'minute_ventilation'],
    description: 'Lab-grade real-time breathing mechanics. Athlete segment.',
    price: '~$199 + $15/month',
    tier: 'breathing',
    authType: 'api',
  },
  spire: {
    name: 'Spire Stone',
    modalities: ['daytime_breathing_pattern'],
    description: 'Daytime breathing pattern monitoring.',
    price: '~$129',
    tier: 'breathing',
    authType: 'api',
  },
  hilo: {
    name: 'Hilo Band',
    modalities: ['blood_pressure', 'hrv', 'rr'],
    description: 'CE-marked continuous cuffless BP. FDA clearance expected 2026.',
    price: 'TBD',
    tier: 'bp_primary',
    authType: 'api',
    note: 'Integration available post-FDA clearance (2026)',
  },
};

router.get('/catalogue', requireAuth, (_req: AuthRequest, res: Response) => {
  res.json(WEARABLE_CATALOGUE);
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const connections = await prisma.wearableConnection.findMany({
    where: { userId: req.userId! },
  });
  res.json(connections);
});

const connectSchema = z.object({
  deviceType: z.enum(['oura', 'whoop', 'apple_health', 'google_health', 'muse', 'flowtime', 'tymewear', 'spire', 'hilo']),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

router.post('/connect', requireAuth, async (req: AuthRequest, res: Response) => {
  const parse = connectSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const { deviceType, accessToken, refreshToken } = parse.data;

  const connection = await prisma.wearableConnection.upsert({
    where: {
      id: (await prisma.wearableConnection.findFirst({ where: { userId, deviceType } }))?.id ?? 'new',
    },
    update: {
      isConnected: true,
      accessToken,
      refreshToken,
      lastSyncedAt: new Date(),
    },
    create: {
      userId,
      deviceType,
      isConnected: true,
      accessToken,
      refreshToken,
      lastSyncedAt: new Date(),
    },
  });

  res.json({ connection, device: WEARABLE_CATALOGUE[deviceType as keyof typeof WEARABLE_CATALOGUE] });
});

router.post('/disconnect', requireAuth, async (req: AuthRequest, res: Response) => {
  const { deviceType } = req.body;
  await prisma.wearableConnection.updateMany({
    where: { userId: req.userId!, deviceType },
    data: { isConnected: false, accessToken: null, refreshToken: null },
  });
  res.json({ disconnected: true });
});

// Terra API webhook endpoint for normalised data ingestion
router.post('/terra/webhook', async (req: AuthRequest, res: Response) => {
  const { user, type, data } = req.body;
  // In production, verify Terra webhook signature here
  console.log(`Terra webhook: user=${user?.user_id}, type=${type}`);
  res.json({ received: true });
});

export default router;
