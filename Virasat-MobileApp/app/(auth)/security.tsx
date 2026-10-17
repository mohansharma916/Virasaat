import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import {
  authenticateWithBiometric,
  getBiometricType,
  isBiometricAvailable,
  BiometricType,
} from '@/src/services/biometric';
import {
  getBiometricUnlockEnabled,
  saveBiometricUnlockEnabled,
  clearBiometricSession,
  getAccessToken,
  saveBiometricSession,
} from '@/src/storage/auth.storage';
import { getCurrentUser } from '@/src/api/auth.api';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StepProgress } from '@/src/components/StepProgress';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function SecurityScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const [biometricAvailable, setBiometricAvailable] =
    useState(false);

  const [biometricEnabled, setBiometricEnabled] =
    useState(false);

  const [biometricType, setBiometricType] =
    useState<BiometricType>('Face ID');

  const [checkingBiometric, setCheckingBiometric] =
    useState(true);

  const [authenticating, setAuthenticating] =
    useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [available, enabled, bioType] = await Promise.all([
          isBiometricAvailable(),
          getBiometricUnlockEnabled(),
          getBiometricType(),
        ]);

        if (active) {
          setBiometricAvailable(available);
          setBiometricEnabled(available && enabled);
          setBiometricType(bioType);
        }
      } catch {
        if (active) {
          setBiometricAvailable(false);
          setBiometricEnabled(false);
        }
      } finally {
        if (active) {
          setCheckingBiometric(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleBiometricToggle = async (
    value: boolean
  ) => {
    setError('');

    if (!value) {
      try {
        await clearBiometricSession();
        setBiometricEnabled(false);
      } catch {
        setError('We couldn’t update this setting. Try again.');
      }
      return;
    }

    if (!biometricAvailable) {
      setError(
        'Fingerprint or face unlock isn’t set up on this device.'
      );
      return;
    }

    try {
      setAuthenticating(true);

      const result = await authenticateWithBiometric(
        `Enable ${biometricType} for Virasat`
      );

      if (result.success) {
        const [token, user] = await Promise.all([getAccessToken(), getCurrentUser()]);
        if (!token) throw new Error('Sign in again before enabling biometric unlock.');
        await saveBiometricSession({ email: user.email });
        await saveBiometricUnlockEnabled(true);
        setBiometricEnabled(true);
        haptics.success();
      } else {
        setBiometricEnabled(false);
        setError(
          `${biometricType} wasn’t confirmed, so it’s still off.`
        );
      }
    } catch {
      setBiometricEnabled(false);
      setError(
        `We couldn’t turn on ${biometricType}. Try again.`
      );
    } finally {
      setAuthenticating(false);
    }
  };

  const handleContinue = async () => {
    await saveBiometricUnlockEnabled(biometricEnabled);
    // New accounts continue to profile setup; settings visits go back to where they came from.
    if (onboarding === 'true') router.replace('/(auth)/profile');
    else if (router.canGoBack()) router.back();
    else router.replace('/(auth)/(tabs)/account' as never);
  };

  const onboardingFlow = onboarding === 'true';
  const openDeviceSettings = () => {
    if (Platform.OS === 'android') {
      void Linking.sendIntent('android.settings.SECURITY_SETTINGS').catch(() => Linking.openSettings());
    } else {
      void Linking.openSettings();
    }
  };
  const isFace = biometricType === 'Face ID';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {onboardingFlow ? <StepProgress phase="Account" /> : null}

        <Text style={[styles.title, onboardingFlow && styles.titleOnboarding]} accessibilityRole="header">
          {onboardingFlow ? 'Protect your vault' : 'Security and biometrics'}
        </Text>
        <Text style={styles.subtitle}>
          Your vault can hold documents, investments and private messages. Add a second lock so only you can open it on this phone.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <AppIcon name={isFace ? 'face' : 'fingerprint'} size={26} color={colors.primary.deepForest} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Unlock with {biometricType}</Text>
            <Text style={styles.cardText}>
              {checkingBiometric
                ? 'Checking this device…'
                : biometricAvailable
                  ? biometricEnabled
                    ? 'On. You’ll be asked when you open Virasat.'
                    : 'Off. Turn on for faster, safer sign-in.'
                  : 'Not available. Set up a fingerprint or face unlock on your phone first.'}
            </Text>
          </View>
          {checkingBiometric || authenticating ? (
            <ActivityIndicator color={colors.primary.forest} accessibilityLabel="Working" />
          ) : (
            <Switch
              accessibilityLabel={`Unlock with ${biometricType}`}
              value={biometricEnabled}
              onValueChange={(value) => void handleBiometricToggle(value)}
              disabled={!biometricAvailable}
              trackColor={{ false: colors.neutral.control, true: colors.primary.forest }}
              thumbColor={colors.neutral.white}
              ios_backgroundColor={colors.neutral.control}
            />
          )}
        </View>

        {!checkingBiometric && !biometricAvailable ? (
          <InlineNotice
            tone="warning"
            title="Biometric unlock is off"
            message="Your vault is protected by your password only. Add a fingerprint or face unlock in your phone’s settings, then come back here."
            actionLabel="Open phone settings"
            onAction={openDeviceSettings}
            style={styles.notice}
          />
        ) : null}

        {error ? <InlineNotice tone="danger" message={error} style={styles.notice} /> : null}

        <View style={styles.points}>
          <Point icon="smartphone" text={`Your ${isFace ? 'face data' : 'fingerprint'} never leaves your phone. Virasat never sees it.`} />
          <Point icon="key" text="You can always sign in with your password instead." />
          <Point icon="settings" text="Change this any time from the Account tab." />
        </View>
      </ScrollView>

      <ActionBar>
        <Button title={onboardingFlow ? 'Continue' : 'Done'} onPress={() => void handleContinue()} disabled={authenticating} />
      </ActionBar>
    </SafeAreaView>
  );
}

function Point({ icon, text }: { icon: 'smartphone' | 'key' | 'settings'; text: string }) {
  return (
    <View style={styles.point}>
      <AppIcon name={icon} size={20} color={colors.primary.forest} />
      <Text style={styles.pointText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  title: {
    marginTop: 8,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  titleOnboarding: { marginTop: 24 },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  card: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  cardText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  notice: { marginTop: 16 },
  points: { marginTop: 24, gap: 16 },
  point: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pointText: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
});
