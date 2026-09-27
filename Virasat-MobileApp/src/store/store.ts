import { configureStore } from '@reduxjs/toolkit';

import sessionReducer from './session.slice';
import vaultReducer from './vault.slice';
import subscriptionReducer from './subscription.slice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    vault: vaultReducer,
    subscription: subscriptionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
