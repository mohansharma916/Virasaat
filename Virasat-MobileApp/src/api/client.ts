import { create, isAxiosError } from 'axios';
import { Platform } from 'react-native';
import { getAccessToken } from '../storage/auth.storage';

const defaultApiUrl = Platform.select({
  // Android emulators cannot resolve the development machine as localhost.
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const rawApiUrl = configuredApiUrl || defaultApiUrl;
const apiUrl =
  Platform.OS === 'android' && rawApiUrl
    ? rawApiUrl.replace(/:\/\/(localhost|127\.0\.0\.1)/, '://10.0.2.2')
    : rawApiUrl;

export const api = create({
  // Expo exposes only variables prefixed with EXPO_PUBLIC_ to the client.
  // Set this to the LAN or deployed API URL when running on a physical device.
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

api.interceptors.request.use(async (config) => {
  // If sending FormData, do not set application/json; let Axios/React Native/browser set multipart boundary
  if (
    config.data instanceof FormData ||
    (config.data && typeof (config.data as any).append === 'function')
  ) {
    if (config.headers) {
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }
  }

  const isAuthRequest =
    config.url?.startsWith('/auth/register') ||
    config.url?.startsWith('/auth/login') ||
    config.url?.startsWith('/auth/google') ||
    config.url?.startsWith('/auth/verify-email') ||
    config.url?.startsWith('/auth/resend-verification') ||
    config.url?.startsWith('/auth/forgot-password') ||
    config.url?.startsWith('/auth/reset-password') ||
    config.url?.startsWith('/auth/resend-password-reset');

  if (isAuthRequest) {
    return config;
  }

  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const expirationListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) {
  expirationListeners.add(listener);
  return () => { expirationListeners.delete(listener); };
}
api.interceptors.response.use((response) => response, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401 && error.config?.headers.Authorization) {
    for (const listener of expirationListeners) listener();
  }
  return Promise.reject(error);
});
