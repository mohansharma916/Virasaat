import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import { hydrateSession } from '@/src/store/session.slice';

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
      } catch (reason) {
        if (!isAxiosError(reason) || reason.response?.status !== 401) {
          if (active) setError('Unable to confirm your session. Check your connection and retry.');
          return null;
        }
        await removeAccessToken();
        return '/(auth)/welcome';
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

        <Text style={styles.logo}>
          VIRASAT
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.subtitleContainer,
          {
            opacity: subtitleOpacity,
          },
        ]}
      >
        <Text style={styles.subtitle}>
          Your Digital Legacy
        </Text>

        <Text style={styles.subtitleStrong}>
          Secured.
        </Text>
      </Animated.View>

      {!!error && <View style={{ padding: 24, gap: 16 }}><Text accessibilityRole="alert">{error}</Text><Button title="Retry" onPress={() => { setError(''); setRetry((value) => value + 1); }} /></View>}
      <View style={styles.bottomContainer}>
        <Text style={styles.loadingText}>
          Preparing your vault
        </Text>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotMiddle]} />
          <View style={styles.dot} />
        </View>
      </View>
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
});
