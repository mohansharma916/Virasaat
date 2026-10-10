import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function TrustedPersonSuccessScreen() {
  const params = useLocalSearchParams<{
    notificationMode?: string;
    name?: string;
  }>();


  const personName = params.name?.trim() || 'Your trusted person';

  const handleContinue = () => {
    /*
     * Later this will move the user into
     * the next part of Virasat setup.
     */

    router.replace('/(auth)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Brand */}

        <Text style={styles.brand}>
          VIRASAT
        </Text>

        {/* Main */}

        <View style={styles.main}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>
              ✓
            </Text>
          </View>

          <Text style={styles.title}>
            Trusted person added
          </Text>

          <Text style={styles.subtitle}>
            {personName} has been securely added
            to your Virasat legacy.
          </Text>

          {/* Status Card */}

          <View style={styles.statusCard}>
            <Text style={styles.cardLabel}>
              PRIVATE CONTACT
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.statusIcon}>
                <Text style={styles.statusIconText}>
                  ✓
                </Text>
              </View>

              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>
                  Saved privately
                </Text>

                <Text style={styles.statusText}>
                  No invitation has been sent to {personName}. Invitations and recipient acceptance are not available yet.
                </Text>
              </View>
            </View>
          </View>

          {/* Privacy */}

          <View style={styles.privacyCard}>
            <View style={styles.lockCircle}>
              <Text style={styles.lock}>
                🔒
              </Text>
            </View>

            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>
                Your vault remains private
              </Text>

              <Text style={styles.privacyText}>
                Being a trusted person does not give
                them access to your encrypted
                documents.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom */}

        <View style={styles.bottom}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              Continue Setup
            </Text>

            <Text style={styles.buttonArrow}>
              →
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            Trusted person ✓
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 30,
  },

  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.primary.deepForest,
    textAlign: 'center',
  },

  progressContainer: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 5,
  },

  progressItem: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.forest,
  },

  main: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -20,
  },

  successCircle: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  successIcon: {
    fontSize: 29,
    fontWeight: '700',
    color: colors.primary.forest,
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 30,
    lineHeight: 39,
    textAlign: 'center',
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 9,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.neutral.textSecondary,
  },

  statusCard: {
    marginTop: 29,
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  cardLabel: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.3,
    color: colors.neutral.textMuted,
  },

  statusRow: {
    flexDirection: 'row',
    marginTop: 15,
  },

  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.forest,
  },

  statusContent: {
    flex: 1,
    marginLeft: 11,
  },

  statusTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },

  statusText: {
    marginTop: 5,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textSecondary,
  },

  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
  },

  lockCircle: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lock: {
    fontSize: 12,
  },

  privacyContent: {
    flex: 1,
    marginLeft: 10,
  },

  privacyTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },

  privacyText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },

  bottom: {
    marginTop: 20,
  },

  button: {
    height: 56,
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

  buttonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },

  buttonArrow: {
    marginLeft: 10,
    fontSize: 19,
    color: colors.neutral.white,
  },

  footer: {
    marginTop: 15,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },
});
