import { router } from 'expo-router';
import {
  Pressable,

  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/(auth)/signup');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Brand */}
        <View style={styles.brandContainer}>
          <Text style={styles.brand}>
            VIRASAT
          </Text>
        </View>

        {__DEV__ && (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/dev-screen')}
            activeOpacity={0.7}
          >
            <Text style={styles.devButtonText}>DEV: Screen Navigator</Text>
          </TouchableOpacity>
        )}

        {/* Hero */}
        <View style={styles.heroContainer}>
          <Text style={styles.eyebrow}>
            YOUR DIGITAL LEGACY
          </Text>

          <Text style={styles.heroTitle}>
            Your life is digital.{'\n'}
            Your legacy should remain.
          </Text>

          <Text style={styles.description}>
            Secure your important documents, investments,
            memories and messages — and make them available
            to the right people when they need them.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.actionContainer}>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>
              Get Started
            </Text>

            <Text style={styles.arrow}>
              →
            </Text>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <Pressable onPress={handleLogin}>
              <Text style={styles.loginButton}>
                Log In
              </Text>
            </Pressable>
          </View>

        </View>

        {/* Trust indicator */}
        <View style={styles.securityContainer}>
          <View style={styles.lockCircle}>
            <Text style={styles.lock}>
              ✓
            </Text>
          </View>

          <Text style={styles.securityText}>
            Secure & Private
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
    paddingTop: 12,
    paddingBottom: 24,
  },

  brandContainer: {
    alignItems: 'center',
  },

  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 22,
    letterSpacing: 4,
    color: colors.primary.deepForest,
  },

  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },

  devButtonText: {
  textAlign: 'center',
  marginTop: 20,
},

  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    letterSpacing: 2.2,
    color: colors.primary.forest,
    marginBottom: 18,
  },

  heroTitle: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 34,
    lineHeight: 42,
    color: colors.primary.deepForest,
    textAlign: 'center',
  },

  description: {
    marginTop: 22,
    maxWidth: 350,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  actionContainer: {
    width: '100%',
  },

  primaryButton: {
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

  primaryButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },

  arrow: {
    marginLeft: 10,
    fontSize: 20,
    color: colors.neutral.white,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  loginText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },

  loginButton: {
    marginLeft: 5,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.forest,
  },

  securityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },

  lockCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lock: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary.forest,
  },

  securityText: {
    marginLeft: 7,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.neutral.textMuted,
  },
});