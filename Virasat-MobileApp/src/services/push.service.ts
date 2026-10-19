import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from '../api/client';

// Show reminders even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

async function deviceToken(): Promise<string | null> {
  // Android only for now; this throws when the build has no Firebase config.
  if (Platform.OS !== 'android') return null;
  try {
    const { data } = await Notifications.getDevicePushTokenAsync();
    return typeof data === 'string' ? data : null;
  } catch {
    return null;
  }
}

/**
 * Asks once for permission and registers this device for check-in reminders.
 * Safe to call on every app open; it never throws.
 */
export async function registerForReminders() {
  try {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Check-in reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;
    const token = await deviceToken();
    if (!token || token === registeredToken) return;
    await api.post('/me/push-tokens', { token, platform: Platform.OS });
    registeredToken = token;
  } catch {
    /* Reminders still arrive by email. */
  }
}

/** Stops notifications for this device; call before signing out. */
export async function unregisterFromReminders() {
  try {
    const token = registeredToken ?? (await deviceToken());
    if (token) await api.delete('/me/push-tokens', { data: { token } });
  } catch {
    /* The server drops stale tokens when Firebase rejects them. */
  } finally {
    registeredToken = null;
  }
}
