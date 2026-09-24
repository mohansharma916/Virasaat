import axios from 'axios';

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (axios.isAxiosError(error)) {
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
      return 'Unable to reach Virasat. Check the API URL and your connection.';
    }
  }

  return fallback;
}
