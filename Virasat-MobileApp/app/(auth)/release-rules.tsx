import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SelectionRow } from '@/src/components/SelectionRow';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { StepProgress } from '@/src/components/StepProgress';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getReleasePolicy, updateReleasePolicy, type ReleasePolicy } from '@/src/api/release.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';

export default function ReleaseRulesScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const inOnboarding = onboarding === 'true';
  const dispatch = useAppDispatch();
  const [initialPolicy, setInitialPolicy] = useState<ReleasePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    setError('');
    void getReleasePolicy().then((policy) => {
      if (!active) return;
      setInitialPolicy(policy);
      setVerificationRequired(policy?.verificationRequired ?? true);
    }).catch((reason) => {
      if (!active) return;
      if (isAxiosError(reason) && reason.response?.status === 404) setInitialPolicy(null);
      else {
        setLoadFailed(true);
        setError(getApiErrorMessage(reason, 'We couldn’t load your saved rules. Try again before making changes.'));
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  const handleContinue = async () => {
    if (loading || loadFailed || saving) return;
    try {
      setSaving(true);
      setError('');
      await updateReleasePolicy({
        trigger: initialPolicy?.trigger ?? 'CHECK_IN_ESCALATION',
        verificationRequired,
        verificationLevel: initialPolicy?.verificationLevel ?? 'STANDARD',
        escalationConfig: initialPolicy?.escalationConfig ?? {
          missedCheckInsBeforeReview: 3,
          manualReviewRequired: true,
        },
        enabled: true,
      });
      await dispatch(refreshVaultData()).unwrap();
      haptics.success();
      if (!inOnboarding && router.canGoBack()) router.back();
      else router.replace('/(auth)/(tabs)/home');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We couldn’t save your release rules. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  const missedBeforeReview = Number(
    (initialPolicy?.escalationConfig as { missedCheckInsBeforeReview?: number } | undefined)?.missedCheckInsBeforeReview ?? 3,
  );

  const steps: { icon: IconName; title: string; body: string }[] = [
    { icon: 'clock', title: 'You miss a check-in', body: 'Nothing is released. We simply notice you haven’t responded.' },
    { icon: 'bell', title: 'We remind you', body: `We keep trying to reach you. After ${missedBeforeReview} missed check-ins we move to the next step.` },
    { icon: 'users', title: 'We contact your trusted person', body: 'Only if we still can’t reach you.' },
    {
      icon: 'verified',
      title: verificationRequired ? 'Identity check and review' : 'Review by Virasat',
      body: verificationRequired
        ? 'Your trusted person verifies their identity, and Virasat reviews the case.'
        : 'Virasat reviews the case before anything is released.',
    },
    { icon: 'lock', title: 'Items are released', body: 'Only the items you assigned to that person, nothing else.' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {inOnboarding ? <StepProgress phase="Rules" /> : null}
        <Text style={[styles.title, inOnboarding && styles.titleOnboarding]} accessibilityRole="header">Release rules</Text>
        <Text style={styles.subtitle}>
          What happens if you stop responding. Missing one check-in never releases anything.
        </Text>

        {loading ? (
          <SkeletonGroup label="Loading your release rules">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} height={64} radius={12} style={styles.skeletonGap} />
            ))}
          </SkeletonGroup>
        ) : (
          <>
            <View style={styles.timeline} accessibilityRole="list">
              {steps.map((step, index) => {
                const last = index === steps.length - 1;
                return (
                  <View key={step.title} style={styles.step} accessible accessibilityLabel={`Step ${index + 1} of ${steps.length}: ${step.title}. ${step.body}`}>
                    <View style={styles.rail}>
                      <View style={[styles.dot, last && styles.dotLast]}>
                        <AppIcon name={step.icon} size={18} color={last ? colors.neutral.white : colors.primary.deepForest} />
                      </View>
                      {!last ? <View style={styles.line} /> : null}
                    </View>
                    <View style={[styles.stepBody, !last && styles.stepBodySpacing]}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepText}>{step.body}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle} accessibilityRole="header">Identity check for your people</Text>
            <View style={styles.options} accessibilityRole="radiogroup">
              <SelectionRow
                kind="radio"
                selected={verificationRequired}
                onPress={() => setVerificationRequired(true)}
                title="Require an ID check"
                description="Recommended. They verify their identity before opening anything."
              />
              <SelectionRow
                kind="radio"
                selected={!verificationRequired}
                onPress={() => setVerificationRequired(false)}
                title="No ID check"
                description="Sign-in and Virasat’s review still apply."
              />
            </View>
            <Text style={styles.hint}>This applies to items you assign from now on. Existing assignments keep their rules.</Text>
          </>
        )}

        <InlineNotice
          tone="info"
          title="Coming soon"
          message="We save these rules now. Automatic reminders, contacting your people and releasing items aren’t active yet."
          style={styles.notice}
        />
      </ScrollView>

      <ActionBar>
        {error ? (
          <InlineNotice
            tone="danger"
            message={error}
            actionLabel={loadFailed ? 'Try again' : undefined}
            onAction={loadFailed ? () => setRetry((value) => value + 1) : undefined}
            style={styles.error}
          />
        ) : null}
        <Button
          title={inOnboarding ? 'Save and finish setup' : 'Save release rules'}
          onPress={() => void handleContinue()}
          loading={saving}
          disabled={loading || loadFailed}
        />
      </ActionBar>
    </SafeAreaView>
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
  skeletonGap: { marginTop: 12 },
  timeline: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  step: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 36 },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLast: { backgroundColor: colors.primary.deepForest },
  line: { flex: 1, width: 2, minHeight: 16, backgroundColor: colors.brand.sage, marginVertical: 4 },
  stepBody: { flex: 1, paddingTop: 6, gap: 2 },
  stepBodySpacing: { paddingBottom: 16 },
  stepTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  stepText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.title3,
    lineHeight: typography.lineHeights.title3,
    color: colors.neutral.textPrimary,
  },
  options: { gap: 12 },
  hint: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    color: colors.neutral.textMuted,
  },
  notice: { marginTop: 24 },
  error: { marginBottom: 8 },
});
