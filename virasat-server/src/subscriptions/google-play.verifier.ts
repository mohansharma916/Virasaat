import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

import {
  GoogleApiClient,
  loadServiceAccount,
} from '../common/google-service-account';
import { PlanCode } from './subscription.constants';

/** Play Console subscription product id for each paid plan. */
export const PLAY_PRODUCT_IDS: Partial<Record<PlanCode, string>> = {
  [PlanCode.SECURE]: 'in.virasat.subscription.secure',
  [PlanCode.FAMILY]: 'in.virasat.subscription.family',
};

export function planForProduct(productId: string): PlanCode | null {
  const entry = Object.entries(PLAY_PRODUCT_IDS).find(([, id]) => id === productId);
  return (entry?.[0] as PlanCode) ?? null;
}

/**
 * The account id the app passes to Google Play when buying. Google returns it
 * with the purchase, so a token bought by one account can never be redeemed
 * by another. It is a one-way hash, never the raw user id.
 */
export function playAccountRef(userId: string) {
  return createHash('sha256').update(`virasat-play:${userId}`).digest('hex').slice(0, 64);
}

export function hashPurchaseToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/** Subset of androidpublisher v3 SubscriptionPurchaseV2. */
export interface PlaySubscription {
  subscriptionState?:
    | 'SUBSCRIPTION_STATE_UNSPECIFIED'
    | 'SUBSCRIPTION_STATE_PENDING'
    | 'SUBSCRIPTION_STATE_ACTIVE'
    | 'SUBSCRIPTION_STATE_PAUSED'
    | 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
    | 'SUBSCRIPTION_STATE_ON_HOLD'
    | 'SUBSCRIPTION_STATE_CANCELED'
    | 'SUBSCRIPTION_STATE_EXPIRED'
    | 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED';
  acknowledgementState?: 'ACKNOWLEDGEMENT_STATE_PENDING' | 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED';
  latestOrderId?: string;
  linkedPurchaseToken?: string;
  testPurchase?: object;
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
  lineItems?: {
    productId: string;
    expiryTime?: string;
    autoRenewingPlan?: { autoRenewEnabled?: boolean };
  }[];
}

/**
 * Verifies Google Play subscriptions server-side with the Play Developer API.
 * Configure GOOGLE_PLAY_SERVICE_ACCOUNT (JSON, base64 JSON, or a file path)
 * for a service account linked to the Play Console with "View financial
 * data" and "Manage orders and subscriptions" permissions.
 */
@Injectable()
export class GooglePlayVerifier {
  private readonly logger = new Logger(GooglePlayVerifier.name);
  private readonly client: GoogleApiClient | null;
  readonly packageName: string;

  constructor(config: ConfigService) {
    const key = loadServiceAccount(config.get<string>('GOOGLE_PLAY_SERVICE_ACCOUNT'));
    this.client = key
      ? new GoogleApiClient(key, 'https://www.googleapis.com/auth/androidpublisher')
      : null;
    this.packageName = config.get<string>('GOOGLE_PLAY_PACKAGE_NAME') || 'in.virasat.app';
    if (!this.client)
      this.logger.warn('GOOGLE_PLAY_SERVICE_ACCOUNT is not set; paid plans cannot be purchased.');
  }

  isConfigured() {
    return Boolean(this.client);
  }

  private base() {
    return `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(this.packageName)}/purchases`;
  }

  async getSubscription(purchaseToken: string): Promise<PlaySubscription | null> {
    if (!this.client) return null;
    const result = await this.client.request<PlaySubscription>(
      `${this.base()}/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    );
    if (result.status === 404 || result.status === 410 || result.status === 400) return null;
    if (!result.ok) throw new Error(`Google Play verification failed (${result.status}).`);
    return result.data;
  }

  async acknowledge(productId: string, purchaseToken: string) {
    if (!this.client) return;
    const result = await this.client.request(
      `${this.base()}/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
      { method: 'POST', body: {} },
    );
    // 400 is returned when it was already acknowledged.
    if (!result.ok && result.status !== 400)
      throw new Error(`Google Play acknowledgement failed (${result.status}).`);
  }
}
