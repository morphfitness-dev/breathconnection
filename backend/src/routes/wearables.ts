import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { normaliseMetric } from '../engines/normalisationLayer';
import type { MetricSource } from '../types';

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

  const existing = await prisma.wearableConnection.findFirst({ where: { userId, deviceType } });
  const connection = existing
    ? await prisma.wearableConnection.update({
        where: { id: existing.id },
        data: { isConnected: true, accessToken, refreshToken, lastSyncedAt: new Date() },
      })
    : await prisma.wearableConnection.create({
        data: { userId, deviceType, isConnected: true, accessToken, refreshToken, lastSyncedAt: new Date() },
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

// Terra API webhook — normalises and persists wearable metrics
router.post('/terra/webhook', async (req: AuthRequest, res: Response) => {
  const { user: terraUser, type, data } = req.body;

  // Terra sends data.body for activity/daily/sleep payloads
  const payload = data?.body ?? data;
  if (!terraUser?.user_id || !Array.isArray(payload)) {
    res.json({ received: true, processed: 0 });
    return;
  }

  // Look up which user owns this terra user_id
  const wearable = await prisma.wearableConnection.findFirst({
    where: { accessToken: terraUser.user_id },
  });
  if (!wearable) {
    res.json({ received: true, processed: 0, reason: 'no_matching_user' });
    return;
  }

  const userId = wearable.userId;
  const source = wearable.deviceType as MetricSource;

  // Map Terra data types to raw metrics
  const rawMetrics: Array<{ type: string; value?: number; systolic?: number; diastolic?: number; timestamp?: string }> = [];

  for (const sample of payload) {
    if (type === 'daily' || type === 'sleep') {
      if (sample.heart_rate_data?.summary?.avg_hrv_rmssd !== undefined) {
        rawMetrics.push({ type: 'rmssd_hrv', value: sample.heart_rate_data.summary.avg_hrv_rmssd, timestamp: sample.metadata?.start_time });
      }
      if (sample.heart_rate_data?.summary?.resting_hr_bpm !== undefined) {
        rawMetrics.push({ type: 'resting_heart_rate', value: sample.heart_rate_data.summary.resting_hr_bpm, timestamp: sample.metadata?.start_time });
      }
      if (sample.oxygen_data?.avg_saturation_percentage !== undefined) {
        rawMetrics.push({ type: 'spo2', value: sample.oxygen_data.avg_saturation_percentage, timestamp: sample.metadata?.start_time });
      }
      if (sample.respiration_data?.avg_breaths_per_min !== undefined) {
        rawMetrics.push({ type: 'respiratory_rate', value: sample.respiration_data.avg_breaths_per_min, timestamp: sample.metadata?.start_time });
      }
    }
    if (type === 'body') {
      if (sample.blood_pressure_data?.avg_systolic_mmhg !== undefined) {
        rawMetrics.push({
          type: 'blood_pressure',
          value: sample.blood_pressure_data.avg_systolic_mmhg,
          systolic: sample.blood_pressure_data.avg_systolic_mmhg,
          diastolic: sample.blood_pressure_data.avg_diastolic_mmhg,
          timestamp: sample.metadata?.start_time,
        });
      }
    }
  }

  let processed = 0;
  const entries = [];
  for (const raw of rawMetrics) {
    const normalised = normaliseMetric({ source, ...raw });
    if (normalised) {
      entries.push({
        userId,
        type: normalised.type,
        value: normalised.value,
        systolic: normalised.systolic,
        diastolic: normalised.diastolic,
        source: normalised.source,
        recordedAt: normalised.recordedAt,
      });
      processed++;
    }
  }

  if (entries.length > 0) {
    await prisma.metricEntry.createMany({ data: entries as any });
    await prisma.wearableConnection.update({
      where: { id: wearable.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  res.json({ received: true, processed });
});

export default router;
