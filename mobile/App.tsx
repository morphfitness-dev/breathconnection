import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/lib/notifications';
import { useAppStore } from './src/store/useAppStore';

export default function App() {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const user = useAppStore(s => s.user);

  useEffect(() => {
    // Register once the user is logged in
    if (user) {
      registerForPushNotifications().catch(() => {});
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // foreground notification received — no-op for now
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(_response => {
      // user tapped a notification — could navigate based on response.notification.request.content.data
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
