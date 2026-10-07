import { setItemAsync, getItemAsync, deleteItemAsync } from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token';
const BIOMETRIC_UNLOCK_ENABLED_KEY = 'biometric_unlock_enabled';

// Temporary web-development adapter. Native devices continue using SecureStore.
// If browser persistence is blocked, keep the session only for this page lifetime.
const browserSession = new Map<string, string>();
let browserStorageFailed = false;

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined' || browserStorageFailed) return null;
  try {
    return window.localStorage;
  } catch {
    browserStorageFailed = true;
    return null;
  }
}

async function writeValue(key: string, value: string) {
  if (Platform.OS !== 'web') return setItemAsync(key, value);
  if (typeof window === 'undefined') {
    throw new Error('Browser storage is not ready. Please try again in the app.');
  }
  browserSession.set(key, value);
  try {
    getBrowserStorage()?.setItem(key, value);
  } catch {
    browserStorageFailed = true;
  }
}

async function readValue(key: string): Promise<string | null> {
  if (Platform.OS !== 'web') return getItemAsync(key);
  // Do not share a server-rendered user's session with another request.
  if (typeof window === 'undefined') return null;
  try {
    const storage = getBrowserStorage();
    if (storage) {
      const value = storage.getItem(key);
      if (value === null) browserSession.delete(key);
      else browserSession.set(key, value);
      return value;
    }
  } catch {
    browserStorageFailed = true;
  }
  return browserSession.get(key) ?? null;
}

async function removeValue(key: string) {
  if (Platform.OS !== 'web') return deleteItemAsync(key);
  if (typeof window === 'undefined') return;
  browserSession.delete(key);
  try {
    getBrowserStorage()?.removeItem(key);
  } catch {
    // Never read a stale token back after a failed logout storage operation.
    browserStorageFailed = true;
  }
}

export const saveAccessToken = async (token: string) => {
  await writeValue(ACCESS_TOKEN_KEY, token);
};

export const getAccessToken = async () => {
  return readValue(ACCESS_TOKEN_KEY);
};

export const removeAccessToken = async () => {
  await removeValue(ACCESS_TOKEN_KEY);
};

export const saveBiometricUnlockEnabled = async (enabled: boolean) => {
  await writeValue(BIOMETRIC_UNLOCK_ENABLED_KEY, String(enabled));
};

export const getBiometricUnlockEnabled = async () => {
  const value = await readValue(BIOMETRIC_UNLOCK_ENABLED_KEY);
  return value === 'true';
};

const LAST_EMAIL_KEY = 'last_email';
const BIOMETRIC_SAVED_SESSION_KEY = 'biometric_saved_session';

export const saveLastEmail = async (email: string) => {
  await writeValue(LAST_EMAIL_KEY, email);
};

export const getLastEmail = async () => {
  return readValue(LAST_EMAIL_KEY);
};

export const saveBiometricSession = async (sessionData: { email: string; token: string; user?: any }) => {
  await writeValue(BIOMETRIC_SAVED_SESSION_KEY, JSON.stringify(sessionData));
  await saveBiometricUnlockEnabled(true);
};

export const getBiometricSession = async (): Promise<{ email: string; token: string; user?: any } | null> => {
  const data = await readValue(BIOMETRIC_SAVED_SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const clearBiometricSession = async () => {
  await removeValue(BIOMETRIC_SAVED_SESSION_KEY);
  await saveBiometricUnlockEnabled(false);
};
