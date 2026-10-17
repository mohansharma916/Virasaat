import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StepProgress } from '@/src/components/StepProgress';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'clock', title: 'We check you’re active', body: 'You get a regular check-in from Virasat.' },
  { icon: 'bell', title: 'We try to reach you', body: 'If you don’t respond, we contact you again before anything else happens.' },
  { icon: 'users', title: 'Then we contact your trusted person', body: 'Releasing items to them is coming soon. For now we save their details privately.' },
];

export default function TrustedPersonIntroScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StepProgress phase="Account" />

        <Text style={styles.title} accessibilityRole="header">Choose someone you trust</Text>
        <Text style={styles.subtitle}>
          A trusted person can receive what you leave for them if you can’t be reached.
        </Text>

        <View style={styles.points}>
          {POINTS.map((point, index) => (
            <View key={point.title} style={styles.point} accessible accessibilityLabel={`Step ${index + 1}: ${point.title}. ${point.body}`}>
              <View style={styles.pointIcon}>
                <AppIcon name={point.icon} size={22} color={colors.primary.deepForest} />
              </View>
              <View style={styles.pointBody}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointText}>{point.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <InlineNotice
          tone="brand"
          title="You stay in control"
          message="Adding someone doesn’t give them access to your vault."
        />
      </ScrollView>

      <ActionBar>
        <Button
          title="Add trusted person"
          onPress={() => router.replace({ pathname: '/(auth)/trusted-person', params: { onboarding: 'true' } } as never)}
        />
        <Button title="Skip for now" variant="tertiary" onPress={() => router.replace('/(auth)/legacy-setup')} />
      </ActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  title: {
    marginTop: 24,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  points: { marginVertical: 28, gap: 20 },
  point: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  pointIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointBody: { flex: 1, gap: 2 },
  pointTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  pointText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
});
