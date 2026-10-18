import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { StepProgress } from '@/src/components/StepProgress';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getCheckInStatus, updateCheckInSettings, type CheckInPolicy } from '@/src/api/check-in.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';
import { useSubscription } from '@/src/store/subscription.slice';
import { Feature } from '@/src/types/subscription.types';
import { UpgradeModal } from '@/src/components/UpgradeModal';

export default function CheckInPreferencesScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const inOnboarding = onboarding === 'true';
  const dispatch = useAppDispatch();
  const email = useAppSelector((state) => state.session.user?.email);
  const { canUseFeature } = useSubscription();
  const hasCustomCheckIn = canUseFeature(Feature.CUSTOM_CHECK_IN);
  const [initialPolicy, setInitialPolicy] = useState<CheckInPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    setError('');
    void getCheckInStatus().then(({ policy }) => {
      if (!active) return;
      setInitialPolicy(policy);
      setPreferredTime(policy.preferredTime);
      setSelectedSchedule(policy.cadence);
    }).catch((reason) => {
      if (!active) return;
      if (isAxiosError(reason) && reason.response?.status === 404) {
        setInitialPolicy(null);
      } else {
        setLoadFailed(true);
        setError(getApiErrorMessage(reason, 'We couldn’t load your saved settings. Try again before making changes.'));
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  const handleContinue = async () => {
    if (loading || loadFailed || saving) return;
    try {
      setSaving(true);
      setError('');
      await updateCheckInSettings({
        cadence: initialPolicy?.cadence === selectedSchedule ? undefined : selectedSchedule,
        preferredTime,
        timezone: initialPolicy?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        reminderConfig: {
          channels: ['EMAIL'],
          reminderDaysBefore: initialPolicy?.cadence === selectedSchedule ? initialPolicy.reminderConfig.reminderDaysBefore : selectedSchedule === 'WEEKLY' ? [3, 1] : [7, 3, 1],
        },
        escalationEnabled: initialPolicy?.escalationEnabled ?? false,
      });
      await dispatch(refreshVaultData()).unwrap();
      haptics.success();
      if (inOnboarding) router.push({ pathname: '/(auth)/release-rules', params: { onboarding: 'true' } } as never);
      else if (router.canGoBack()) router.back();
      else router.replace('/(auth)/(tabs)/home');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We couldn’t save your check-in settings. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  const TIMES = [
    { value: '08:00', label: '8:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '18:00', label: '6:00 PM' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {inOnboarding ? <StepProgress phase="Rules" /> : null}
        <Text style={[styles.title, inOnboarding && styles.titleOnboarding]} accessibilityRole="header">Check-ins</Text>
        <Text style={styles.subtitle}>
          We’ll regularly ask you to confirm you’re active. Missing a check-in never releases anything on its own.
        </Text>

        {loading ? (
          <SkeletonGroup label="Loading your check-in settings">
            <Skeleton height={48} radius={12} />
            <Skeleton height={48} radius={12} style={styles.skeletonGap} />
            <Skeleton height={72} radius={16} style={styles.skeletonGap} />
          </SkeletonGroup>
        ) : (
          <>
            <Text style={styles.sectionLabel} nativeID="frequencyLabel">How often</Text>
            <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabelledBy="frequencyLabel">
              {(['MONTHLY', 'WEEKLY'] as const).map((option) => {
                const selected = selectedSchedule === option;
                const locked = option === 'WEEKLY' && !hasCustomCheckIn;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={option === 'MONTHLY' ? 'Every month, recommended' : locked ? 'Every week, needs the Secure plan' : 'Every week'}
                    onPress={() => {
                      if (locked) {
                        setCustomModalVisible(true);
                        return;
                      }
                      haptics.selection();
                      setSelectedSchedule(option);
                    }}
                    style={[styles.segment, selected && styles.segmentSelected]}
                  >
                    {locked ? <AppIcon name="lock" size={16} color={colors.neutral.textSecondary} /> : null}
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                      {option === 'MONTHLY' ? 'Every month' : 'Every week'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>
              {selectedSchedule === 'MONTHLY' ? 'Recommended for most people.' : 'For people who want a closer watch.'}
              {!hasCustomCheckIn ? ' Weekly needs the Secure plan.' : ''}
            </Text>

            <Text style={styles.sectionLabel} nativeID="timeLabel">Preferred time</Text>
            <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabelledBy="timeLabel">
              {TIMES.map((time) => {
                const selected = preferredTime === time.value;
                return (
                  <Pressable
                    key={time.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      haptics.selection();
                      setPreferredTime(time.value);
                    }}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <AppIcon name="clock" size={16} color={selected ? colors.neutral.white : colors.neutral.textSecondary} />
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{time.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>How we’ll contact you</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <AppIcon name="mail" size={20} color={colors.primary.deepForest} />
              </View>
              <View style={styles.infoBody}>
                <Text style={styles.infoTitle}>Email</Text>
                <Text style={styles.infoText}>{email ?? 'Your account email'}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowGap]}>
              <View style={styles.infoIcon}>
                <AppIcon name="bell" size={20} color={colors.primary.deepForest} />
              </View>
              <View style={styles.infoBody}>
                <Text style={styles.infoTitle}>Reminders</Text>
                <Text style={styles.infoText}>
                  Check-in opens 2 days before it’s due and stays open. We email you when it opens, on the day, and keep reminding you if you miss it.
                </Text>
              </View>
            </View>
          </>
        )}

        <InlineNotice
          tone="info"
          title="If you miss a check-in"
          message="Nothing happens straight away. We remind you after 7, 15, 21, 30 and 45 days, then more often. Your release rules decide when a review starts."
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
          title={inOnboarding ? 'Save and continue' : 'Save check-ins'}
          onPress={() => void handleContinue()}
          loading={saving}
          disabled={loading || loadFailed}
        />
      </ActionBar>

      <UpgradeModal
        visible={customModalVisible}
        onClose={() => setCustomModalVisible(false)}
        title="Weekly check-ins"
        message="Weekly check-ins will be part of Virasat Secure."
        benefits={['Choose a weekly schedule', 'More reminder options', 'A closer watch on your account']}
        onCtaPress={() => router.push('/(auth)/plans' as never)}
      />
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
    marginBottom: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  skeletonGap: { marginTop: 12 },
  sectionLabel: {
    marginTop: 24,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    lineHeight: typography.lineHeights.label,
    color: colors.neutral.textPrimary,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 14,
    backgroundColor: colors.neutral.sunken,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentSelected: { backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.primary.forest },
  segmentText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.label, color: colors.neutral.textSecondary },
  segmentTextSelected: { fontFamily: typography.fonts.inter.semiBold, color: colors.primary.deepForest },
  hint: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    color: colors.neutral.textMuted,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.neutral.control,
    backgroundColor: colors.neutral.white,
  },
  chipSelected: { backgroundColor: colors.primary.deepForest, borderColor: colors.primary.deepForest },
  chipText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.label, color: colors.neutral.textPrimary },
  chipTextSelected: { color: colors.neutral.white },
  infoRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  infoRowGap: { marginTop: 8 },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: { flex: 1, gap: 2 },
  infoTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, color: colors.neutral.textPrimary },
  infoText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  notice: { marginTop: 24 },
  error: { marginBottom: 8 },
});
