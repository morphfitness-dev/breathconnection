import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface WearableDevice {
  deviceType: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

interface WearableStatusProps {
  devices: WearableDevice[];
}

const DEVICE_NAMES: Record<string, string> = {
  oura: 'Oura Ring',
  whoop: 'WHOOP',
  apple_health: 'Apple Health',
  google_health: 'Google Health',
  muse: 'Muse',
  flowtime: 'Flowtime',
  tymewear: 'Tymewear',
  spire: 'Spire',
  hilo: 'Hilo Band',
};

export function WearableStatus({ devices }: WearableStatusProps) {
  const connected = devices.filter(d => d.isConnected);
  if (connected.length === 0) return null;

  return (
    <View style={styles.container}>
      {connected.map(device => (
        <View key={device.deviceType} style={styles.chip}>
          <View style={styles.dot} />
          <Text style={styles.name}>{DEVICE_NAMES[device.deviceType] ?? device.deviceType}</Text>
          {device.lastSyncedAt && (
            <Text style={styles.synced}>
              {formatSync(device.lastSyncedAt)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function formatSync(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bgCard,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  name: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  synced: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
});
