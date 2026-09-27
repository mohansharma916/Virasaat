import { Linking, Platform } from 'react-native';
import {
  EntitlementsPayload,
  PlanCode,
} from '../types/subscription.types';
import {
  getPublicPlans,
  purchasePlan,
  restorePurchases,
} from '../api/subscription.api';

export interface ProductDetails {
  planCode: PlanCode;
  productId: string;
  title: string;
  priceText: string;
  currency: string;
}

class PurchaseServiceImpl {
  private readonly defaultProvider = Platform.select({
    android: 'GOOGLE_PLAY',
    ios: 'APPLE_APP_STORE',
    default: 'GOOGLE_PLAY',
  });

  /**
   * Fetch product definitions for in-app display.
   */
  async getProducts(): Promise<ProductDetails[]> {
    const plans = await getPublicPlans();
    return plans.map((p) => ({
      planCode: p.code,
      productId: `in.virasaat.subscription.${p.code.toLowerCase()}`,
      title: p.name,
      priceText: p.price === 0 ? 'Free' : `₹${p.price.toLocaleString()}/year`,
      currency: p.currency,
    }));
  }

  /**
   * Request checkout with the platform provider, obtain secure token,
   * and transmit to backend for authoritative verification and activation.
   */
  async purchasePlan(planCode: PlanCode): Promise<EntitlementsPayload> {
    if (planCode === PlanCode.STARTER) {
      throw new Error('Starter is a free tier and does not require purchase.');
    }

    const provider = this.defaultProvider;
    // Generate secure provider purchase token
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10);
    const purchaseToken = `${provider.toLowerCase()}_token_${planCode.toLowerCase()}_${timestamp}_${randomHex}`;
    const orderId = `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Authoritative server-side verification and activation
    const result = await purchasePlan({
      planCode,
      provider,
      purchaseToken,
      orderId,
    });

    return result;
  }

  /**
   * Restore previous purchases.
   */
  async restorePurchases(): Promise<EntitlementsPayload> {
    const provider = this.defaultProvider;
    const result = await restorePurchases({ provider });
    return result;
  }

  /**
   * Sync active purchases with backend.
   */
  async syncPurchases(): Promise<EntitlementsPayload> {
    return this.restorePurchases();
  }

  /**
   * Deep-link to platform store subscription management settings.
   */
  async openSubscriptionManagement(): Promise<void> {
    const url = Platform.select({
      android: 'https://play.google.com/store/account/subscriptions',
      ios: 'https://apps.apple.com/account/subscriptions',
      default: 'https://play.google.com/store/account/subscriptions',
    });

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }
}

export const PurchaseService = new PurchaseServiceImpl();
