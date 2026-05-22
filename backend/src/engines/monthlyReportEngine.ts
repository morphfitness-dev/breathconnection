import { PrismaClient } from '@prisma/client';
import { VIDEO_LIBRARY } from '../data/videoLibrary';

const prisma = new PrismaClient();

interface TechniqueEffectiveness {
  videoId: string;
  title: string;
  pillar: string;
  avgHrvDelta: number;
  avgEegShift: number;
  sessionCount: number;
  effectivenessScore: number;
}

export async function generateMonthlyReport(userId: string, reportMonth: string): Promise<Record<string, unknown>> {
  const [year, month] = reportMonth.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  // Get all completed sessions this month
  const sessions = await prisma.session.findMany({
    where: { userId, completedAt: { gte: monthStart, lte: monthEnd } },
    orderBy: { completedAt: 'asc' },
  });

  // Get metrics at start and end of month
  const [boltStart, boltEnd, rhrMetrics, rrrMetrics, hrvMetrics] = await Promise.all([
    prisma.boltScore.findFirst({ where: { userId, testedAt: { lte: monthStart } }, orderBy: { testedAt: 'desc' } }),
    prisma.boltScore.findFirst({ where: { userId, testedAt: { lte: monthEnd } }, orderBy: { testedAt: 'desc' } }),
    prisma.metricEntry.findMany({ where: { userId, type: 'rhr', recordedAt: { gte: monthStart, lte: monthEnd } }, orderBy: { recordedAt: 'asc' } }),
    prisma.metricEntry.findMany({ where: { userId, type: 'rr', recordedAt: { gte: monthStart, lte: monthEnd } }, orderBy: { recordedAt: 'asc' } }),
    prisma.metricEntry.findMany({ where: { userId, type: 'hrv', recordedAt: { gte: monthStart, lte: monthEnd } }, orderBy: { recordedAt: 'asc' } }),
  ]);

  const rhrStart = rhrMetrics[0]?.value ?? null;
  const rhrEnd = rhrMetrics[rhrMetrics.length - 1]?.value ?? null;
  const rrStart = rrrMetrics[0]?.value ?? null;
  const rrEnd = rrrMetrics[rrrMetrics.length - 1]?.value ?? null;

  // HRV trend
  let hrvTrend = 'stable';
  if (hrvMetrics.length >= 4) {
    const firstHalf = hrvMetrics.slice(0, Math.ceil(hrvMetrics.length / 2));
    const secondHalf = hrvMetrics.slice(Math.floor(hrvMetrics.length / 2));
    const firstAvg = firstHalf.reduce((s, m) => s + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, m) => s + m.value, 0) / secondHalf.length;
    if (secondAvg > firstAvg * 1.05) hrvTrend = 'up';
    else if (secondAvg < firstAvg * 0.95) hrvTrend = 'down';
  }

  // Technique effectiveness — find techniques with highest HRV delta
  const techniqueMap = new Map<string, { hrvDeltas: number[]; eegShifts: number[] }>();
  for (const session of sessions) {
    if (session.preHrv && session.postHrv) {
      const delta = session.postHrv - session.preHrv;
      const existing = techniqueMap.get(session.videoId) ?? { hrvDeltas: [], eegShifts: [] };
      existing.hrvDeltas.push(delta);
      if (session.eegAlphaRatio) existing.eegShifts.push(session.eegAlphaRatio);
      techniqueMap.set(session.videoId, existing);
    }
  }

  const techniques: TechniqueEffectiveness[] = [];
  for (const [videoId, data] of techniqueMap.entries()) {
    if (data.hrvDeltas.length < 2) continue;
    const video = VIDEO_LIBRARY.find(v => v.id === videoId);
    if (!video) continue;
    const avgHrvDelta = data.hrvDeltas.reduce((s, d) => s + d, 0) / data.hrvDeltas.length;
    const avgEegShift = data.eegShifts.length > 0 ? data.eegShifts.reduce((s, d) => s + d, 0) / data.eegShifts.length : 0;
    const effectivenessScore = avgHrvDelta * 2 + avgEegShift;
    techniques.push({ videoId, title: video.title, pillar: video.pillar, avgHrvDelta, avgEegShift, sessionCount: data.hrvDeltas.length, effectivenessScore });
  }

  const topTechniques = techniques
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
    .slice(0, 3);

  // Pillar breakdown
  const pillarCounts = { biomechanics: 0, biochemistry: 0, neurophysiology: 0 };
  for (const s of sessions) {
    if (s.pillar in pillarCounts) pillarCounts[s.pillar as keyof typeof pillarCounts]++;
  }

  // Generate narrative
  const narrative = buildNarrative({
    boltStart: boltStart?.score,
    boltEnd: boltEnd?.score,
    rhrStart,
    rhrEnd,
    rrStart,
    rrEnd,
    hrvTrend,
    totalSessions: sessions.length,
    topTechniques,
  });

  // Persist report
  const existing = await prisma.monthlyReport.findFirst({ where: { userId, reportMonth } });
  if (!existing) {
    await prisma.monthlyReport.create({
      data: {
        userId,
        reportMonth,
        boltStart: boltStart?.score,
        boltEnd: boltEnd?.score,
        rhrStart,
        rhrEnd,
        hrvTrend,
        rrStart,
        rrEnd,
        topTechniques: JSON.stringify(topTechniques.map(t => t.title)),
        totalSessions: sessions.length,
      },
    });

    await prisma.userMilestone.create({
      data: {
        userId,
        milestoneType: `monthly_report_${await prisma.monthlyReport.count({ where: { userId } })}`,
        data: JSON.stringify({ month: reportMonth }),
      },
    });
  }

  return {
    reportMonth,
    totalSessions: sessions.length,
    pillarBreakdown: pillarCounts,
    metrics: {
      bolt: { start: boltStart?.score ?? null, end: boltEnd?.score ?? null, change: boltEnd && boltStart ? +(boltEnd.score - boltStart.score).toFixed(1) : null },
      rhr: { start: rhrStart, end: rhrEnd, change: rhrStart && rhrEnd ? +(rhrEnd - rhrStart).toFixed(1) : null },
      rr: { start: rrStart, end: rrEnd, change: rrStart && rrEnd ? +(rrEnd - rrStart).toFixed(1) : null },
      hrv: { trend: hrvTrend },
    },
    topTechniques,
    narrative,
  };
}

function buildNarrative(data: {
  boltStart?: number;
  boltEnd?: number;
  rhrStart?: number | null;
  rhrEnd?: number | null;
  rrStart?: number | null;
  rrEnd?: number | null;
  hrvTrend: string;
  totalSessions: number;
  topTechniques: TechniqueEffectiveness[];
}): string {
  const lines: string[] = [];

  lines.push(`This month you completed ${data.totalSessions} session${data.totalSessions !== 1 ? 's' : ''}.`);

  if (data.boltStart && data.boltEnd) {
    const delta = +(data.boltEnd - data.boltStart).toFixed(1);
    if (delta > 0) lines.push(`Your BOLT score improved from ${data.boltStart}s to ${data.boltEnd}s — a gain of ${delta} seconds.`);
    else if (delta < 0) lines.push(`Your BOLT score moved from ${data.boltStart}s to ${data.boltEnd}s this month. Consistent nasal breathing practice will rebuild momentum.`);
    else lines.push(`Your BOLT score held steady at ${data.boltEnd}s.`);
  }

  if (data.rhrStart && data.rhrEnd) {
    const delta = +(data.rhrEnd - data.rhrStart).toFixed(0);
    if (delta <= -2) lines.push(`Resting heart rate dropped by ${Math.abs(delta)} bpm — a clear cardiovascular adaptation signal.`);
  }

  if (data.rrStart && data.rrEnd) {
    const delta = +(data.rrEnd - data.rrStart).toFixed(1);
    if (delta <= -1) lines.push(`Your resting respiratory rate dropped from ${data.rrStart} to ${data.rrEnd} breaths per minute — exactly what the biochemistry programme is designed to produce.`);
  }

  if (data.hrvTrend === 'up') lines.push('HRV trended upward this month — your nervous system is adapting positively to your practice.');
  else if (data.hrvTrend === 'down') lines.push('HRV trended downward — consider adding more neurophysiology sessions and restorative practice.');

  if (data.topTechniques.length > 0) {
    lines.push(`The techniques that shifted your nervous system state most reliably this month: ${data.topTechniques.map(t => t.title).join(', ')}.`);
  }

  return lines.join(' ');
}
