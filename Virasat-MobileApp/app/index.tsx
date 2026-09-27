import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';
import { Button } from '@/src/components/Button';
import { router } from 'expo-router';

import {
  getAccessToken,
  getBiometricUnlockEnabled,
  removeAccessToken,
} from '@/src/storage/auth.storage';
import { authenticateWithBiometric } from '@/src/services/biometric';
import { useAppDispatch } from '@/src/store/hooks';
import { clearSession, hydrateSession } from '@/src/store/session.slice';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function SplashScreen() {
  const dispatch = useAppDispatch();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.timing(logoScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(subtitleOpacity, {
      toValue: 1,
      duration: 600,
      delay: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    let active = true;

    const initializeSession = async () => {
      const token = await getAccessToken();

      if (!token) {
        return '/(auth)/welcome';
      }

      if (await getBiometricUnlockEnabled()) {
        const result = await authenticateWithBiometric();

        if (!result.success) {
          return '/(auth)/welcome';
        }
      }

      try {
        await dispatch(hydrateSession()).unwrap();
        return '/(auth)/home';
      } catch (reason: any) {
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
          await removeAccessToken();
          dispatch(clearSession());
          return '/(auth)/welcome';
        }

        if (active) {
          const isNet =
            reason?.isNetworkError ||
            (isAxiosError(reason) && !reason.response);
          setError(
            isNet
              ? 'Unable to reach Virasat servers. Please check your internet connection.'
              : reason?.message || 'Unable to confirm your session. Please retry.'
          );
        }
        return null;
      }
    };

    const timer = setTimeout(async () => {
      const destination = await initializeSession();

      if (active && destination) {
        router.replace(destination as never);
      }
    }, 1200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [dispatch, logoOpacity, logoScale, subtitleOpacity, retry]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Text style={styles.monogram}>V</Text>

        <Text style={styles.logo}>VIRASAT</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.subtitleContainer,
          {
            opacity: subtitleOpacity,
          },
        ]}
      >
        <Text style={styles.subtitle}>Your Digital Legacy</Text>

        <Text style={styles.subtitleStrong}>Secured.</Text>
      </Animated.View>

      {error ? (
        <View style={styles.errorCard}>
          <View style={styles.errorIconCircle}>
            <Text style={styles.errorIcon}>!</Text>
          </View>
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorMessage} accessibilityRole="alert">
            {error}
          </Text>

          <View style={styles.errorActions}>
            <Button
              title="Retry Connection"
              onPress={() => {
                setError('');
                setRetry((val) => val + 1);
              }}
            />
            <Pressable
              style={styles.switchAccountButton}
              onPress={async () => {
                await removeAccessToken();
                dispatch(clearSession());
                router.replace('/(auth)/welcome' as never);
              }}
            >
              <Text style={styles.switchAccountText}>
                Sign in with another account
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.bottomContainer}>
          <Text style={styles.loadingText}>Preparing your vault</Text>

          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotMiddle]} />
            <View style={styles.dot} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  brandContainer: {
    alignItems: 'center',
  },

  monogram: {
    fontFamily: typography.fonts.display,
    fontSize: 64,
    lineHeight: 72,
    color: colors.primary.deepForest,
  },

  logo: {
    marginTop: 4,
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.logo,
    letterSpacing: 4,
    color: colors.primary.deepForest,
  },

  subtitleContainer: {
    marginTop: 28,
    alignItems: 'center',
  },

  subtitle: {
    fontFamily: typography.fonts.ui,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.regular,
    color: colors.neutral.textSecondary,
  },

  subtitleStrong: {
    marginTop: 3,
    fontFamily: typography.fonts.display,
    fontSize: 19,
    color: colors.primary.forest,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 54,
    alignItems: 'center',
  },

  loadingText: {
    fontFamily: typography.fonts.ui,
    fontSize: typography.sizes.caption,
    color: colors.neutral.textMuted,
  },

  dots: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.forest,
  },

  dotMiddle: {
    marginHorizontal: 5,
  },

  errorCard: {
    marginTop: 32,
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

  errorIconCircle: {
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

  errorIcon: {
    fontFamily: typography.fonts.inter.bold,
    fontSize: 20,
    color: colors.semantic.warning,
  },

  errorTitle: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.h3,
    color: colors.primary.deepForest,
    marginBottom: 6,
  },

  errorMessage: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  errorActions: {
    width: '100%',
    gap: 12,
  },

  switchAccountButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  switchAccountText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.bodyMedium,
    color: colors.primary.forest,
    textDecorationLine: 'underline',
  },
});
