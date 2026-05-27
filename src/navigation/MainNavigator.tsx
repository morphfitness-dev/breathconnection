import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import type { MainTabParamList, HomeStackParamList, ProgressStackParamList } from '../types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MorningCheckInScreen } from '../screens/home/MorningCheckInScreen';
import { ProgrammeScreen } from '../screens/home/ProgrammeScreen';
import { SessionPlayerScreen } from '../screens/session/SessionPlayerScreen';
import { SessionCompleteScreen } from '../screens/session/SessionCompleteScreen';
import { DashboardScreen } from '../screens/progress/DashboardScreen';
import { MetricEntryScreen } from '../screens/progress/MetricEntryScreen';
import { LeaderboardScreen } from '../screens/gamification/LeaderboardScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="MorningCheckIn" component={MorningCheckInScreen} />
      <HomeStack.Screen name="Programme" component={ProgrammeScreen} />
      <HomeStack.Screen name="SessionPlayer" component={SessionPlayerScreen} />
      <HomeStack.Screen name="SessionComplete" component={SessionCompleteScreen} />
    </HomeStack.Navigator>
  );
}

function ProgressStackNavigator() {
  return (
    <ProgressStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgressStack.Screen name="Dashboard" component={DashboardScreen} />
      <ProgressStack.Screen name="MetricEntry" component={MetricEntryScreen} />
      <ProgressStack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </ProgressStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🫁', Progress: '📊', Library: '📚', Profile: '👤' };
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[label] ?? '•'}</Text>;
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgCard,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 68,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Progress" component={ProgressStackNavigator} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
