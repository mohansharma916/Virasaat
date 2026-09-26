import { authenticateWithBiometric } from '@/src/services/biometric';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { router, usePathname } from 'expo-router';
import { isAxiosError } from 'axios';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearSession, hydrateSession } from '@/src/store/session.slice';
import { clearVaultData } from '@/src/store/vault.slice';
import { getAccessToken, removeAccessToken, getBiometricUnlockEnabled } from '@/src/storage/auth.storage';
import { onSessionExpired } from '@/src/api/client';
import { Button } from './Button';
import { colors } from '@/src/theme/colors';

const publicRoutes = new Set(['/', '/welcome', '/login', '/signup', '/verify']);

export function SessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.session.user?.id);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [validated, setValidated] = useState(false);
  const isPublic = publicRoutes.has(pathname);
  useEffect(() => onSessionExpired(() => {
    setValidated(false);
    dispatch(clearSession()); dispatch(clearVaultData());
    void removeAccessToken();
    router.replace('/(auth)/login');
  }), [dispatch]);
  useEffect(() => {
    if (isPublic) return;
    let active = true;
    setError('');
    const validate = async () => {
      const token = await getAccessToken();
      if (!active) return;
      if (!token) {
        if (active) { dispatch(clearSession()); dispatch(clearVaultData()); router.replace('/(auth)/login'); }
        return;
      }
      // Existing authenticated UI may be reused. Direct cold deep links must validate first.
      if (userId) { setValidated(true); return; }
      try {
        if (await getBiometricUnlockEnabled()) {
          const result = await authenticateWithBiometric();
          if (!result.success) { if (active) setError('Unlock was not completed. Retry to continue.'); return; }
        }
        await dispatch(hydrateSession()).unwrap();
        if (active) setValidated(true);
      } catch (reason) {
        if (!active) return;
        if (isAxiosError(reason) && reason.response?.status === 401) router.replace('/(auth)/login');
        else setError('Unable to confirm your session. Check your connection and retry.');
      }
    };
    void validate().catch(() => { if (active) setError('Unable to open secure storage. Please retry.'); });
    return () => { active = false; };
  }, [isPublic, userId, dispatch, retry]);
  if (isPublic || (validated && userId)) return children;
  return <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 20, backgroundColor: colors.brand.ivory }}>
    {error ? <><Text accessibilityRole="alert">{error}</Text><Button title="Retry" onPress={() => setRetry((value) => value + 1)} /></> : <><ActivityIndicator /><Text>Confirming your session…</Text></>}
  </View>;
}
