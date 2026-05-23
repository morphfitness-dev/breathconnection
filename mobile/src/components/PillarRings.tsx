import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, PILLAR_CONFIG } from '../constants/theme';

interface RingProps {
  progress: number;
  color: string;
  size: number;
  strokeWidth: number;
}

function Ring({ progress, color, size, strokeWidth }: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color + '33'}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

interface PillarRingsProps {
  biomechanics: number;
  biochemistry: number;
  neurophysiology: number;
  size?: 'small' | 'large';
}

export function PillarRings({ biomechanics, biochemistry, neurophysiology, size = 'large' }: PillarRingsProps) {
  const ringSize = size === 'large' ? 80 : 52;
  const strokeWidth = size === 'large' ? 8 : 5;

  const rings = [
    { key: 'biomechanics', progress: biomechanics, ...PILLAR_CONFIG.biomechanics },
    { key: 'biochemistry', progress: biochemistry, ...PILLAR_CONFIG.biochemistry },
    { key: 'neurophysiology', progress: neurophysiology, ...PILLAR_CONFIG.neurophysiology },
  ];

  return (
    <View style={styles.container}>
      {rings.map(({ key, progress, color, shortLabel }) => (
        <View key={key} style={styles.ringItem}>
          <Ring progress={progress} color={color} size={ringSize} strokeWidth={strokeWidth} />
          {size === 'large' && (
            <Text style={[styles.label, { color }]}>{shortLabel}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringItem: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
