import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, WearableType } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { connectWearable } from '../../api/client';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'WearableConnection'> };

const HRV_WEARABLES = [
  {
    key: 'oura' as WearableType,
    name: 'Oura Ring Gen 4',
    subtitle: 'FEATURED — Most accurate HRV',
    description: 'Best-in-class HRV validated against ECG. Passive overnight collection.',
    price: '$349 + $5.99/mo',
    badge: 'Primary',
    badgeColor: COLORS.primary,
  },
  {
    key: 'whoop' as WearableType,
    name: 'WHOOP 5.0',
    subtitle: 'Athlete segment',
    description: '0.99 ICC for HRV. Screenless — no distraction during practice.',
    price: '$239 + $30/mo',
    badge: 'Secondary',
    badgeColor: COLORS.neurophysiology,
  },
  {
    key: 'apple_health' as WearableType,
    name: 'Apple Health',
    subtitle: 'If you have an Apple Watch',
    description: 'Connect your existing Apple Watch data.',
    price: 'Free',
    badge: 'Fallback',
    badgeColor: COLORS.textMuted,
  },
  {
    key: 'google_health' as WearableType,
    name: 'Google Health Connect',
    subtitle: 'Android devices',
    description: 'Connect existing Android wearable data.',
    price: 'Free',
    badge: 'Fallback',
    badgeColor: COLORS.textMuted,
  },
];

export function WearableConnectionScreen({ navigation }: Props) {
  const updateAssessment = useAppStore(s => s.updateAssessment);
  const [connecting, setConnecting] = useState<WearableType | null>(null);
  const [connected, setConnected] = useState<WearableType | null>(null);
  const [showEEG, setShowEEG] = useState(false);

  async function handleConnect(deviceType: WearableType) {
    setConnecting(deviceType);
    try {
      await connectWearable(deviceType);
      setConnected(deviceType);
      updateAssessment({ connectedWearable: deviceType });
      if (!showEEG) setShowEEG(true);
    } catch {
      Alert.alert('Connection failed', 'Could not connect device. You can connect it later in Settings.');
    } finally {
      setConnecting(null);
    }
  }

  function skip() {
    navigation.navigate('Symptoms');
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.progress}>
            <Text style={styles.step}>STEP 4 OF 8</Text>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: '50%' }]} /></View>
          </View>

          <Text style={styles.title}>Connect Your Wearable</Text>
          <Text style={styles.subtitle}>
            Wearable data transforms your programme from a plan into a physiological coaching system.
          </Text>

          <View style={styles.dataBox}>
            <Text style={styles.dataBoxTitle}>What your wearable unlocks:</Text>
            {[
              '• Daily Nervous System Score (0–100)',
              '• Session intensity calibrated to your readiness',
              '• HRV Coherence Streaks (quality-validated)',
              '• Pre-session adaptation — lighter on hard days',
            ].map((t, i) => <Text key={i} style={styles.dataPoint}>{t}</Text>)}
          </View>

          {!connected ? (
            <>
              <Text style={styles.sectionTitle}>HRV Wearables</Text>
              {HRV_WEARABLES.map(w => (
                <TouchableOpacity
                  key={w.key}
                  style={styles.wearableCard}
                  onPress={() => handleConnect(w.key)}
                  disabled={connecting !== null}
                >
                  <View style={styles.wearableHeader}>
                    <View>
                      <Text style={styles.wearableName}>{w.name}</Text>
                      <Text style={styles.wearableSubtitle}>{w.subtitle}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: w.badgeColor + '22', borderColor: w.badgeColor + '55' }]}>
                      <Text style={[styles.badgeText, { color: w.badgeColor }]}>{w.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.wearableDesc}>{w.description}</Text>
                  <View style={styles.wearableFooter}>
                    <Text style={styles.wearablePrice}>{w.price}</Text>
                    <View style={[styles.connectButton, connecting === w.key && styles.disabledButton]}>
                      <Text style={styles.connectButtonText}>
                        {connecting === w.key ? 'Connecting…' : 'Connect →'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.connectedCard}>
              <Text style={styles.connectedIcon}>✓</Text>
              <Text style={styles.connectedTitle}>Connected!</Text>
              <Text style={styles.connectedDesc}>
                {HRV_WEARABLES.find(w => w.key === connected)?.name ?? connected} is now connected.
                Your programme will use real HRV data.
              </Text>
            </View>
          )}

          {showEEG && (
            <View style={styles.eegSection}>
              <Text style={styles.sectionTitle}>EEG Headband (Optional)</Text>
              <Text style={styles.sectionSubtitle}>For real-time brainwave biofeedback during sessions (Phase 2 feature)</Text>
              {['muse', 'flowtime'].map(d => (
                <TouchableOpacity key={d} style={styles.wearableCard} onPress={() => handleConnect(d as WearableType)}>
                  <Text style={styles.wearableName}>{d === 'muse' ? 'Muse S Athena' : 'Flowtime Headband'}</Text>
                  <Text style={styles.wearableDesc}>{d === 'muse' ? 'Market-leading consumer EEG. $399.' : 'Mid-range EEG + HRV. ~$199.'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.continueButton} onPress={skip}>
              <Text style={styles.continueButtonText}>{connected ? 'Continue →' : 'Skip for now →'}</Text>
            </TouchableOpacity>
            <Text style={styles.privacyNote}>
              Your biometric data is stored securely and never shared. GDPR/HIPAA compliant.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  progress: { gap: SPACING.xs },
  step: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  progressBar: { height: 3, backgroundColor: COLORS.bgElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.neurophysiology, borderRadius: 2 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22 },
  dataBox: { backgroundColor: COLORS.primary + '11', borderRadius: 14, padding: SPACING.md, gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.primary + '33' },
  dataBoxTitle: { color: COLORS.primary, fontSize: 13, fontWeight: '600', marginBottom: SPACING.xs },
  dataPoint: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  sectionSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: -SPACING.sm },
  wearableCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  wearableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wearableName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  wearableSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  wearableDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  wearableFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wearablePrice: { color: COLORS.textMuted, fontSize: 12 },
  connectButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  connectButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
  connectedCard: { backgroundColor: COLORS.success + '11', borderRadius: 16, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.success + '44' },
  connectedIcon: { fontSize: 40 },
  connectedTitle: { color: COLORS.success, fontSize: 22, fontWeight: '700' },
  connectedDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  eegSection: { gap: SPACING.sm },
  footer: { gap: SPACING.md },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  privacyNote: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
