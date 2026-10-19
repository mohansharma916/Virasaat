import { readFileSync } from 'node:fs';
import { GoogleAuth } from 'google-auth-library';

export interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

/**
 * Reads a Google service-account key from an env value that is either the
 * JSON itself, base64 of the JSON, or a path to the JSON file. Returns null
 * when unset or invalid, so features depending on it stay off.
 */
export function loadServiceAccount(value: string | undefined): ServiceAccountKey | null {
  const raw = value?.trim();
  if (!raw) return null;
  const candidates = [raw];
  try {
    candidates.push(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    /* not base64 */
  }
  try {
    candidates.push(readFileSync(raw, 'utf8'));
  } catch {
    /* not a path */
  }
  for (const text of candidates) {
    try {
      const key = JSON.parse(text) as ServiceAccountKey;
      if (key?.client_email && key?.private_key) return key;
    } catch {
      /* try the next form */
    }
  }
  return null;
}

/** An authenticated JSON client for one Google API scope. */
export class GoogleApiClient {
  private readonly auth: GoogleAuth;

  constructor(
    readonly key: ServiceAccountKey,
    scope: string,
  ) {
    this.auth = new GoogleAuth({
      credentials: { client_email: key.client_email, private_key: key.private_key },
      scopes: [scope],
    });
  }

  async request<T>(url: string, init: { method?: string; body?: unknown } = {}) {
    const client = await this.auth.getClient();
    const { token } = await client.getAccessToken();
    const response = await fetch(url, {
      method: init.method ?? 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : (undefined as T);
    return { status: response.status, ok: response.ok, data };
  }
}
