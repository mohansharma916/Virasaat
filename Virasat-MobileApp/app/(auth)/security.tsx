import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

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

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
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
        setError('Unable to update secure storage. Please try again.');
      }
      return;
    }

    if (!biometricAvailable) {
      setError(
        'Biometric authentication is not available on this device.'
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
        await saveBiometricSession({ email: user.email, token });
        await saveBiometricUnlockEnabled(true);
        setBiometricEnabled(true);
      } else {
        setBiometricEnabled(false);
        setError(
          `${biometricType} verification was not completed.`
        );
      }
    } catch {
      setBiometricEnabled(false);
      setError(
        `Unable to enable ${biometricType} security.`
      );
    } finally {
      setAuthenticating(false);
    }
  };

  const handleContinue = async () => {
    await saveBiometricUnlockEnabled(biometricEnabled);
    router.replace('/(auth)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.brand}>
            VIRASAT
          </Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.securityIcon}>
            <Text style={styles.securitySymbol}>
              ◈
            </Text>
          </View>

          <Text style={styles.title}>
            Secure your Virasat
          </Text>

          <Text style={styles.description}>
            Your vault may contain documents,
            investments, memories and private
            messages.
          </Text>

          <Text style={styles.description}>
            Let's add another layer of protection
            to your account.
          </Text>
        </View>

        {/* Biometric Card */}
        <View style={styles.securityCard}>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>
              {biometricType === 'Face ID' ? '👤' : '👆'}
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {biometricType} Login
            </Text>

            <Text style={styles.cardDescription}>
              Unlock your Virasat vault instantly using {biometricType}. Fast, private, and secure.
            </Text>

            {checkingBiometric ? (
              <View style={styles.availability}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary.forest}
                />

                <Text style={styles.availabilityText}>
                  Checking device security...
                </Text>
              </View>
            ) : !biometricAvailable ? (
              <Text style={styles.unavailable}>
                Biometrics are not currently available
                on this device.
              </Text>
            ) : (
              <View style={styles.enabledRow}>
                <Text style={styles.enabledText}>
                  {biometricEnabled
                    ? 'Enabled'
                    : 'Not enabled'}
                </Text>

                <Switch
                  value={biometricEnabled}
                  onValueChange={
                    handleBiometricToggle
                  }
                  disabled={authenticating}
                  trackColor={{
                    false: colors.neutral.border,
                    true: colors.primary.forest,
                  }}
                  thumbColor={
                    colors.neutral.white
                  }
                />
              </View>
            )}
          </View>
        </View>

        {/* Authentication loading */}
        {authenticating && (
          <View style={styles.authenticating}>
            <ActivityIndicator
              color={colors.primary.forest}
            />

            <Text style={styles.authenticatingText}>
              Verifying your identity...
            </Text>
          </View>
        )}

        {/* Error */}
        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        {/* Benefits */}
        <View style={styles.benefits}>
          <SecurityBenefit text="Your vault is protected" />

          <SecurityBenefit text="Your biometric data stays on your device" />

          <SecurityBenefit text="Recovery options will be available" />
        </View>

        {/* Info */}
        <Text style={styles.info}>
          You can change these settings later from
          Security Settings.
        </Text>
      </ScrollView>

      {/* Sticky Bottom CTA Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>
            Continue
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerIcon}>
            <Text style={styles.footerCheck}>
              ✓
            </Text>
          </View>

          <Text style={styles.footerText}>
            Security comes first
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SecurityBenefit({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Text style={styles.benefitCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.benefitText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },

  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '300',
    color: colors.primary.deepForest,
  },

  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.primary.deepForest,
  },

  hero: {
    alignItems: 'center',
    marginTop: 18,
  },

  securityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  securitySymbol: {
    fontSize: 24,
    color: colors.primary.forest,
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 27,
    lineHeight: 34,
    color: colors.primary.deepForest,
    textAlign: 'center',
  },

  description: {
    maxWidth: 350,
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  securityCard: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardIconText: {
    fontSize: 20,
    color: colors.primary.forest,
  },

  cardContent: {
    flex: 1,
    marginLeft: 14,
  },

  cardTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },

  cardDescription: {
    marginTop: 5,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.neutral.textSecondary,
  },

  availability: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  availabilityText: {
    marginLeft: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
  },

  unavailable: {
    marginTop: 10,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textMuted,
  },

  enabledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  enabledText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    color: colors.primary.forest,
  },

  authenticating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  authenticatingText: {
    marginLeft: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },

  error: {
    marginTop: 12,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#B42318',
    textAlign: 'center',
  },

  benefits: {
    marginTop: 28,
    gap: 12,
  },

  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  benefitIcon: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  benefitCheck: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary.forest,
  },

  benefitText: {
    marginLeft: 9,
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },

  info: {
    marginTop: 24,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  continueButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  continueText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },

  arrow: {
    marginLeft: 10,
    fontSize: 20,
    color: colors.neutral.white,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  footerIcon: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerCheck: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary.forest,
  },

  footerText: {
    marginLeft: 7,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.neutral.textMuted,
  },
});
