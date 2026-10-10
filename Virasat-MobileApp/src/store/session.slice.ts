import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  getCurrentUser,
  type AuthenticatedUser,
} from '@/src/api/auth.api';

import { isAxiosError } from 'axios';

type SessionState = {
  user: AuthenticatedUser | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  requestId?: string;
};

const initialState: SessionState = {
  user: null,
  status: 'idle',
};

export interface SessionErrorPayload {
  status?: number;
  message: string;
  isUnauthorized: boolean;
  isNetworkError: boolean;
}

export const hydrateSession = createAsyncThunk<
  AuthenticatedUser,
  void,
  { rejectValue: SessionErrorPayload }
>('session/hydrate', async (_, { rejectWithValue }) => {
  try {
    return await getCurrentUser();
  } catch (error: any) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const isUnauthorized = status === 401 || status === 403;
      const isNetworkError = !error.response || error.code === 'ECONNABORTED';
      const dataMsg = error.response?.data?.message;
      const serverMsg = Array.isArray(dataMsg)
        ? dataMsg[0]
        : typeof dataMsg === 'string'
        ? dataMsg
        : null;

      return rejectWithValue({
        status,
        message:
          serverMsg ||
          (isUnauthorized
            ? 'Your session has expired. Sign in again to continue.'
            : isNetworkError
            ? 'Unable to connect to Virasat. Please check your internet connection.'
            : error.message || 'Unable to verify session.'),
        isUnauthorized,
        isNetworkError,
      });
    }

    return rejectWithValue({
      status: 500,
      message: error?.message || 'Unable to confirm session.',
      isUnauthorized: false,
      isNetworkError: false,
    });
  }
});

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
      state.requestId = undefined;
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
