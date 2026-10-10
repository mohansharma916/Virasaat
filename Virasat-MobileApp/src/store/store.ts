import { combineReducers, configureStore } from '@reduxjs/toolkit';

import sessionReducer, { clearSession, setSessionUser } from './session.slice';
import vaultReducer from './vault.slice';
import subscriptionReducer from './subscription.slice';

const appReducer = combineReducers({
  session: sessionReducer,
  vault: vaultReducer,
  subscription: subscriptionReducer,
});

export const store = configureStore({
  reducer: (state: ReturnType<typeof appReducer> | undefined, action) => {
    const switchedAccount = setSessionUser.match(action) && state?.session.user?.id
      && state.session.user.id !== action.payload.id;
    // One cleanup boundary invalidates every account-scoped cache and request ID.
    return appReducer(clearSession.match(action) || switchedAccount ? undefined : state, action);
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
