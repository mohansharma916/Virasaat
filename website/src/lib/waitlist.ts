export interface WaitlistSignup {
  email: string;
  fullName: string;
  country: string;
  platform: string;
}

export interface WaitlistRegistration {
  email: string;
  fullName: string;
  platform: string;
  queueNumber: number;
}

export function getWaitlistEndpoint(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_WAITLIST_API_URL;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  return configured || (baseUrl ? `${baseUrl.replace(/\/$/, '')}/waitlist` : undefined);
}

/** A reservation exists only after a valid server acknowledgement. */
export async function submitWaitlist(
  signup: WaitlistSignup,
  endpoint = getWaitlistEndpoint(),
  fetchRequest: typeof fetch = fetch,
): Promise<WaitlistRegistration> {
  if (!endpoint) {
    throw new Error('Waitlist signup is temporarily unavailable. Please try again later.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const normalized = {
    email: signup.email.trim().toLowerCase(),
    fullName: signup.fullName.trim(),
    country: signup.country.trim(),
    platform: signup.platform.trim(),
  };

  try {
    const response = await fetchRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...normalized, source: 'modal_waitlist' }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Your signup could not be confirmed. Please try again.');
    }

    const data: unknown = await response.json();
    if (
      typeof data !== 'object' || data === null ||
      !('success' in data) || data.success !== true ||
      !('queueNumber' in data) || typeof data.queueNumber !== 'number' ||
      !Number.isSafeInteger(data.queueNumber) || data.queueNumber < 1
    ) {
      throw new Error('Your signup could not be confirmed. Please try again.');
    }

    return { ...normalized, queueNumber: data.queueNumber };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('The request timed out. Your signup is not yet confirmed; please retry.');
    }
    if (error instanceof Error && error.message.startsWith('Your signup')) throw error;
    throw new Error('We could not connect to the waitlist. Please check your connection and retry.');
  } finally {
    clearTimeout(timeout);
  }
}
