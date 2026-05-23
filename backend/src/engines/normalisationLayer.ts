import type { NormalisedMetric, MetricType, MetricSource } from '../types';

interface RawWearableMetric {
  source: MetricSource;
  type: string;
  value?: number;
  systolic?: number;
  diastolic?: number;
  context?: string;
  timestamp?: string;
}

const SOURCE_TRUST_ORDER: MetricSource[] = ['oura', 'whoop', 'tymewear', 'spire', 'apple_health', 'manual'];

export function normaliseMetric(raw: RawWearableMetric): NormalisedMetric | null {
  const type = mapToInternalType(raw.source, raw.type);
  if (!type) return null;

  let value = raw.value ?? 0;

  // Convert SDNN to approximate RMSSD for normalisation (Garmin uses SDNN)
  if (raw.source === 'apple_health' && raw.type === 'sdnn_hrv') {
    value = value * 0.85; // approximate conversion factor
  }

  // Validate ranges
  if (!isValueInRange(type, value)) return null;

  return {
    type,
    value,
    systolic: raw.systolic,
    diastolic: raw.diastolic,
    source: raw.source,
    context: raw.context,
    recordedAt: raw.timestamp ? new Date(raw.timestamp) : new Date(),
  };
}

function mapToInternalType(source: MetricSource, rawType: string): MetricType | null {
  const map: Record<string, MetricType> = {
    'hrv': 'hrv',
    'rmssd_hrv': 'hrv',
    'sdnn_hrv': 'hrv',
    'heart_rate_variability': 'hrv',
    'resting_heart_rate': 'rhr',
    'heart_rate': 'rhr',
    'respiratory_rate': 'rr',
    'breathing_rate': 'rr',
    'spo2': 'spo2',
    'oxygen_saturation': 'spo2',
    'blood_pressure': 'blood_pressure',
    'ns_score': 'ns_score',
    'eeg_alpha': 'eeg_alpha',
    'daytime_rr': 'daytime_rr',
  };
  return map[rawType.toLowerCase()] ?? null;
}

function isValueInRange(type: MetricType, value: number): boolean {
  const ranges: Record<MetricType, [number, number]> = {
    hrv: [1, 200],
    rhr: [30, 120],
    rr: [2, 60],
    spo2: [70, 100],
    blood_pressure: [40, 250],
    ns_score: [0, 100],
    eeg_alpha: [0, 100],
    daytime_rr: [2, 60],
    bolt: [0, 120],
  };
  const [min, max] = ranges[type];
  return value >= min && value <= max;
}

export function calculate7DayAverage(entries: Array<{ value: number; recordedAt: Date }>, type: MetricType): number | null {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = entries.filter(e => e.recordedAt >= cutoff);
  if (recent.length === 0) return null;
  return recent.reduce((sum, e) => sum + e.value, 0) / recent.length;
}

export function detectBiometricAlerts(
  metrics: Array<{ type: MetricType; value: number; recordedAt: Date }>,
): Array<{ alert: string; severity: 'info' | 'warning' | 'critical' }> {
  const alerts = [];

  // Check for SpO2 drops
  const spo2 = metrics.filter(m => m.type === 'spo2').sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
  if (spo2 && spo2.value < 92) {
    alerts.push({ alert: 'spo2_critical', severity: 'critical' as const });
  } else if (spo2 && spo2.value < 94) {
    alerts.push({ alert: 'spo2_low', severity: 'warning' as const });
  }

  // Check for elevated RR
  const rrEntries = metrics.filter(m => m.type === 'rr');
  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const recentRR = rrEntries.filter(e => e.recordedAt >= cutoff);
  if (recentRR.length >= 5) {
    const avgRR = recentRR.reduce((s, e) => s + e.value, 0) / recentRR.length;
    if (avgRR > 14) {
      alerts.push({ alert: 'rr_elevated_5days', severity: 'info' as const });
    }
  }

  return alerts;
}

export function isBPSafe(systolic: number, diastolic: number): boolean {
  return systolic < 140 && diastolic < 90;
}

export function getBPSourceLabel(source: MetricSource): string {
  const labels: Record<MetricSource, string> = {
    manual: 'Blood Pressure Reading',
    oura: 'BP trend estimate — not clinically validated',
    whoop: 'BP trend estimate — not clinically validated',
    apple_health: 'BP trend estimate — not clinically validated',
    tymewear: 'BP trend estimate — not clinically validated',
    spire: 'BP trend estimate — not clinically validated',
  };
  return labels[source] ?? 'Blood Pressure Reading';
}
