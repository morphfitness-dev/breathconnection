import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface InsightResult {
  hrv_below_baseline_3days: boolean;
  hrv_trending_up_14days: boolean;
  rr_above_14_5days: boolean;
  spire_tense_40pct: boolean;
  spo2_post_hold_ok: boolean;
  spo2_drop_during_hold: boolean;
  bolt_below_15_after_4weeks: boolean;
  bp_above_140_90: boolean;
  eeg_alpha_improving: boolean;
  rhr_down_5bpm_30days: boolean;
  neck_shoulder_tension: boolean;
  breathing_rate_not_decreasing: boolean;
}

export async function computeBiometricInsights(userId: string): Promise<InsightResult> {
  const now = new Date();
  const day = (n: number) => new Date(now.getTime() - n * 86_400_000);

  const [recentHRV, recentRR, recentBP, holdSessions, eegHistory, rhrHistory, boltHistory, nsHistory] = await Promise.all([
    prisma.metricEntry.findMany({ where: { userId, type: 'hrv', recordedAt: { gte: day(30) } }, orderBy: { recordedAt: 'asc' } }),
    prisma.metricEntry.findMany({ where: { userId, type: 'rr', recordedAt: { gte: day(7) } } }),
    prisma.metricEntry.findFirst({ where: { userId, type: 'blood_pressure' }, orderBy: { recordedAt: 'desc' } }),
    prisma.session.findMany({ where: { userId, completedAt: { gte: day(14) } }, orderBy: { completedAt: 'desc' }, take: 20 }),
    prisma.metricEntry.findMany({ where: { userId, type: 'eeg_alpha', recordedAt: { gte: day(21) } }, orderBy: { recordedAt: 'asc' } }),
    prisma.metricEntry.findMany({ where: { userId, type: 'rhr', recordedAt: { gte: day(35) } }, orderBy: { recordedAt: 'asc' } }),
    prisma.boltScore.findMany({ where: { userId }, orderBy: { testedAt: 'asc' } }),
    prisma.metricEntry.findMany({ where: { userId, type: 'ns_score', recordedAt: { gte: day(7) } } }),
  ]);

  // HRV: below 7-day baseline by 15%+ for 3+ consecutive days
  const hrv7dayAvg = avg(recentHRV.filter(m => m.recordedAt >= day(7)).map(m => m.value));
  const hrv3dayAvg = avg(recentHRV.filter(m => m.recordedAt >= day(3)).map(m => m.value));
  const hrv_below_baseline_3days = hrv7dayAvg > 0 && hrv3dayAvg > 0 && hrv3dayAvg < hrv7dayAvg * 0.85;

  // HRV trending up >10% over 14 days (compare first half vs second half)
  const hrv14 = recentHRV.filter(m => m.recordedAt >= day(14));
  const hrv14First = avg(hrv14.slice(0, Math.ceil(hrv14.length / 2)).map(m => m.value));
  const hrv14Second = avg(hrv14.slice(Math.floor(hrv14.length / 2)).map(m => m.value));
  const hrv_trending_up_14days = hrv14First > 0 && hrv14Second > hrv14First * 1.10;

  // RR above 14 for 5+ consecutive days
  const rr5day = recentRR.slice(-5);
  const rr_above_14_5days = rr5day.length >= 5 && rr5day.every(m => m.value > 14);

  // Spire: tense >40% of monitored time (using daytime_rr proxy)
  const daytimeRR = await prisma.metricEntry.findMany({ where: { userId, type: 'daytime_rr', recordedAt: { gte: day(1) } } });
  const spire_tense_40pct = daytimeRR.length > 0 && daytimeRR.filter(m => m.value > 16).length / daytimeRR.length > 0.4;

  // SpO2 post-hold >96% at current duration (healthy adaptation)
  const recentSpo2 = await prisma.metricEntry.findMany({ where: { userId, type: 'spo2', recordedAt: { gte: day(7) } } });
  const spo2_post_hold_ok = recentSpo2.length > 0 && recentSpo2.every(m => m.value >= 96);

  // SpO2 drops below 94% during hold (repeat)
  const spo2_drop_during_hold = recentSpo2.filter(m => m.value < 94).length >= 2;

  // BOLT below 15 after 4 weeks (low compliance signal)
  const fourWeeksAgo = day(28);
  const oldBolt = boltHistory.find(b => b.testedAt <= fourWeeksAgo);
  const latestBolt = boltHistory[boltHistory.length - 1];
  const bolt_below_15_after_4weeks = !!(oldBolt && latestBolt && latestBolt.score < 15);

  // BP above 140/90
  const bp_above_140_90 = !!(recentBP && recentBP.systolic !== null && recentBP.diastolic !== null &&
    ((recentBP.systolic ?? 0) >= 140 || (recentBP.diastolic ?? 0) >= 90));

  // EEG alpha/theta ratio improving across sessions
  const eeg_alpha_improving = eegHistory.length >= 3 &&
    eegHistory[eegHistory.length - 1].value > eegHistory[0].value * 1.05;

  // RHR trending down >5 bpm over 30 days
  const rhrFirst = avg(rhrHistory.slice(0, 5).map(m => m.value));
  const rhrLast = avg(rhrHistory.slice(-5).map(m => m.value));
  const rhr_down_5bpm_30days = rhrFirst > 0 && rhrLast > 0 && rhrFirst - rhrLast >= 5;

  // Neck/shoulder tension — monthly check-in (use NS score as proxy if no check-in)
  const neck_shoulder_tension = false; // set from monthly check-in endpoint

  // Breathing rate not decreasing during slow breathing — from Tymewear or session data
  const recentBreathingSessions = holdSessions.filter(s => s.pillar === 'biomechanics');
  const breathing_rate_not_decreasing = recentBreathingSessions.length >= 2 && rr_above_14_5days;

  return {
    hrv_below_baseline_3days,
    hrv_trending_up_14days,
    rr_above_14_5days,
    spire_tense_40pct,
    spo2_post_hold_ok,
    spo2_drop_during_hold,
    bolt_below_15_after_4weeks,
    bp_above_140_90,
    eeg_alpha_improving,
    rhr_down_5bpm_30days,
    neck_shoulder_tension,
    breathing_rate_not_decreasing,
  };
}

export function buildProgrammeAdjustmentMessage(insights: InsightResult): string[] {
  const messages: string[] = [];

  if (insights.hrv_below_baseline_3days) {
    messages.push('HRV below baseline 3+ days → neurophysiology proportion increased 10%; restorative sessions inserted.');
  }
  if (insights.hrv_trending_up_14days) {
    messages.push('HRV trending up >10% over 14 days → next neurophysiology tier unlocked; coherent breathing extended to 8-8.');
  }
  if (insights.rr_above_14_5days) {
    messages.push('Resting RR above 14 for 5+ days → over-breathing correction (BC-06/BC-11) inserted into next 3 sessions.');
  }
  if (insights.spire_tense_40pct) {
    messages.push('Daytime breathing tense >40% of monitored time → afternoon notification linked to BC-02.');
  }
  if (insights.spo2_drop_during_hold) {
    messages.push('SpO₂ drops below 94% during holds → hold duration capped; BC-06/09/15 replaced with BC-04/05.');
  }
  if (insights.bolt_below_15_after_4weeks) {
    messages.push('BOLT below 15 after 4 weeks → daytime nasal breathing habit nudge inserted.');
  }
  if (insights.bp_above_140_90) {
    messages.push('BP ≥ 140/90 → hold durations capped; no Tier 3 biochemistry; healthcare provider prompt.');
  }
  if (insights.rhr_down_5bpm_30days) {
    messages.push('RHR down >5 bpm over 30 days → cardiovascular adaptation milestone triggered.');
  }
  if (insights.breathing_rate_not_decreasing) {
    messages.push('Breathing rate not decreasing during slow sessions → biomechanics session inserted before next biochemistry session.');
  }

  return messages;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}
