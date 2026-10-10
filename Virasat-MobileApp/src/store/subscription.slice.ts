import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  EntitlementsPayload,
  Feature,
  PlanCode,
  PlanComparisonItem,
  PlanInfo,
  PlanLimit,
  SubscriptionInfo,
  SubscriptionStatus,
} from '../types/subscription.types';
import { getMySubscription, getPublicPlans } from '../api/subscription.api';
import { PurchaseService } from '../services/purchase.service';
import { useAppDispatch, useAppSelector } from './hooks';

export interface SubscriptionState {
  effectivePlanCode: PlanCode;
  purchaseVerification: EntitlementsPayload['purchaseVerification'];
  plan: PlanInfo | null;
  subscription: SubscriptionInfo | null;
  entitlements: Record<Feature, boolean>;
  limits: Record<PlanLimit, number | null>;
  availablePlans: PlanComparisonItem[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  requestId?: string;
}

const defaultEntitlements: Record<Feature, boolean> = {
  [Feature.CUSTOM_CHECK_IN]: false,
  [Feature.CUSTOM_GRACE_PERIOD]: false,
  [Feature.MULTIPLE_RECIPIENTS]: false,
  [Feature.RECIPIENT_VERIFICATION]: false,
  [Feature.ADVANCED_RELEASE_POLICY]: false,
  [Feature.MULTIPLE_VERIFIERS]: false,
  [Feature.ADVANCED_ESCALATION]: false,
  [Feature.FULL_ACTIVITY_HISTORY]: false,
  [Feature.PRIORITY_SUPPORT]: false,
  [Feature.FAMILY_EMERGENCY_INSTRUCTIONS]: false,
};

const defaultLimits: Record<PlanLimit, number | null> = {
  [PlanLimit.TRUSTED_PERSONS]: 1,
  [PlanLimit.PERSONAL_MESSAGES]: 3,
  [PlanLimit.VIDEO_MESSAGES]: 1,
  [PlanLimit.VAULT_ITEMS]: null,
};

const initialState: SubscriptionState = {
  effectivePlanCode: PlanCode.STARTER,
  purchaseVerification: 'NOT_REQUIRED',
  plan: null,
  subscription: null,
  entitlements: defaultEntitlements,
  limits: defaultLimits,
  availablePlans: [],
  status: 'idle',
  error: null,
};

export const fetchSubscription = createAsyncThunk(
  'subscription/fetch',
  async () => {
    return await getMySubscription();
  },
);

export const fetchPublicPlans = createAsyncThunk(
  'subscription/fetchPlans',
  async () => {
    return await getPublicPlans();
  },
);

export const executePurchase = createAsyncThunk(
  'subscription/purchase',
  async (planCode: PlanCode) => {
    return await PurchaseService.purchasePlan(planCode);
  },
);

export const executeRestore = createAsyncThunk(
  'subscription/restore',
  async () => {
    return await PurchaseService.restorePurchases();
  },
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionData(state, action: PayloadAction<EntitlementsPayload>) {
      state.effectivePlanCode = action.payload.effectivePlanCode ?? PlanCode.STARTER;
      state.purchaseVerification = action.payload.purchaseVerification ?? 'UNVERIFIED';
      state.plan = action.payload.plan;
      state.subscription = action.payload.subscription;
      state.entitlements = {
        ...defaultEntitlements,
        ...action.payload.entitlements,
      };
      state.limits = {
        ...defaultLimits,
        ...action.payload.limits,
      };
      state.status = 'ready';
      state.error = null;
    },
    clearSubscription(state) {
      state.requestId = undefined;
      state.effectivePlanCode = PlanCode.STARTER;
      state.purchaseVerification = 'NOT_REQUIRED';
      state.plan = null;
      state.subscription = null;
      state.entitlements = defaultEntitlements;
      state.limits = defaultLimits;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subscription
      .addCase(fetchSubscription.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.effectivePlanCode = action.payload.effectivePlanCode ?? PlanCode.STARTER;
      state.purchaseVerification = action.payload.purchaseVerification ?? 'UNVERIFIED';
      state.plan = action.payload.plan;
        state.subscription = action.payload.subscription;
        state.entitlements = {
          ...defaultEntitlements,
          ...action.payload.entitlements,
        };
        state.limits = {
          ...defaultLimits,
          ...action.payload.limits,
        };
        state.status = 'ready';
        state.error = null;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'error';
        state.error = action.error.message ?? 'Failed to load subscription';
      })

      // Fetch public plans
      .addCase(fetchPublicPlans.fulfilled, (state, action) => {
        state.availablePlans = action.payload;
      })

      // Execute purchase
      .addCase(executePurchase.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(executePurchase.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.effectivePlanCode = action.payload.effectivePlanCode ?? PlanCode.STARTER;
      state.purchaseVerification = action.payload.purchaseVerification ?? 'UNVERIFIED';
      state.plan = action.payload.plan;
        state.subscription = action.payload.subscription;
        state.entitlements = {
          ...defaultEntitlements,
          ...action.payload.entitlements,
        };
        state.limits = {
          ...defaultLimits,
          ...action.payload.limits,
        };
        state.status = 'ready';
        state.error = null;
      })
      .addCase(executePurchase.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'error';
        state.error = action.error.message ?? 'Purchase failed';
      })

      // Execute restore
      .addCase(executeRestore.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.status = 'loading';
      })
      .addCase(executeRestore.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.effectivePlanCode = action.payload.effectivePlanCode ?? PlanCode.STARTER;
      state.purchaseVerification = action.payload.purchaseVerification ?? 'UNVERIFIED';
      state.plan = action.payload.plan;
        state.subscription = action.payload.subscription;
        state.entitlements = {
          ...defaultEntitlements,
          ...action.payload.entitlements,
        };
        state.limits = {
          ...defaultLimits,
          ...action.payload.limits,
        };
        state.status = 'ready';
      })
      .addCase(executeRestore.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'error';
        state.error = action.error.message ?? 'Restore failed';
      });
  },
});

export const { setSubscriptionData, clearSubscription } =
  subscriptionSlice.actions;
export default subscriptionSlice.reducer;

/**
 * Clean reusable Hook to access subscription state and check entitlements.
 * Prevents scattering plan-tier strings across the app.
 */
export function useSubscription() {
  const dispatch = useAppDispatch();
  const subState = useAppSelector((state) => state.subscription);

  const canUseFeature = (feature: Feature): boolean => {
    return Boolean(subState.entitlements?.[feature]);
  };

  const getLimit = (limit: PlanLimit): number | null => {
    const val = subState.limits?.[limit];
    return val !== undefined ? val : null;
  };

  const isAtLimit = (limit: PlanLimit, currentValue: number): boolean => {
    const maxLimit = getLimit(limit);
    if (maxLimit === null) return false;
    return currentValue >= maxLimit;
  };

  const refreshSubscription = async () => {
    await dispatch(fetchSubscription()).unwrap();
  };

  const purchase = async (planCode: PlanCode) => {
    return await dispatch(executePurchase(planCode)).unwrap();
  };

  const restore = async () => {
    return await dispatch(executeRestore()).unwrap();
  };

  return {
    currentPlan: subState.plan,
    effectivePlanCode: subState.effectivePlanCode,
    purchaseVerification: subState.purchaseVerification,
    subscriptionStatus: subState.subscription?.status ?? SubscriptionStatus.ACTIVE,
    subscription: subState.subscription,
    entitlements: subState.entitlements,
    limits: subState.limits,
    availablePlans: subState.availablePlans,
    loading: subState.status === 'loading',
    error: subState.error,
    canUseFeature,
    getLimit,
    isAtLimit,
    refreshSubscription,
    purchasePlan: purchase,
    restorePurchases: restore,
  };
}
