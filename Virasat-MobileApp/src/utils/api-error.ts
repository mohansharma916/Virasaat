import { isAxiosError } from 'axios';

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (!error) return fallback;

  if (isAxiosError(error)) {
    // A rejected login/OTP has no app session to expire. Only authenticated
    // requests should replace the server's error with the session-expiry message.
    if (error.response?.status === 401 && error.config?.headers.Authorization) {
      return 'Your session has expired. Sign in again to continue.';
    }
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message[0] ?? fallback;
    }

    if (typeof message === 'string') {
      return message;
    }

    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Check your connection and try again.';
    }

    if (!error.response) {
      return 'Unable to reach Virasat. Check your connection and try again.';
    }
    return fallback;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as { isUnauthorized?: boolean; message?: unknown };
    if (err.isUnauthorized) {
      return 'Your session has expired. Sign in again to continue.';
    }
    if (typeof err.message === 'string' && err.message) return err.message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
