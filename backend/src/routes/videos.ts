import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { uploadVideo, presignUpload } from '../lib/storage';

const prisma = new PrismaClient();
const router = Router();

// Memory storage — buffer is handed to storage lib which writes to S3 or local disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream');
  },
});

const videoMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  pillar: z.enum(['biomechanics', 'biochemistry', 'neurophysiology']),
  tier: z.coerce.number().int().min(1).max(4).default(1),
  durationSeconds: z.coerce.number().int().positive(),
  technique: z.string().min(1),
  instructorStyle: z.enum(['warm', 'clinical', 'energising', 'calm']).default('warm'),
  biometricFeedbackType: z.enum(['hrv', 'eeg', 'breathing_rate', 'spO2', 'blood_pressure', 'none']).default('none'),
  nsScoreMin: z.coerce.number().int().optional(),
  fourWeekAnchor: z.coerce.boolean().default(false),
  tags: z.string().default('[]'),
  contraindicated: z.string().default('[]'),
  thumbnailUrl: z.string().optional(),
});

// GET /api/videos — list all videos (used by LibraryScreen)
router.get('/', async (_req: Request, res: Response) => {
  const videos = await prisma.video.findMany({ orderBy: [{ pillar: 'asc' }, { tier: 'asc' }] });
  res.json(videos);
});

// GET /api/videos/:id — single video metadata
router.get('/:id', async (req: Request, res: Response) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(video);
});

// POST /api/videos/upload — multipart upload (file + JSON meta in fields)
// Requires auth. In production restrict to admin role; for now any authed user works for seeding.
router.post('/upload', requireAuth, upload.single('video'), async (req: AuthRequest, res: Response) => {
  const parse = videoMetaSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: parse.error.flatten() }); return; }

  const meta = parse.data;

  if (!req.file) {
    // No file attached — just upsert metadata (useful for updating description/tags)
    const video = await prisma.video.upsert({
      where: { id: meta.id },
      create: { ...meta },
      update: { ...meta },
    });
    res.json({ video, uploaded: false });
    return;
  }

  const ext = req.file.originalname.split('.').pop() ?? 'mp4';
  const key = `videos/${meta.pillar}/${meta.id}.${ext}`;
  const videoUrl = await uploadVideo(key, req.file.buffer, req.file.mimetype);

  const video = await prisma.video.upsert({
    where: { id: meta.id },
    create: { ...meta, videoUrl },
    update: { ...meta, videoUrl },
  });

  res.json({ video, uploaded: true, videoUrl });
});

// POST /api/videos/presign — get a pre-signed S3 PUT URL for large client-side uploads
router.post('/presign', requireAuth, async (req: AuthRequest, res: Response) => {
  const { videoId, pillar, ext = 'mp4', contentType = 'video/mp4' } = req.body;
  if (!videoId || !pillar) { res.status(400).json({ error: 'videoId and pillar required' }); return; }
  try {
    const key = `videos/${pillar}/${videoId}.${ext}`;
    const url = await presignUpload(key, contentType);
    res.json({ uploadUrl: url, key });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/videos/seed — bulk upsert metadata from the static videoMetadata list
// Accepts array of video objects, no file upload required
router.post('/seed', requireAuth, async (req: AuthRequest, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) { res.status(400).json({ error: 'Expected array' }); return; }

  const results = [];
  for (const item of items) {
    const parse = videoMetaSchema.safeParse(item);
    if (!parse.success) continue;
    const video = await prisma.video.upsert({
      where: { id: parse.data.id },
      create: { ...parse.data },
      update: { ...parse.data },
    });
    results.push(video);
  }
  res.json({ seeded: results.length });
});

export default router;
