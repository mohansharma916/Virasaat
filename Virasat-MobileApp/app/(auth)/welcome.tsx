import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { TextLink } from '@/src/components/TextLink';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

// The product is a real sequence, so the steps are numbered.
const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'lock', title: 'Store what matters', body: 'Documents, investments, messages and videos, encrypted.' },
  { icon: 'users', title: 'Choose your people', body: 'Pick who should receive each item.' },
  { icon: 'shieldCheck', title: 'Decide when', body: 'Nothing is released unless your rules are met.' },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand} accessibilityLabel="Virasat">VIRASAT</Text>

        {__DEV__ ? (
          <TextLink title="Developer: screen navigator" tone="muted" onPress={() => router.push('/(auth)/dev-screen')} />
        ) : null}

        <Text style={styles.heroTitle} accessibilityRole="header">
          Your life is digital. Your legacy should remain.
        </Text>
        <Text style={styles.description}>
          Keep your important documents, investments and messages safe, and make sure the right people receive them when the time comes.
        </Text>

        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <View key={step.title} style={styles.step} accessible accessibilityLabel={`Step ${index + 1}: ${step.title}. ${step.body}`}>
              <View style={styles.stepIcon}>
                <AppIcon name={step.icon} size={22} color={colors.primary.deepForest} />
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>
                  {index + 1}. {step.title}
                </Text>
                <Text style={styles.stepText}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <ActionBar style={styles.actions}>
        <Button title="Get started" onPress={() => router.push('/(auth)/signup')} />
        <Button title="I already have an account" variant="secondary" onPress={() => router.push('/(auth)/login')} />
      </ActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 22,
    letterSpacing: 4,
    color: colors.primary.deepForest,
  },
  heroTitle: {
    marginTop: 40,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.display,
    lineHeight: typography.lineHeights.display,
    color: colors.primary.deepForest,
  },
  description: {
    marginTop: 16,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  steps: { marginTop: 32, gap: 20 },
  step: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.body,
    lineHeight: 22,
    color: colors.neutral.textPrimary,
  },
  stepText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
  actions: { gap: 8, borderTopWidth: 0 },
});
