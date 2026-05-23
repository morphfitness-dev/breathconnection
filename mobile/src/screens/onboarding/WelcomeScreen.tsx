import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { register, login, getAssessment } from '../../api/client';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'> };

export function WelcomeScreen({ navigation }: Props) {
  const setUser = useAppStore(s => s.setUser);
  const setHasCompletedOnboarding = useAppStore(s => s.setHasCompletedOnboarding);
  const [mode, setMode] = useState<'landing' | 'login' | 'register'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) { Alert.alert('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const data = await register(email, password, name || undefined);
      setUser({ id: data.userId, email: data.email, name: data.name, token: data.token });
      navigation.navigate('BOLTTest');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? 'Registration failed');
    } finally { setLoading(false); }
  }

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const data = await login(email, password);
      setUser({ id: data.userId, email: data.email, name: data.name, token: data.token });
      // Check if this user already completed onboarding on another device
      try {
        await getAssessment();
        setHasCompletedOnboarding(true);
        // AppNavigator will switch to Main automatically
      } catch {
        // No existing assessment — go through onboarding
        navigation.navigate('BOLTTest');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? 'Login failed');
    } finally { setLoading(false); }
  }

  if (mode === 'landing') {
    return (
      <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <ScrollView contentContainerStyle={styles.landing}>
            <View style={styles.hero}>
              <Text style={styles.appName}>THE BREATH{'\n'}CONNECTION</Text>
              <Text style={styles.tagline}>Physiology-first breathwork.</Text>
              <Text style={styles.subtitle}>
                The only breathwork app organised by mechanism — Biomechanics, Biochemistry, and Neurophysiology — with a closed-loop biometric engine that adapts to your body every day.
              </Text>
            </View>

            <View style={styles.pillars}>
              {[
                { label: 'Biomechanics', sub: 'How You Breathe', color: COLORS.biomechanics },
                { label: 'Biochemistry', sub: 'What Your Breath Does', color: COLORS.biochemistry },
                { label: 'Neurophysiology', sub: 'Your Nervous System', color: COLORS.neurophysiology },
              ].map(p => (
                <View key={p.label} style={[styles.pillarChip, { borderColor: p.color + '55' }]}>
                  <Text style={[styles.pillarChipLabel, { color: p.color }]}>{p.label}</Text>
                  <Text style={styles.pillarChipSub}>{p.sub}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setMode('register')}>
                <Text style={styles.primaryButtonText}>Start Your Assessment →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={styles.link}>Already have an account? Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.bg, '#0D1535']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <TouchableOpacity onPress={() => setMode('landing')} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>{mode === 'register' ? 'Create Account' : 'Sign In'}</Text>

          {mode === 'register' && (
            <TextInput
              style={styles.input}
              placeholder="Your name (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 8 characters)"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={mode === 'register' ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
            <Text style={styles.link}>
              {mode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  landing: { padding: SPACING.lg, gap: SPACING.xl, paddingTop: SPACING.xxl },
  hero: { gap: SPACING.md },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 2,
    lineHeight: 44,
  },
  tagline: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  pillars: { gap: SPACING.sm },
  pillarChip: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
  },
  pillarChipLabel: { fontSize: 15, fontWeight: '600' },
  pillarChipSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  actions: { gap: SPACING.md, paddingBottom: SPACING.xxl },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  link: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 14 },
  formContainer: { padding: SPACING.lg, gap: SPACING.md, paddingTop: SPACING.xl },
  back: { marginBottom: SPACING.sm },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  formTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '700', marginBottom: SPACING.md },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
