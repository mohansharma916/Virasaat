import { authenticateWithBiometric } from '@/src/services/biometric';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { isAxiosError } from 'axios';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearSession, hydrateSession } from '@/src/store/session.slice';
import { clearVaultData } from '@/src/store/vault.slice';
import {
  getAccessToken,
  removeAccessToken,
  getBiometricUnlockEnabled,
} from '@/src/storage/auth.storage';
import { onSessionExpired } from '@/src/api/client';
import { clearTemporaryVaultExports } from '@/src/storage/vault-export.storage';
import { Button } from './Button';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const publicRoutes = new Set([
  '/',
  '/welcome',
  '/login',
  '/signup',
  '/verify',
  '/forgot-password',
  '/dev-screen',
]);

export function SessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.session.user?.id);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [validated, setValidated] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const authenticating = useRef(false);
  const contentOpened = useRef(false);
  const normalizedPath = pathname.replace(/^\/\(auth\)/, '') || '/';
  const isPublic = publicRoutes.has(pathname) || publicRoutes.has(normalizedPath);

  useEffect(() => {
    // Remove decrypted exports left by a force-closed sharing session.
    try { clearTemporaryVaultExports(); } catch { setError('Unable to clear temporary exports. Please restart the app.'); }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (authenticating.current) return;
      const active = state === 'active';
      setForeground(active);
      if (!active && userId) {
        setValidated(false);
        setNeedsUnlock(true);
      }
    });
    return () => subscription.remove();
  }, [userId]);

  useEffect(() => {
    if (!userId) contentOpened.current = false;
  }, [userId]);

  useEffect(
    () =>
      onSessionExpired(() => {
        setValidated(false);
        dispatch(clearSession());
        dispatch(clearVaultData());
        void removeAccessToken();
        router.replace('/(auth)/login');
      }),
    [dispatch],
  );

  useEffect(() => {
    if (isPublic || !foreground) return;
    let active = true;
    setError('');

    const validate = async () => {
      const token = await getAccessToken();
      if (!active) return;

      if (!token) {
        if (active) {
          dispatch(clearSession());
          dispatch(clearVaultData());
          router.replace('/(auth)/login');
        }
        return;
      }

      // Existing authenticated UI may be reused. Direct cold deep links must validate first.
      if (userId && !needsUnlock) {
        setValidated(true);
        return;
      }

      try {
        if (await getBiometricUnlockEnabled()) {
          authenticating.current = true;
          let result;
          try {
            result = await authenticateWithBiometric('Unlock your Virasat vault');
          } finally {
            authenticating.current = false;
          }
          if (!result.success) {
            if (active) setError('Unlock was not completed. Retry to continue.');
            return;
          }
        }

        if (!userId || needsUnlock) await dispatch(hydrateSession()).unwrap();
        if (active) {
          setNeedsUnlock(false);
          setValidated(true);
        }
      } catch (reason: any) {
        if (!active) return;

        const isUnauthorized =
          reason?.isUnauthorized === true ||
          reason?.status === 401 ||
          reason?.status === 403 ||
          (isAxiosError(reason) &&
            (reason.response?.status === 401 || reason.response?.status === 403)) ||
          (typeof reason?.message === 'string' &&
            (reason.message.includes('401') ||
              reason.message.includes('Unauthorized') ||
              reason.message.includes('expired')));

        if (isUnauthorized) {
          setValidated(false);
          dispatch(clearSession());
          dispatch(clearVaultData());
          await removeAccessToken();
          router.replace('/(auth)/login');
          return;
        }

        const isNet =
          reason?.isNetworkError || (isAxiosError(reason) && !reason.response);
        setError(
          isNet
            ? 'Unable to reach Virasat servers. Please check your internet connection.'
            : reason?.message || 'Unable to confirm your session. Check your connection and retry.',
        );
      }
    };

    void validate().catch(() => {
      if (active) setError('Unable to open secure storage. Please retry.');
    });

    return () => {
      active = false;
    };
  }, [isPublic, userId, dispatch, retry, foreground, needsUnlock]);

  if (isPublic) return children;
  const unlocked = validated && Boolean(userId) && foreground;
  if (unlocked) contentOpened.current = true;

  return (
    <View style={{ flex: 1 }}>
      {contentOpened.current && userId ? (
        <View style={{ flex: 1, opacity: unlocked ? 1 : 0 }} pointerEvents={unlocked ? 'auto' : 'none'}
          accessibilityElementsHidden={!unlocked} importantForAccessibility={unlocked ? 'auto' : 'no-hide-descendants'}>
          {children}
        </View>
      ) : null}
      {!unlocked && (
    <View style={styles.gateContainer}>
      {error ? (
        <View style={styles.errorBox}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={styles.errorHeading}>Unable to Verify Session</Text>
          <Text style={styles.errorBody} accessibilityRole="alert">
            {error}
          </Text>

          <View style={styles.actionRow}>
            <Button
              title="Retry Connection"
              onPress={() => setRetry((value) => value + 1)}
            />
            <Pressable
              style={styles.secondaryButton}
              onPress={async () => {
                await removeAccessToken();
                dispatch(clearSession());
                dispatch(clearVaultData());
                router.replace('/(auth)/login');
              }}
            >
              <Text style={styles.secondaryButtonText}>Return to Sign In</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary.forest} />
          <Text style={styles.loadingText}>Confirming your session…</Text>
        </View>
      )}
    </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gateContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    backgroundColor: colors.brand.ivory,
  },
  errorBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.semantic.warningSoft,
    borderWidth: 1,
    borderColor: colors.semantic.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontFamily: typography.fonts.inter.bold,
    fontSize: 20,
    color: colors.semantic.warning,
  },
  errorHeading: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.h3,
    color: colors.primary.deepForest,
    marginBottom: 6,
  },
  errorBody: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionRow: {
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.bodyMedium,
    color: colors.primary.forest,
    textDecorationLine: 'underline',
  },
  loadingBox: {
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.body,
    color: colors.neutral.textSecondary,
  },
});
