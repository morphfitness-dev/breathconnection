import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainNavigator } from './MainNavigator';
import { useAppStore } from '../store/useAppStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['breathconnection://', 'http://localhost:8081'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              HomeScreen: 'home',
              SessionPlayer: 'session/:videoId',
              SessionComplete: 'session-complete',
              MorningCheckIn: 'morning-check-in',
              Programme: 'programme',
            },
          },
          Progress: {
            screens: {
              Dashboard: 'progress',
              MetricEntry: 'metric-entry',
              Leaderboard: 'leaderboard',
            },
          },
          Library: 'library',
          Profile: 'profile',
        },
      },
      Onboarding: 'onboarding',
    },
  },
};

export function AppNavigator() {
  const { user, hasCompletedOnboarding } = useAppStore();

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user || !hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
