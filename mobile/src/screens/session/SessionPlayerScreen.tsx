import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../types';
import { COLORS, SPACING, PILLAR_CONFIG } from '../../constants/theme';
import { BreathingCircle } from '../../components/BreathingCircle';
import type { BreathPhase } from '../../components/BreathingCircle';
import { startSession, completeSession } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { VIDEO_METADATA } from '../../data/videoMetadata';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SessionPlayer'>;
  route: RouteProp<HomeStackParamList, 'SessionPlayer'>;
};

interface PatternConfig {
  name: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

const PATTERNS: Record<string, PatternConfig> = {
  coherent_5_5: { name: '5.5 BPM Coherence', inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0 },
  coherent_6_6: { name: '6-6 Coherence', inhale: 6, holdIn: 0, exhale: 6, holdOut: 0 },
  coherent_8_8: { name: '8-8 Advanced', inhale: 8, holdIn: 0, exhale: 8, holdOut: 0 },
  box_breathing: { name: 'Box Breathing', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  '4_7_8': { name: '4-7-8', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  extended_exhale: { name: 'Extended Exhale', inhale: 4, holdIn: 0, exhale: 8, holdOut: 0 },
  diaphragmatic_activation: { name: 'Diaphragmatic', inhale: 4, holdIn: 1, exhale: 6, holdOut: 0 },
  default: { name: 'Breathing', inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
};

export function SessionPlayerScreen({ navigation, route }: Props) {
  const { videoId } = route.params;
  const setActiveSessionId = useAppStore(s => s.setActiveSessionId);
  const today = useAppStore(s => s.today);

  const videoMeta = VIDEO_METADATA[videoId] ?? VIDEO_METADATA.default;
  const pattern = PATTERNS[videoMeta.technique] ?? PATTERNS.default;
  const pillarConfig = PILLAR_CONFIG[videoMeta.pillar as keyof typeof PILLAR_CONFIG] ?? PILLAR_CONFIG.neurophysiology;
  const hasVideoUrl = !!videoMeta.videoUrl;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'ready' | 'active' | 'paused' | 'complete'>('ready');
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [targetDuration] = useState((today?.session?.durationMinutes ?? videoMeta.durationSeconds / 60) * 60);
  const [cycleCount, setCycleCount] = useState(0);
  const [subjectiveRating, setSubjectiveRating] = useState<number | null>(null);
  const [maxHold, setMaxHold] = useState(0);
  const [holdActive, setHoldActive] = useState(false);
  const [videoPacerVisible, setVideoPacerVisible] = useState(false);

  const holdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    initSession();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, []);

  async function initSession() {
    try {
      const data = await startSession(videoId);
      setSessionId(data.sessionId);
      setActiveSessionId(data.sessionId);
    } catch {}
  }

  function startTimer() {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const e = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(e);
      if (holdActive) {
        holdRef.current += 1;
        if (holdRef.current > maxHold) setMaxHold(holdRef.current);
      }
      if (e >= targetDuration) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase('complete');
        setBreathPhase('idle');
      }
    }, 1000);
  }

  function startBreathing() {
    setPhase('active');
    if (hasVideoUrl) {
      videoRef.current?.playAsync();
    }
    startTimer();
    if (!hasVideoUrl) runCycle();
  }

  function runCycle() {
    const { inhale, holdIn, exhale, holdOut } = pattern;
    const cycleTime = (inhale + holdIn + exhale + holdOut) * 1000;

    setBreathPhase('inhale');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let offset = inhale * 1000;
    if (holdIn > 0) {
      cycleRef.current = setTimeout(() => {
        setBreathPhase('hold_in');
        setHoldActive(true);
      }, offset);
      offset += holdIn * 1000;
    }

    cycleRef.current = setTimeout(() => {
      setBreathPhase('exhale');
      setHoldActive(false);
      holdRef.current = 0;
    }, offset);
    offset += exhale * 1000;

    if (holdOut > 0) {
      cycleRef.current = setTimeout(() => setBreathPhase('hold_out'), offset);
      offset += holdOut * 1000;
    }

    cycleRef.current = setTimeout(() => {
      setCycleCount(c => c + 1);
      runCycle();
    }, cycleTime);
  }

  function pause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (cycleRef.current) clearTimeout(cycleRef.current);
    setPhase('paused');
    setBreathPhase('idle');
    setHoldActive(false);
    videoRef.current?.pauseAsync();
  }

  function resume() {
    setPhase('active');
    startTimeRef.current = Date.now() - elapsed * 1000;
    intervalRef.current = setInterval(() => {
      const e = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(e);
    }, 1000);
    videoRef.current?.playAsync();
    if (!hasVideoUrl) runCycle();
  }

  function reportDiscomfort() {
    setHoldActive(false);
    setBreathPhase('exhale');
    Alert.alert('Hold ended', 'Breathe gently. Hold target reduced for rest of session.');
  }

  const onVideoPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      setPhase('complete');
    }
  }, []);

  async function finishSession() {
    if (!sessionId) return;
    const payload: Record<string, unknown> = {
      sessionId,
      durationSeconds: elapsed,
      subjectiveRating: subjectiveRating ?? undefined,
    };
    if (maxHold > 5) payload.holdDurationSeconds = maxHold;

    try {
      const data = await completeSession(payload);
      setActiveSessionId(null);
      navigation.replace('SessionComplete', {
        gamificationEvents: data.gamificationEvents ?? [],
        coherenceAchieved: data.coherenceAchieved ?? false,
      });
    } catch {
      navigation.goBack();
    }
  }

  const progress = Math.min(1, elapsed / targetDuration);
  const remaining = Math.max(0, targetDuration - elapsed);
  const remainingMins = Math.floor(remaining / 60);
  const remainingSecs = remaining % 60;

  if (phase === 'complete') {
    return (
      <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.completeContainer]}>
          <Text style={styles.completeTitle}>Session Complete</Text>
          <Text style={styles.completeTime}>{Math.round(elapsed / 60)} minutes</Text>

          <Text style={styles.ratingLabel}>How did it feel?</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.ratingButton, subjectiveRating === r && styles.ratingButtonSelected]}
                onPress={() => setSubjectiveRating(r)}
              >
                <Text style={styles.ratingEmoji}>{['😞', '😐', '😊', '😌', '🤩'][r - 1]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {maxHold > 5 && (
            <Text style={styles.holdRecord}>Longest hold: {maxHold}s</Text>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={finishSession}>
            <Text style={styles.saveButtonText}>Save & Continue →</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.fill}>
      {/* Video background (when videoUrl available) */}
      {hasVideoUrl && (
        <Video
          ref={videoRef}
          source={{ uri: videoMeta.videoUrl! }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={onVideoPlaybackStatusUpdate}
        />
      )}

      {/* Dark overlay for readability */}
      {hasVideoUrl && <View style={styles.videoOverlay} />}

      <LinearGradient
        colors={hasVideoUrl ? ['transparent', COLORS.bg + 'CC'] : [COLORS.bg, '#0A0E1A']}
        style={styles.fill}
      >
        <SafeAreaView style={styles.fill}>
          {/* Header */}
          <View style={styles.sessionHeader}>
            <TouchableOpacity onPress={() => { pause(); navigation.goBack(); }}>
              <Text style={styles.exitButton}>✕</Text>
            </TouchableOpacity>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionPillar, { color: pillarConfig.color }]}>
                {videoMeta.pillar?.toUpperCase() ?? ''}
              </Text>
              <Text style={styles.sessionTitle} numberOfLines={1}>{videoMeta.title}</Text>
            </View>
            <Text style={styles.timerText}>
              {remainingMins}:{remainingSecs.toString().padStart(2, '0')}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.sessionProgress}>
            <View style={[styles.sessionProgressFill, { width: `${progress * 100}%` as any, backgroundColor: pillarConfig.color }]} />
          </View>

          {/* Pattern info — always visible, helps with video too */}
          <View style={styles.patternBadge}>
            <Text style={styles.patternName}>{pattern.name}</Text>
            <Text style={styles.patternTiming}>
              {pattern.inhale}s in {pattern.holdIn > 0 ? `· ${pattern.holdIn}s hold · ` : '· '}
              {pattern.exhale}s out{pattern.holdOut > 0 ? ` · ${pattern.holdOut}s hold` : ''}
            </Text>
          </View>

          {/* Breathing circle — always visible; overlays video */}
          <View style={styles.circleContainer}>
            {phase !== 'ready' ? (
              <BreathingCircle
                phase={breathPhase}
                durationSeconds={targetDuration}
                inhaleSeconds={pattern.inhale}
                exhaleSeconds={pattern.exhale}
                holdInSeconds={pattern.holdIn}
                holdOutSeconds={pattern.holdOut}
                color={pillarConfig.color}
                size={hasVideoUrl ? 180 : 240}
              />
            ) : (
              <View style={styles.readyCircle}>
                <Text style={styles.readyText}>Ready</Text>
              </View>
            )}
          </View>

          {cycleCount > 0 && !hasVideoUrl && (
            <Text style={styles.cycleCount}>{cycleCount} cycles</Text>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            {phase === 'ready' && (
              <TouchableOpacity style={[styles.mainButton, { backgroundColor: pillarConfig.color }]} onPress={startBreathing}>
                <Text style={styles.mainButtonText}>Begin</Text>
              </TouchableOpacity>
            )}
            {phase === 'active' && (
              <View style={styles.activeControls}>
                <TouchableOpacity style={styles.discomfortButton} onPress={reportDiscomfort}>
                  <Text style={styles.discomfortButtonText}>Discomfort</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pauseButton} onPress={pause}>
                  <Text style={styles.pauseButtonText}>⏸</Text>
                </TouchableOpacity>
              </View>
            )}
            {phase === 'paused' && (
              <View style={styles.pausedControls}>
                <TouchableOpacity style={[styles.mainButton, { backgroundColor: pillarConfig.color }]} onPress={resume}>
                  <Text style={styles.mainButtonText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.endButton} onPress={() => setPhase('complete')}>
                  <Text style={styles.endButtonText}>End Session</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,14,26,0.55)' },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  exitButton: { color: COLORS.textMuted, fontSize: 20, padding: SPACING.xs },
  sessionInfo: { flex: 1 },
  sessionPillar: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sessionTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  timerText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600', minWidth: 50, textAlign: 'right' },
  sessionProgress: { height: 3, backgroundColor: COLORS.bgElevated, overflow: 'hidden' },
  sessionProgressFill: { height: '100%' },
  patternBadge: { alignItems: 'center', paddingVertical: SPACING.md, gap: 4 },
  patternName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  patternTiming: { color: COLORS.textMuted, fontSize: 12 },
  circleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  readyCircle: { width: 240, height: 240, borderRadius: 120, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  readyText: { color: COLORS.textMuted, fontSize: 20, fontWeight: '300', letterSpacing: 2 },
  cycleCount: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginBottom: SPACING.sm },
  controls: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  mainButton: { borderRadius: 16, padding: 18, alignItems: 'center' },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  activeControls: { flexDirection: 'row', gap: SPACING.md },
  discomfortButton: { flex: 1, backgroundColor: COLORS.bgCard + 'CC', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  discomfortButtonText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  pauseButton: { backgroundColor: COLORS.bgCard + 'CC', borderRadius: 14, padding: 14, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  pauseButtonText: { fontSize: 18 },
  pausedControls: { gap: SPACING.md },
  endButton: { alignItems: 'center', padding: 12 },
  endButtonText: { color: COLORS.textMuted, fontSize: 14 },
  completeContainer: { padding: SPACING.lg, gap: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  completeTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  completeTime: { color: COLORS.primary, fontSize: 48, fontWeight: '700' },
  ratingLabel: { color: COLORS.textSecondary, fontSize: 15 },
  ratingRow: { flexDirection: 'row', gap: SPACING.md },
  ratingButton: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  ratingButtonSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  ratingEmoji: { fontSize: 28 },
  holdRecord: { color: COLORS.biochemistry, fontSize: 16, fontWeight: '600' },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, paddingHorizontal: 40, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
