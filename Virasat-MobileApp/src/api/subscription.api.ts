import { api } from './client';
import {
  EntitlementsPayload,
  PlanCode,
  PlanComparisonItem,
} from '../types/subscription.types';

export async function getMySubscription(): Promise<EntitlementsPayload> {
  const response = await api.get<EntitlementsPayload>('/subscriptions/me');
  return response.data;
}

export async function getPublicPlans(): Promise<PlanComparisonItem[]> {
  const response = await api.get<PlanComparisonItem[]>('/subscriptions/plans');
  return response.data;
}

export async function purchasePlan(payload: {
  planCode: PlanCode;
  provider: string;
  purchaseToken: string;
  orderId?: string;
  subscriptionId?: string;
}): Promise<EntitlementsPayload> {
  const response = await api.post<EntitlementsPayload>(
    '/subscriptions/purchase',
    payload,
  );
  return response.data;
}

export async function restorePurchases(payload: {
  provider: string;
  purchaseToken?: string;
}): Promise<EntitlementsPayload> {
  const response = await api.post<EntitlementsPayload>(
    '/subscriptions/restore',
    payload,
  );
  return response.data;
}

export async function downgradePlan(
  planCode: PlanCode,
): Promise<EntitlementsPayload> {
  const response = await api.post<EntitlementsPayload>(
    '/subscriptions/downgrade',
    { planCode },
  );
  return response.data;
}
