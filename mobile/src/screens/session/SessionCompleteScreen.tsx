import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SessionComplete'>;
  route: RouteProp<HomeStackParamList, 'SessionComplete'>;
};

const CELEBRATION_LABELS: Record<string, { icon: string; title: string; color: string }> = {
  bolt_pr: { icon: '🏆', title: 'New BOLT Personal Record!', color: COLORS.biochemistry },
  hold_pr: { icon: '💪', title: 'New Breath Hold Record!', color: COLORS.biochemistry },
  coherence_7: { icon: '🔥', title: '7-Session Coherence Streak!', color: COLORS.neurophysiology },
  coherence_30: { icon: '⚡', title: '30 Coherence Sessions!', color: COLORS.neurophysiology },
  coherence_100: { icon: '👑', title: 'Optimizer Tier Unlocked!', color: COLORS.primary },
  bolt_15: { icon: '✨', title: 'BOLT 15 — Nasal Foundation Set', color: COLORS.biochemistry },
  bolt_25: { icon: '🌟', title: 'BOLT 25 — Kumbhaka Unlocked!', color: COLORS.biochemistry },
  bolt_35: { icon: '🚀', title: 'BOLT 35 — Elite CO₂ Tolerance', color: COLORS.biochemistry },
  stage_practitioner: { icon: '🎓', title: 'You\'re a Practitioner!', color: COLORS.primary },
  stage_optimizer: { icon: '⚙️', title: 'You\'ve reached Optimizer!', color: COLORS.primary },
};

export function SessionCompleteScreen({ navigation, route }: Props) {
  const { gamificationEvents, coherenceAchieved } = route.params;

  return (
    <LinearGradient colors={[COLORS.bg, '#0A1530']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Well done.</Text>
          <Text style={styles.subtitle}>Your nervous system thanks you.</Text>

          {coherenceAchieved && (
            <View style={[styles.coherenceCard, { borderColor: COLORS.neurophysiology + '55' }]}>
              <Text style={styles.coherenceIcon}>💚</Text>
              <Text style={[styles.coherenceTitle, { color: COLORS.neurophysiology }]}>HRV Coherence Achieved</Text>
              <Text style={styles.coherenceDesc}>Your HRV improved during this session — this counts toward your coherence streak.</Text>
            </View>
          )}

          {gamificationEvents.length > 0 && (
            <View style={styles.eventsContainer}>
              <Text style={styles.eventsTitle}>Milestones</Text>
              {gamificationEvents.map((evt, i) => {
                const celebration = CELEBRATION_LABELS[evt.type];
                if (!celebration) return null;
                return (
                  <View key={i} style={[styles.eventCard, { borderColor: celebration.color + '55', backgroundColor: celebration.color + '11' }]}>
                    <Text style={styles.eventIcon}>{celebration.icon}</Text>
                    <Text style={[styles.eventTitle, { color: celebration.color }]}>{celebration.title}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate('HomeScreen')}
            >
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl, paddingTop: SPACING.xxl },
  title: { color: COLORS.textPrimary, fontSize: 36, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 16 },
  coherenceCard: { borderWidth: 1, borderRadius: 16, padding: SPACING.lg, gap: SPACING.sm, alignItems: 'center', backgroundColor: COLORS.neurophysiology + '0A' },
  coherenceIcon: { fontSize: 36 },
  coherenceTitle: { fontSize: 18, fontWeight: '600' },
  coherenceDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  eventsContainer: { gap: SPACING.sm },
  eventsTitle: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: 14, padding: SPACING.md },
  eventIcon: { fontSize: 28 },
  eventTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  footer: { gap: SPACING.md, marginTop: SPACING.xl },
  homeButton: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center' },
  homeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
