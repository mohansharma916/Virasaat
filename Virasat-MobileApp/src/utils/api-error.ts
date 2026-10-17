import { isAxiosError } from 'axios';

const DEFAULT_FALLBACK = 'Something went wrong. Please try again.';

/**
 * Checks if a string contains technical error details that should not be
 * displayed to users (e.g. raw AWS/S3 responses, internal storage keys,
 * database/crypto details, XML/HTML payloads, or server crash stack traces).
 */
export function isTechnicalErrorMessage(msg: string): boolean {
  if (!msg || typeof msg !== 'string') return false;

  // AWS S3 / Cloud storage XML or HTML responses
  if (/^\s*<(\?xml|!DOCTYPE|html|Error)/i.test(msg) || /<(?:Code|Message|Error|HostId|RequestId)[^>]*>/i.test(msg)) {
    return true;
  }

  // AWS / S3 references
  if (/\b(s3|aws|bucket|amazon s3|s3client|presigned)\b/i.test(msg)) {
    return true;
  }

  // S3 / AWS error codes & technical errors
  if (/\b(AccessDenied|NoSuchBucket|NoSuchKey|InvalidAccessKeyId|SignatureDoesNotMatch|RequestTimeTooSkewed|PermanentRedirect|InvalidBucketName|AllAccessDisabled|EntityTooLarge|Blob|MultipartUpload)\b/i.test(msg)) {
    return true;
  }

  // Internal storage keys, paths, or ciphertext references
  if (/vaults\/[a-z0-9_-]+\/items|\.bin\b|ciphertextRef|storageKey|ciphertexts?\b/i.test(msg)) {
    return true;
  }

  // Cryptography / database internals
  if (/\b(argon2|aes-256|aes-gcm|hmac|decryption failed|typeorm|postgres|sqlite)\b/i.test(msg)) {
    return true;
  }

  // Raw HTTP status messages from client/proxy
  if (/Request failed with status code (?:400|403|404|500|502|503|504)/i.test(msg)) {
    return true;
  }
  if (/\b(Bad Gateway|Gateway Timeout|Service Unavailable|Internal Server Error)\b/i.test(msg)) {
    return true;
  }
  if (/\b(ECONNRESET|ECONNREFUSED|ENOTFOUND)\b/i.test(msg)) {
    return true;
  }

  return false;
}

/**
 * Returns a user-centric message for technical / storage errors.
 */
function resolveTechnicalFallback(
  fallback: string,
  options?: { isUpload?: boolean; isDownload?: boolean },
): string {
  if (fallback && fallback !== DEFAULT_FALLBACK) {
    return fallback;
  }

  if (options?.isUpload) {
    return 'We were unable to upload your file. Please check your connection and try again.';
  }

  if (options?.isDownload) {
    return 'We were unable to download this file. Please try again in a few moments.';
  }

  return 'Vault storage is temporarily unavailable. Please try again in a few moments.';
}

export function getApiErrorMessage(
  error: unknown,
  fallback = DEFAULT_FALLBACK,
): string {
  if (!error) return fallback;

  if (isAxiosError(error)) {
    const isUpload = Boolean(
      error.config?.url?.includes('/upload') ||
      error.config?.data instanceof FormData,
    );
    const isDownload = Boolean(
      error.config?.url?.includes('/download') ||
      error.config?.responseType === 'arraybuffer' ||
      error.config?.responseType === 'blob',
    );

    // A rejected login/OTP has no app session to expire. Only authenticated
    // requests should replace the server's error with the session-expiry message.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      return 'Your session has expired. Sign in again to continue.';
    }

    // Payload too large
    if (error.response?.status === 413) {
      return 'The file is too large to upload. Please select a file up to 25 MB.';
    }

    // Bad Gateway / Service Unavailable (cloud storage or backend reboot)
    if (error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
      return resolveTechnicalFallback(fallback, { isUpload, isDownload });
    }

    if (error.code === 'ECONNABORTED') {
      return isUpload
        ? 'The upload timed out. Check your connection and try again.'
        : 'The request timed out. Check your connection and try again.';
    }

    if (!error.response) {
      return 'Unable to reach Virasat. Check your connection and try again.';
    }

    let candidateMessage: unknown = error.response.data?.message;

    // Handle array messages from validation
    if (Array.isArray(candidateMessage)) {
      candidateMessage = candidateMessage[0];
    }

    // Handle string data responses (e.g. S3 direct XML or proxy error)
    if (!candidateMessage && typeof error.response.data === 'string') {
      candidateMessage = error.response.data;
    }

    // Handle error.response.data.error
    if (!candidateMessage && typeof error.response.data?.error === 'string') {
      candidateMessage = error.response.data.error;
    }

    if (typeof candidateMessage === 'string' && candidateMessage.trim()) {
      if (isTechnicalErrorMessage(candidateMessage)) {
        return resolveTechnicalFallback(fallback, { isUpload, isDownload });
      }
      return candidateMessage;
    }

    // Fallback for Axios errors without clear user-facing messages
    return resolveTechnicalFallback(fallback, { isUpload, isDownload });
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as { isUnauthorized?: boolean; message?: unknown };
    if (err.isUnauthorized) {
      return 'Your session has expired. Sign in again to continue.';
    }
    if (typeof err.message === 'string' && err.message.trim()) {
      if (isTechnicalErrorMessage(err.message)) {
        const isUpload = /\bupload/i.test(err.message);
        const isDownload = /\bdownload/i.test(err.message);
        return resolveTechnicalFallback(fallback, { isUpload, isDownload });
      }
      return err.message;
    }
  }

  if (error instanceof Error && error.message) {
    if (isTechnicalErrorMessage(error.message)) {
      const isUpload = /\bupload/i.test(error.message);
      const isDownload = /\bdownload/i.test(error.message);
      return resolveTechnicalFallback(fallback, { isUpload, isDownload });
    }
    return error.message;
  }

  return fallback;
}
