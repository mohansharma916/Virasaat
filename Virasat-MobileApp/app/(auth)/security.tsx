import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import {
  authenticateWithBiometric,
  isBiometricAvailable,
} from '@/src/services/biometric';
import { saveBiometricUnlockEnabled } from '@/src/storage/auth.storage';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function SecurityScreen() {
  const [biometricAvailable, setBiometricAvailable] =
    useState(false);

  const [biometricEnabled, setBiometricEnabled] =
    useState(false);

  const [checkingBiometric, setCheckingBiometric] =
    useState(true);

  const [authenticating, setAuthenticating] =
    useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const available =
        await isBiometricAvailable();

      setBiometricAvailable(available);
    } catch {
      setBiometricAvailable(false);
    } finally {
      setCheckingBiometric(false);
    }
  };

  const handleBiometricToggle = async (
    value: boolean
  ) => {
    setError('');

    if (!value) {
      setBiometricEnabled(false);
      await saveBiometricUnlockEnabled(false);
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

      const result =
        await authenticateWithBiometric();

      if (result.success) {
        setBiometricEnabled(true);
        await saveBiometricUnlockEnabled(true);
      } else {
        setBiometricEnabled(false);
        setError(
          'Biometric verification was not completed.'
        );
      }
    } catch {
      setBiometricEnabled(false);
      setError(
        'Unable to enable biometric security.'
      );
    } finally {
      setAuthenticating(false);
    }
  };

  const handleContinue = async () => {
    await saveBiometricUnlockEnabled(biometricEnabled);
    router.replace('/(auth)/profile');
  };

  const biometricName =
    Platform.OS === 'ios'
      ? 'Face ID / Touch ID'
      : 'Device biometrics';

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
              ◉
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Biometric Security
            </Text>

            <Text style={styles.cardDescription}>
              Use {biometricName.toLowerCase()} to
              protect access to your Virasat vault.
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

        {/* Continue */}
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
      </ScrollView>
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
    paddingBottom: 30,
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
    marginTop: 42,
  },

  securityIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  securitySymbol: {
    fontSize: 27,
    color: colors.primary.forest,
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 31,
    lineHeight: 39,
    color: colors.primary.deepForest,
    textAlign: 'center',
  },

  description: {
    maxWidth: 350,
    marginTop: 12,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  securityCard: {
    flexDirection: 'row',
    marginTop: 34,
    padding: 18,
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

  continueButton: {
    height: 56,
    marginTop: 26,
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
