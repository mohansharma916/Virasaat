import { configureStore } from '@reduxjs/toolkit';

import sessionReducer from './session.slice';
import vaultReducer from './vault.slice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    vault: vaultReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
