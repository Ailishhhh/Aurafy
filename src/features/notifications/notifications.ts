import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/**
 * Local notifications for retention — no push server needed.
 *
 *  - Daily streak nudge (evening): "Keep your glow-up streak alive."
 *  - Weekly re-scan reminder (Sunday): "Time to re-scan and see your progress."
 *
 * All scheduling is wrapped in try/catch: notifications are limited inside Expo
 * Go (Android), so failures must never break the app — they work fully in a
 * dev/production build.
 */

const PREF_KEY = 'aurafy.reminders.v1';

// Show notifications even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#7C5CFF',
    }).catch(() => {});
  }
}

export const reminders = {
  async isEnabled(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(PREF_KEY)) === 'true';
    } catch {
      return false;
    }
  },

  /** Request permission + schedule the recurring reminders. Returns success. */
  async enable(): Promise<boolean> {
    try {
      const perm = await Notifications.requestPermissionsAsync();
      if (!perm.granted) return false;

      await ensureAndroidChannel();
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Daily streak nudge at 7:00 PM.
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Keep your streak alive 🔥',
          body: 'A few minutes on your glow-up today keeps the momentum going.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
      });

      // Weekly re-scan reminder — Sundays at 11:00 AM (weekday 1 = Sunday).
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to re-scan 📸',
          body: 'Scan again to see how your aura score has climbed this week.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1,
          hour: 11,
          minute: 0,
        },
      });

      await AsyncStorage.setItem(PREF_KEY, 'true');
      return true;
    } catch {
      return false;
    }
  },

  async disable(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(PREF_KEY, 'false');
    } catch {
      /* ignore */
    }
  },
};
