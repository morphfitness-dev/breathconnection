import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../constants/theme';

export type BreathPhase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out' | 'idle';

interface BreathingCircleProps {
  phase: BreathPhase;
  durationSeconds: number;
  inhaleSeconds: number;
  exhaleSeconds: number;
  holdInSeconds?: number;
  holdOutSeconds?: number;
  color?: string;
  size?: number;
}

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Inhale',
  hold_in: 'Hold',
  exhale: 'Exhale',
  hold_out: 'Hold',
  idle: 'Ready',
};

export function BreathingCircle({
  phase,
  inhaleSeconds,
  exhaleSeconds,
  holdInSeconds = 0,
  holdOutSeconds = 0,
  color = COLORS.primary,
  size = 220,
}: BreathingCircleProps) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    switch (phase) {
      case 'inhale':
        animations.push(
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1, duration: inhaleSeconds * 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: inhaleSeconds * 1000, useNativeDriver: true }),
          ])
        );
        break;
      case 'exhale':
        animations.push(
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.6, duration: exhaleSeconds * 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.4, duration: exhaleSeconds * 1000, useNativeDriver: true }),
          ])
        );
        break;
      case 'hold_in':
      case 'hold_out':
        // Gentle pulse during hold
        animations.push(
          Animated.loop(
            Animated.sequence([
              Animated.timing(opacityAnim, { toValue: 0.9, duration: 500, useNativeDriver: true }),
              Animated.timing(opacityAnim, { toValue: 0.7, duration: 500, useNativeDriver: true }),
            ]),
          )
        );
        break;
    }

    if (animations.length > 0) {
      Animated.sequence(animations).start();
    }

    return () => {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [phase]);

  const inner = size * 0.6;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      {/* Inner circle */}
      <Animated.View
        style={[
          styles.innerCircle,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: color,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      {/* Phase label */}
      <View style={styles.labelContainer}>
        <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  innerCircle: {
    position: 'absolute',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
