import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RecipientNotificationMode } from '@/src/api/recipients.api';

// Contact details stay in memory between the form and the review screen
// screens instead of travelling in route params (URLs on web).
export type TrustedPersonDraft = {
  recipientId: string | null;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  verificationRequired: boolean;
  notificationMode: RecipientNotificationMode;
  fromOnboarding: boolean;
};

const trustedPersonDraftSlice = createSlice({
  name: 'trustedPersonDraft',
  initialState: null as TrustedPersonDraft | null,
  reducers: {
    setTrustedPersonDraft: (_state, action: PayloadAction<TrustedPersonDraft>) => action.payload,
    updateTrustedPersonDraft: (state, action: PayloadAction<Partial<TrustedPersonDraft>>) =>
      state ? { ...state, ...action.payload } : state,
    clearTrustedPersonDraft: () => null,
  },
});

export const { setTrustedPersonDraft, updateTrustedPersonDraft, clearTrustedPersonDraft } =
  trustedPersonDraftSlice.actions;
export default trustedPersonDraftSlice.reducer;
