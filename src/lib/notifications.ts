import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  // expo-notifications v56 types conflict with SDK 51's expo-modules-core PermissionResponse;
  // cast through unknown to access the granted field that exists at runtime.
  const perms = await Notifications.getPermissionsAsync() as unknown as { granted: boolean };
  let isGranted = perms.granted;
  if (!isGranted) {
    const result = await Notifications.requestPermissionsAsync() as unknown as { granted: boolean };
    isGranted = result.granted;
  }
  if (!isGranted) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || projectId.startsWith('REPLACE')) return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    return token;
  } catch {
    return null;
  }
}

export async function scheduleDailyReminder(hour = 8, minute = 0): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to breathe',
      body: 'Your daily session is ready. Even 3 minutes makes a difference.',
      data: { screen: 'Home' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
