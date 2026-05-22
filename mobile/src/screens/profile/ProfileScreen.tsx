import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { logMetric, connectWearable } from '../../api/client';

export function ProfileScreen() {
  const { user, logout } = useAppStore();
  const [showBPEntry, setShowBPEntry] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveBP() {
    const s = parseInt(systolic);
    const d = parseInt(diastolic);
    if (isNaN(s) || isNaN(d)) { Alert.alert('Invalid values'); return; }
    setSaving(true);
    try {
      const result = await logMetric({ type: 'blood_pressure', value: s, systolic: s, diastolic: d, source: 'manual' });
      if (result.bpWarning) {
        Alert.alert('Safety Note', result.bpWarning);
      }
      setShowBPEntry(false);
      setSystolic('');
      setDiastolic('');
    } catch {
      Alert.alert('Error', 'Could not save reading.');
    } finally { setSaving(false); }
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0A0E1A']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.screenTitle}>Profile</Text>

          {/* User Info */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name ?? 'Practitioner'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Manual Data Entry */}
          <Text style={styles.sectionTitle}>Log Manual Data</Text>

          {/* Blood Pressure */}
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setShowBPEntry(!showBPEntry)} style={styles.cardRow}>
              <View>
                <Text style={styles.cardTitle}>Blood Pressure</Text>
                <Text style={styles.cardDesc}>Enter a reading from your arm cuff monitor</Text>
              </View>
              <Text style={styles.cardChevron}>{showBPEntry ? '↑' : '↓'}</Text>
            </TouchableOpacity>

            {showBPEntry && (
              <View style={styles.bpEntry}>
                <Text style={styles.bpNote}>Always use a clinically validated arm cuff (Omron, Withings, A&D) for accuracy.</Text>
                <View style={styles.bpInputRow}>
                  <View style={styles.bpInputGroup}>
                    <Text style={styles.bpInputLabel}>Systolic</Text>
                    <TextInput
                      style={styles.bpInput}
                      value={systolic}
                      onChangeText={setSystolic}
                      keyboardType="number-pad"
                      placeholder="120"
                      placeholderTextColor={COLORS.textMuted}
                      maxLength={3}
                    />
                  </View>
                  <Text style={styles.bpSlash}>/</Text>
                  <View style={styles.bpInputGroup}>
                    <Text style={styles.bpInputLabel}>Diastolic</Text>
                    <TextInput
                      style={styles.bpInput}
                      value={diastolic}
                      onChangeText={setDiastolic}
                      keyboardType="number-pad"
                      placeholder="80"
                      placeholderTextColor={COLORS.textMuted}
                      maxLength={3}
                    />
                  </View>
                  <Text style={styles.bpUnit}>mmHg</Text>
                </View>
                <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={saveBP} disabled={saving}>
                  <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Reading'}</Text>
                </TouchableOpacity>
                <Text style={styles.bpDisclaimer}>If you have hypertension, share this data with your healthcare provider.</Text>
              </View>
            )}
          </View>

          {/* Wearable Settings */}
          <Text style={styles.sectionTitle}>Wearables</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connect Devices</Text>
            <Text style={styles.cardDesc}>
              Add Oura Ring, WHOOP, Muse, Tymewear, or other devices to enable the full biometric engine.
            </Text>
            <View style={styles.deviceGrid}>
              {[
                { key: 'oura', name: 'Oura Ring', color: COLORS.primary },
                { key: 'whoop', name: 'WHOOP', color: COLORS.neurophysiology },
                { key: 'apple_health', name: 'Apple Health', color: COLORS.biomechanics },
                { key: 'muse', name: 'Muse S', color: COLORS.biochemistry },
              ].map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.deviceChip, { borderColor: d.color + '55' }]}
                  onPress={() => connectWearable(d.key).catch(() => {})}
                >
                  <Text style={[styles.deviceName, { color: d.color }]}>{d.name}</Text>
                  <Text style={styles.deviceConnect}>Connect →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Phase 2 Teaser */}
          <View style={styles.phase2Card}>
            <Text style={styles.phase2Title}>Coming in Phase 2</Text>
            <Text style={styles.phase2Body}>
              In-session biometric adaptation · EEG brainwave feedback · Monthly Physiology Reports · Gamification engine with all 6 mechanics
            </Text>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: logout },
            ])}
          >
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  screenTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary + '33', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  userName: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '600' },
  userEmail: { color: COLORS.textMuted, fontSize: 13 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  cardDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 },
  cardChevron: { color: COLORS.textMuted, fontSize: 16 },
  bpEntry: { gap: SPACING.md },
  bpNote: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },
  bpInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.md },
  bpInputGroup: { gap: 4, flex: 1 },
  bpInputLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  bpInput: { backgroundColor: COLORS.bgElevated, borderRadius: 10, padding: 12, color: COLORS.textPrimary, fontSize: 20, fontWeight: '600', textAlign: 'center', borderWidth: 1, borderColor: COLORS.border },
  bpSlash: { color: COLORS.textMuted, fontSize: 24, paddingBottom: 8 },
  bpUnit: { color: COLORS.textMuted, fontSize: 12, paddingBottom: 12 },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  disabledButton: { opacity: 0.5 },
  bpDisclaimer: { color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },
  deviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  deviceChip: { backgroundColor: COLORS.bgElevated, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1 },
  deviceName: { fontSize: 13, fontWeight: '600' },
  deviceConnect: { color: COLORS.textMuted, fontSize: 11 },
  phase2Card: { backgroundColor: COLORS.primary + '0A', borderRadius: 16, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary + '22' },
  phase2Title: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  phase2Body: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  logoutButton: { borderWidth: 1, borderColor: COLORS.error + '44', borderRadius: 14, padding: 14, alignItems: 'center' },
  logoutText: { color: COLORS.error, fontSize: 15, fontWeight: '600' },
});
