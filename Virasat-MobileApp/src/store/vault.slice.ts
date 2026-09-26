import { isAxiosError } from 'axios';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  getCheckInStatus,
  type CheckInStatus,
} from '@/src/api/check-in.api';
import {
  listRecipients,
  type Recipient,
} from '@/src/api/recipients.api';
import {
  getReleasePolicy,
  type ReleasePolicy,
} from '@/src/api/release.api';
import {
  listLegacyItems,
  type LegacyItem,
} from '@/src/api/vault.api';

export type VaultState = {
  items: LegacyItem[];
  issues: string[];
  recipients: Recipient[];
  checkIn: CheckInStatus | null;
  releasePolicy: ReleasePolicy | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  requestId?: string;
};

const initialState: VaultState = {
  items: [],
  issues: [],
  recipients: [],
  checkIn: null,
  releasePolicy: null,
  status: 'idle',
};

export const refreshVaultData = createAsyncThunk(
  'vault/refresh',
  async () => {
    const [items, recipients, checkInResult, releasePolicyResult] =
      await Promise.allSettled([
        listLegacyItems(),
        listRecipients(),
        getCheckInStatus(),
        getReleasePolicy(),
      ]);

    if (
      items.status !== 'fulfilled' ||
      recipients.status !== 'fulfilled'
    ) {
      throw new Error('Unable to load vault data.');
    }

    const issues: string[] = [];
    for (const [label, result] of [['Check-in settings', checkInResult], ['Release policy', releasePolicyResult]] as const) {
      if (result.status === 'rejected' && !(isAxiosError(result.reason) && result.reason.response?.status === 404)) issues.push(`${label} could not be refreshed. Retry before changing settings.`);
    }
    return {
      issues,
      items: items.value,
      recipients: recipients.value,
      checkIn:
        checkInResult.status === 'fulfilled'
          ? checkInResult.value
          : null,
      releasePolicy:
        releasePolicyResult.status === 'fulfilled'
          ? releasePolicyResult.value
          : null,
    };
  },
);

const vaultSlice = createSlice({
  name: 'vault',
  initialState,
  reducers: {
    addLegacyItem(state, action: PayloadAction<LegacyItem>) {
      state.items = [action.payload, ...state.items.filter((item) => item.id !== action.payload.id)];
    },
    addRecipient(state, action: PayloadAction<Recipient>) {
      state.recipients = [action.payload, ...state.recipients.filter((person) => person.id !== action.payload.id)];
    },
    clearVaultData() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshVaultData.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.status = 'loading';
      })
      .addCase(refreshVaultData.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.issues = action.payload.issues;
        state.items = action.payload.items;
        state.recipients = action.payload.recipients;
        state.checkIn = action.payload.checkIn;
        state.releasePolicy = action.payload.releasePolicy;
        state.status = 'ready';
      })
      .addCase(refreshVaultData.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'error';
      });
  },
});

export const { addLegacyItem, addRecipient, clearVaultData } =
  vaultSlice.actions;
export default vaultSlice.reducer;
