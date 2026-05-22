import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { BOLTTestScreen } from '../screens/onboarding/BOLTTestScreen';
import { RRTestScreen } from '../screens/onboarding/RRTestScreen';
import { BreathingPatternScreen } from '../screens/onboarding/BreathingPatternScreen';
import { WearableConnectionScreen } from '../screens/onboarding/WearableConnectionScreen';
import { SymptomsScreen } from '../screens/onboarding/SymptomsScreen';
import { GoalsScreen } from '../screens/onboarding/GoalsScreen';
import { LifestyleScreen } from '../screens/onboarding/LifestyleScreen';
import { ProgrammeGenerationScreen } from '../screens/onboarding/ProgrammeGenerationScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="BOLTTest" component={BOLTTestScreen} />
      <Stack.Screen name="RRTest" component={RRTestScreen} />
      <Stack.Screen name="BreathingPattern" component={BreathingPatternScreen} />
      <Stack.Screen name="WearableConnection" component={WearableConnectionScreen} />
      <Stack.Screen name="Symptoms" component={SymptomsScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Lifestyle" component={LifestyleScreen} />
      <Stack.Screen name="ProgrammeGeneration" component={ProgrammeGenerationScreen} />
    </Stack.Navigator>
  );
}
