import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function TrustedPersonIntroScreen() {
  const handleContinue = () => {
    router.replace('/(auth)/trusted-person');
  };

  const handleSkip = () => {
    router.replace('/(auth)/legacy-setup');
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

        {/* Progress */}
        <View style={styles.progressContainer}>
          <ProgressDot active />
          <ProgressLine active />

          <ProgressDot active />
          <ProgressLine active />

          <ProgressDot active />
          <ProgressLine active />

          <ProgressDot active />
          <ProgressLine active />

          <ProgressDot active />
          <ProgressLine active />

          <ProgressDot active />
          <ProgressLine active />

          <ProgressDot active />
          <ProgressLine />

          <ProgressDot />
          <ProgressLine />

          <ProgressDot />
          <ProgressLine />

          <ProgressDot />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroSymbol}>
              ♢
            </Text>
          </View>

          <Text style={styles.title}>
            Someone you trust.{'\n'}
            A legacy you control.
          </Text>

          <Text style={styles.subtitle}>
            Choose a trusted person who can help
            receive your legacy if you become
            unreachable.
          </Text>
        </View>

        {/* Why */}
        <View style={styles.explanationCard}>
          <Text style={styles.cardTitle}>
            Why do I need one?
          </Text>

          <Text style={styles.cardText}>
            Virasat is designed to protect important
            information beyond your lifetime and
            make sure the people you choose can
            receive what you intentionally leave for
            them.
          </Text>
        </View>

        {/* What happens */}
        <Text style={styles.sectionTitle}>
          What happens?
        </Text>

        <View style={styles.steps}>
          <SecurityStep
            number="01"
            title="We check that you're active"
            description="You'll receive a periodic check-in from Virasat."
          />

          <SecurityStep
            number="02"
            title="We try to reach you"
            description="If you don't respond, we'll make additional attempts to contact you."
          />

          <SecurityStep
            number="03"
            title="Your trusted person is contacted"
            description="Only after the defined verification process is completed."
          />

          <SecurityStep
            number="04"
            title="Your vault remains protected"
            description="Access is released only according to the rules you define."
          />
        </View>

        {/* Important note */}
        <View style={styles.note}>
          <View style={styles.noteIcon}>
            <Text style={styles.noteIconText}>
              i
            </Text>
          </View>

          <Text style={styles.noteText}>
            Adding a trusted person does not give
            them immediate access to your vault.
            You remain in control of your information.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            Choose Trusted Person
          </Text>

          <Text style={styles.buttonArrow}>
            →
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          hitSlop={10}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>
            I’ll add someone later
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
            You stay in control
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressDot({
  active = false,
}: {
  active?: boolean;
}) {
  return (
    <View
      style={[
        styles.progressDot,
        active && styles.progressDotActive,
      ]}
    />
  );
}

function ProgressLine({
  active = false,
}: {
  active?: boolean;
}) {
  return (
    <View
      style={[
        styles.progressLine,
        active && styles.progressLineActive,
      ]}
    />
  );
}

function SecurityStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepDescription}>
          {description}
        </Text>
      </View>
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
    paddingBottom: 35,
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

  progressContainer: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    rowGap: 5,
  },

  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral.border,
  },

  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.forest,
  },

  progressLine: {
    width: 15,
    height: 1,
    marginHorizontal: 2,
    backgroundColor: colors.neutral.border,
  },

  progressLineActive: {
    backgroundColor: colors.primary.forest,
  },

  hero: {
    alignItems: 'center',
    marginTop: 40,
  },

  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  heroSymbol: {
    fontSize: 30,
    color: colors.primary.forest,
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 29,
    lineHeight: 38,
    color: colors.primary.deepForest,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 13,
    maxWidth: 350,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  explanationCard: {
    marginTop: 30,
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  cardTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.primary.deepForest,
  },

  cardText: {
    marginTop: 7,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 15,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.textPrimary,
  },

  steps: {
    gap: 17,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepNumber: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    color: colors.primary.forest,
  },

  stepContent: {
    flex: 1,
    marginLeft: 12,
  },

  stepTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },

  stepDescription: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textSecondary,
  },

  note: {
    flexDirection: 'row',
    marginTop: 25,
    padding: 14,
    borderRadius: 13,
    backgroundColor: colors.brand.mint,
  },

  noteIcon: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noteIconText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.primary.forest,
  },

  noteText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textSecondary,
  },

  button: {
    height: 56,
    marginTop: 28,
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
    fontSize: 20,
    color: colors.neutral.white,
  },

  skipButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  skipText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    color: colors.primary.forest,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
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
