import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  getCurrentUser,
  type AuthenticatedUser,
} from '@/src/api/auth.api';

type SessionState = {
  user: AuthenticatedUser | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  requestId?: string;
};

const initialState: SessionState = {
  user: null,
  status: 'idle',
};

export const hydrateSession = createAsyncThunk(
  'session/hydrate',
  getCurrentUser,
);

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSessionUser(
      state,
      action: PayloadAction<AuthenticatedUser>,
    ) {
      state.user = action.payload;
      state.status = 'ready';
    },
    clearSession(state) {
      state.requestId = undefined;
      state.user = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateSession.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.status = 'loading';
      })
      .addCase(hydrateSession.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.user = action.payload;
        state.status = 'ready';
      })
      .addCase(hydrateSession.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'error';
      });
  },
});

export const { clearSession, setSessionUser } = sessionSlice.actions;
export default sessionSlice.reducer;
