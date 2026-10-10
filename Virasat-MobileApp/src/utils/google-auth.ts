import { Alert } from 'react-native';

type GoogleSigninType = typeof import('@react-native-google-signin/google-signin').GoogleSignin;
type StatusCodesType = typeof import('@react-native-google-signin/google-signin').statusCodes;

let cachedGoogleSignin: GoogleSigninType | null = null;
let cachedStatusCodes: StatusCodesType | null = null;
let isConfigured = false;

/**
 * Safely resolves the native GoogleSignin module without throwing Invariant Violation
 * when running inside environments without the native binary linked (e.g. Expo Go, Web).
 */
function getGoogleSigninModule(): {
  GoogleSignin: GoogleSigninType | null;
  statusCodes: StatusCodesType | null;
} {
  if (cachedGoogleSignin && cachedStatusCodes) {
    return {
      GoogleSignin: cachedGoogleSignin,
      statusCodes: cachedStatusCodes,
    };
  }

  try {
    // Dynamic require avoids evaluating the TurboModule at bundle load time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const googleModule = require('@react-native-google-signin/google-signin');
    if (googleModule?.GoogleSignin) {
      cachedGoogleSignin = googleModule.GoogleSignin;
      cachedStatusCodes = googleModule.statusCodes;
      return {
        GoogleSignin: cachedGoogleSignin,
        statusCodes: cachedStatusCodes,
      };
    }
  } catch {
    // Running in Expo Go, Web, or native module not compiled into current binary
    console.warn(
      '[GoogleAuth] Native RNGoogleSignin module is not available in this environment (e.g. Expo Go).',
    );
  }

  return { GoogleSignin: null, statusCodes: null };
}

/**
 * Returns true if native Google Sign-In is supported in the current binary.
 */
export function isGoogleSigninAvailable(): boolean {
  const { GoogleSignin } = getGoogleSigninModule();
  return GoogleSignin != null;
}

/**
 * Lazily configures GoogleSignin once the native module is confirmed available.
 */
function ensureConfigured(GoogleSignin: GoogleSigninType): boolean {
  if (isConfigured) return true;

  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '699341673834-mqvqtg2smi7lbg62ptvcqdhr71v5u039.apps.googleusercontent.com';

  try {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
    isConfigured = true;
    return true;
  } catch (err) {
    console.warn('[GoogleAuth] Failed to configure GoogleSignin:', err);
    return false;
  }
}

/**
 * Initiates the Google Sign-In flow.
 * In a native development build, prompts the Google OAuth sheet and returns the idToken.
 * In Expo Go, alerts the user that native Google Sign-In requires a dev build and returns null.
 */
export async function signInWithGoogle(): Promise<string | null> {
  const { GoogleSignin, statusCodes } = getGoogleSigninModule();

  if (!GoogleSignin) {
    Alert.alert(
      'Google Sign-In Unavailable',
      __DEV__
        ? 'Google Sign-In uses native binaries that are not included in the standard Expo Go client.\n\nTo use Google Sign-In, please create a development build:\n  npx expo run:android  (or run:ios)\n\nFor now, you can continue by logging in with your Email and Password.'
        : 'Google Sign-In is temporarily unavailable on this device. Please continue by signing in with your email and password.',
      [{ text: 'OK' }],
    );
    return null;
  }

  try {
    ensureConfigured(GoogleSignin);

    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const response = await GoogleSignin.signIn();

    if (response.type !== 'success') {
      return null;
    }

    return response.data?.idToken ?? null;
  } catch (error: any) {
    if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }

    throw error;
  }
}