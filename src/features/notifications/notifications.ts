import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Local notifications for retention — daily streak nudge + weekly re-scan.
 *
 * IMPORTANT: expo-notifications throws on import inside Expo Go (SDK 53+ removed
 * notifications there), so we NEVER import it at module scope. It is lazily
 * required only inside a real build, and in Expo Go we simply persist the
 * preference (real scheduling kicks in once you ship a dev/production build).
 */

const PREF_KEY = 'aurafy.reminders.v1';
const isExpoGo = Constants.executionEnvironment === 'storeClient';

function loadModule(): typeof import('expo-notifications') | null {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

async function ensureAndroidChannel(N: typeof import('expo-notifications')) {
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: N.AndroidImportance.DEFAULT,
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

  /** Request permission + schedule reminders. Returns whether it's "on". */
  async enable(): Promise<boolean> {
    // In Expo Go we can't schedule; just remember the choice so the toggle works.
    if (isExpoGo) {
      await AsyncStorage.setItem(PREF_KEY, 'true').catch(() => {});
      return true;
    }
    const N = loadModule();
    if (!N) {
      await AsyncStorage.setItem(PREF_KEY, 'true').catch(() => {});
      return true;
    }
    try {
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      const perm = await N.requestPermissionsAsync();
      if (!perm.granted) return false;

      await ensureAndroidChannel(N);
      await N.cancelAllScheduledNotificationsAsync();

      await N.scheduleNotificationAsync({
        content: {
          title: 'Keep your streak alive 🔥',
          body: 'A few minutes on your glow-up today keeps the momentum going.',
        },
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: 19, minute: 0 },
      });

      await N.scheduleNotificationAsync({
        content: {
          title: 'Time to re-scan 📸',
          body: 'Scan again to see how your aura score has climbed this week.',
        },
        trigger: { type: N.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 11, minute: 0 },
      });

      await AsyncStorage.setItem(PREF_KEY, 'true');
      return true;
    } catch {
      await AsyncStorage.setItem(PREF_KEY, 'true').catch(() => {});
      return true;
    }
  },

  async disable(): Promise<void> {
    await AsyncStorage.setItem(PREF_KEY, 'false').catch(() => {});
    const N = loadModule();
    if (!N) return;
    try {
      await N.cancelAllScheduledNotificationsAsync();
    } catch {
      /* ignore */
    }
  },
};
