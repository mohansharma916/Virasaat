import { Platform } from 'react-native';
import {
  deepLinkToSubscriptions,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from 'expo-iap';
import { EntitlementsPayload, PlanCode } from '../types/subscription.types';
import {
  getMySubscription,
  getPublicPlans,
  purchasePlan as confirmPurchase,
  restorePurchases as confirmRestore,
} from '../api/subscription.api';

export interface ProductDetails {
  planCode: PlanCode;
  productId: string | null;
  title: string;
  priceText: string;
  currency: string;
}

const RANK: Record<PlanCode, number> = { STARTER: 0, SECURE: 1, FAMILY: 2 };

/** Readable failures; the UI shows `message` as-is. */
export class PurchaseError extends Error {
  constructor(message: string, readonly cancelled = false) {
    super(message);
  }
}

/**
 * Google Play subscriptions. The device never decides what was bought: every
 * purchase token goes to the server, which checks it with Google before any
 * plan changes, and only then is the purchase acknowledged on the device.
 */
class PurchaseServiceImpl {
  private connected: Promise<boolean> | null = null;

  private connect() {
    if (Platform.OS !== 'android')
      throw new PurchaseError('Paid plans are available in the Android app. The iOS app is coming soon.');
    this.connected ??= initConnection().catch((error) => {
      this.connected = null;
      throw error;
    });
    return this.connected;
  }

  private async entitlements() {
    const payload = await getMySubscription();
    if (!payload.billingAvailable)
      throw new PurchaseError('Paid plans aren’t available right now. Please try again later.');
    return payload;
  }

  /** Server prices, with Google Play's localized price when available. */
  async getProducts(): Promise<ProductDetails[]> {
    const plans = await getPublicPlans();
    const payload = await getMySubscription().catch(() => null);
    const ids = payload?.playProductIds ?? {};
    const local = new Map<string, string>();
    if (Platform.OS === 'android' && payload?.billingAvailable) {
      try {
        await this.connect();
        const products = await fetchProducts({ skus: Object.values(ids).filter(Boolean) as string[], type: 'subs' });
        for (const product of products ?? []) local.set(product.id, product.displayPrice);
      } catch {
        /* Fall back to the server price. */
      }
    }
    return plans.map((plan) => {
      const productId = ids[plan.code] ?? null;
      return {
        planCode: plan.code,
        productId,
        title: plan.name,
        priceText:
          plan.price === 0
            ? 'Free'
            : `${(productId && local.get(productId)) || `₹${plan.price.toLocaleString('en-IN')}`}/year`,
        currency: plan.currency,
      };
    });
  }

  /** Buy or upgrade to a paid plan through Google Play. */
  async purchasePlan(planCode: PlanCode): Promise<EntitlementsPayload> {
    if (planCode === PlanCode.STARTER)
      throw new PurchaseError('Starter is free and does not need a purchase.');
    await this.connect();
    const payload = await this.entitlements();
    const productId = payload.playProductIds?.[planCode];
    if (!productId || !payload.playAccountRef)
      throw new PurchaseError('This plan isn’t available to buy yet.');

    const [product] = (await fetchProducts({ skus: [productId], type: 'subs' })) ?? [];
    if (!product) throw new PurchaseError('This plan isn’t available in Google Play yet.');
    const offerToken =
      'subscriptionOffers' in product
        ? product.subscriptionOffers?.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid
        : undefined;

    // Upgrading from Secure replaces that subscription; Play charges the difference.
    const current = await this.ownedSubscription(payload);
    const upgrade =
      current && RANK[current.planCode] > RANK.STARTER && current.productId !== productId ? current : null;
    if (current && RANK[current.planCode] >= RANK[planCode])
      throw new PurchaseError('You already have this plan or a higher one. Manage it in Google Play.');

    const purchase = await new Promise<Purchase>((resolve, reject) => {
      const updated = purchaseUpdatedListener((event) => {
        if (event.productId !== productId) return;
        updated.remove();
        failed.remove();
        resolve(event);
      });
      const failed = purchaseErrorListener((error) => {
        updated.remove();
        failed.remove();
        reject(
          isUserCancelledError(error)
            ? new PurchaseError('Purchase cancelled.', true)
            : new PurchaseError(error.message || 'Google Play couldn’t complete the purchase.'),
        );
      });
      requestPurchase({
        type: 'subs',
        request: {
          google: {
            skus: [productId],
            subscriptionOffers: offerToken ? [{ sku: productId, offerToken }] : undefined,
            obfuscatedAccountId: payload.playAccountRef,
            ...(upgrade
              ? {
                  purchaseToken: upgrade.token,
                  subscriptionProductReplacementParams: {
                    oldProductId: upgrade.productId,
                    replacementMode: 'charge-prorated-price',
                  },
                }
              : {}),
          },
        },
      }).catch((error: unknown) => {
        updated.remove();
        failed.remove();
        reject(error instanceof Error ? new PurchaseError(error.message) : error);
      });
    });

    if (purchase.purchaseState === 'pending')
      throw new PurchaseError('Your payment is pending. Your plan updates as soon as Google Play confirms it.');
    if (!purchase.purchaseToken) throw new PurchaseError('Google Play didn’t return a purchase. Try again.');
    const result = await confirmPurchase({ planCode, provider: 'GOOGLE_PLAY', purchaseToken: purchase.purchaseToken });
    await finishTransaction({ purchase, isConsumable: false }).catch(() => undefined);
    return result;
  }

  private async ownedSubscription(payload: EntitlementsPayload) {
    const ids = payload.playProductIds ?? {};
    const purchases = await getAvailablePurchases().catch(() => [] as Purchase[]);
    for (const code of [PlanCode.FAMILY, PlanCode.SECURE]) {
      const owned = purchases.find((p) => p.productId === ids[code] && p.purchaseToken);
      if (owned) return { planCode: code, productId: owned.productId, token: owned.purchaseToken! };
    }
    return null;
  }

  /**
   * Re-links Google Play subscriptions to this account (new phone, reinstall,
   * or a purchase interrupted before the server confirmed it).
   */
  async restorePurchases(): Promise<EntitlementsPayload> {
    if (Platform.OS !== 'android') return confirmRestore({ provider: 'GOOGLE_PLAY' });
    await this.connect();
    const payload = await this.entitlements();
    const ids = new Set(Object.values(payload.playProductIds ?? {}));
    const purchases = (await getAvailablePurchases()).filter(
      (p) => ids.has(p.productId) && p.purchaseToken && p.purchaseState === 'purchased',
    );
    let latest: EntitlementsPayload | null = null;
    for (const purchase of purchases) {
      latest = await confirmRestore({ provider: 'GOOGLE_PLAY', purchaseToken: purchase.purchaseToken! });
      await finishTransaction({ purchase, isConsumable: false }).catch(() => undefined);
    }
    return latest ?? confirmRestore({ provider: 'GOOGLE_PLAY' });
  }

  async syncPurchases(): Promise<EntitlementsPayload> {
    return this.restorePurchases();
  }

  /** Opens Google Play's subscription settings (cancel, change payment). */
  async openSubscriptionManagement(): Promise<void> {
    await deepLinkToSubscriptions({ packageNameAndroid: 'in.virasat.app' });
  }
}

export const PurchaseService = new PurchaseServiceImpl();
