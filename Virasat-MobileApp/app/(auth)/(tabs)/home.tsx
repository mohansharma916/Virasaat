import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { IconButton } from '@/src/components/IconButton';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { confirmCheckIn } from '@/src/api/check-in.api';
import { getLiveReleaseCase, type LiveReleaseCase } from '@/src/api/release.api';
import { getSharedOverview } from '@/src/api/shared.api';
import { registerForReminders } from '@/src/services/push.service';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { haptics } from '@/src/utils/haptics';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { hydrateSession } from '@/src/store/session.slice';
import { refreshVaultData } from '@/src/store/vault.slice';
import { fetchSubscription } from '@/src/store/subscription.slice';
import type { LegacyCategory } from '@/src/utils/legacy-flow';

const CATEGORIES: { id: LegacyCategory; title: string; icon: IconName }[] = [
  { id: 'DOCUMENTS', title: 'Documents', icon: 'document' },
  { id: 'INVESTMENTS', title: 'Investments', icon: 'investment' },
  { id: 'MESSAGES', title: 'Messages', icon: 'message' },
  { id: 'VIDEOS', title: 'Videos', icon: 'video' },
  { id: 'OTHER', title: 'Other', icon: 'folder' },
];

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.session.user);
  const items = useAppSelector((state) => state.vault.items);
  const recipients = useAppSelector((state) => state.vault.recipients);
  const checkInStatus = useAppSelector((state) => state.vault.checkIn);
  const issues = useAppSelector((state) => state.vault.issues);
  const vaultStatus = useAppSelector((state) => state.vault.status);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [checkInError, setCheckInError] = useState('');
  const [confirmingCheckIn, setConfirmingCheckIn] = useState(false);
  const checkInBusy = useRef(false);
  const [liveCase, setLiveCase] = useState<LiveReleaseCase | null>(null);
  const [sharedNeedsYou, setSharedNeedsYou] = useState(0);
  // Refreshed with the overview, so the check-in window stays current.
  const [now, setNow] = useState(() => Date.now());

  const loadOverview = useCallback(async () => {
    setRefreshError('');
    setNow(Date.now());
    try {
      // Optional extras never block the overview.
      void registerForReminders();
      void getLiveReleaseCase().then(setLiveCase).catch(() => undefined);
      void getSharedOverview()
        .then((shared) => setSharedNeedsYou(shared.invitations.length + shared.cases.filter((c) => !c.statementSubmittedAt).length))
        .catch(() => undefined);
      await Promise.all([
        dispatch(hydrateSession()).unwrap(),
        dispatch(refreshVaultData()).unwrap(),
        dispatch(fetchSubscription()).unwrap(),
      ]);
    } catch (error) {
      setRefreshError(getApiErrorMessage(error, 'We couldn’t refresh your vault.'));
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
    }, [loadOverview]),
  );

  const onPullRefresh = async () => {
    setRefreshing(true);
    await loadOverview();
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    const result: Record<LegacyCategory, number> = { DOCUMENTS: 0, INVESTMENTS: 0, MESSAGES: 0, VIDEOS: 0, OTHER: 0 };
    for (const item of items) {
      const key = (item.category in result ? item.category : 'OTHER') as LegacyCategory;
      result[key] += 1;
    }
    return result;
  }, [items]);

  const trustedPerson = recipients.find((person) => person.status !== 'REVOKED') ?? null;
  const pendingCheckIn = checkInStatus?.currentEvent?.status === 'PENDING';
  const checkInDate = checkInStatus?.currentEvent?.dueAt ?? checkInStatus?.policy.nextCheckInAt ?? null;
  // Check-in opens 2 days before it is due and stays open until done.
  const opensAt = checkInStatus?.opensAt ? new Date(checkInStatus.opensAt) : null;
  const checkInOpen = pendingCheckIn && (!opensAt || opensAt.getTime() <= now);
  const overdueDays = checkInOpen && checkInDate
    ? Math.floor((now - new Date(checkInDate).getTime()) / 86_400_000)
    : 0;
  const deadlineAt = checkInStatus?.deadlineAt ?? null;
  const totalItems = items.length;
  const firstUnassigned = items.find((item) => !item.assignment);
  const hasAssignment = items.some((item) => !!item.assignment);
  const firstLoad = vaultStatus === 'loading' && totalItems === 0 && !refreshing;

  const steps = [
    {
      done: totalItems > 0,
      title: 'Save your first item',
      detail: totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'} saved` : 'A document, investment or message',
      go: () => router.push('/(auth)/legacy-setup'),
    },
    {
      done: !!trustedPerson,
      title: 'Add a trusted person',
      detail: trustedPerson ? trustedPerson.name : 'Someone who can receive your legacy',
      go: () => router.push('/(auth)/trusted-person'),
    },
    {
      done: hasAssignment,
      title: 'Choose who gets an item',
      detail: hasAssignment ? 'At least one item is assigned' : 'Link an item to a person and a rule',
      go: () =>
        totalItems === 0
          ? router.push('/(auth)/legacy-setup')
          : router.push({ pathname: '/(auth)/item-settings', params: firstUnassigned ? { itemId: firstUnassigned.id } : undefined } as never),
    },
    {
      done: !!checkInStatus,
      title: 'Set up check-ins',
      detail: checkInStatus ? 'Schedule saved' : 'How often we check you’re active',
      go: () => router.push('/(auth)/check-in-preferences' as never),
    },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const nextStep = steps.find((step) => !step.done);

  const handleConfirmCheckIn = async () => {
    const eventId = checkInStatus?.currentEvent?.id;
    if (!eventId || checkInBusy.current) return;
    checkInBusy.current = true;
    try {
      setConfirmingCheckIn(true);
      setCheckInError('');
      await confirmCheckIn(eventId);
      haptics.success();
      await loadOverview();
    } catch (error) {
      haptics.error();
      setCheckInError(getApiErrorMessage(error, 'We couldn’t confirm your check-in. Try again.'));
    } finally {
      checkInBusy.current = false;
      setConfirmingCheckIn(false);
    }
  };

  const firstName = user?.name?.split(' ')[0];
  const initials = (user?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.brand} accessibilityLabel="Virasat">VIRASAT</Text>
        <View style={styles.headerActions}>
          {__DEV__ ? (
            <IconButton icon="settings" accessibilityLabel="Developer screen navigator" onPress={() => router.push('/(auth)/dev-screen' as never)} />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account"
            onPress={() => router.navigate('/(auth)/(tabs)/account')}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.primary.forest} colors={[colors.primary.forest]} />
        }
      >
        {liveCase ? (
          <View style={[styles.checkInBanner, styles.reviewBanner]} accessibilityRole="alert">
            <View style={styles.bannerRow}>
              <AppIcon name="warning" size={24} color={colors.neutral.white} />
              <View style={styles.bannerBody}>
                <Text style={styles.bannerTitle}>
                  {liveCase.status === 'APPROVED' ? 'Your items were released' : 'A release review has started'}
                </Text>
                <Text style={[styles.bannerText, styles.reviewBannerText]}>
                  {liveCase.status === 'APPROVED'
                    ? 'You didn’t check in for a long time, so Virasat released your assigned items. Check in now to end their access immediately.'
                    : 'You didn’t check in for a long time, so we contacted your trusted people. Check in now to cancel the review.'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {sharedNeedsYou > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/shared' as never)}
            style={({ pressed }) => [styles.sharedCard, pressed && styles.pressed]}
          >
            <AppIcon name="heart" size={22} color={colors.primary.deepForest} />
            <View style={styles.bannerBody}>
              <Text style={styles.sharedTitle}>Someone needs you as their trusted person</Text>
              <Text style={styles.sharedText}>Open to respond.</Text>
            </View>
            <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
          </Pressable>
        ) : null}

        {checkInOpen ? (
          <View style={[styles.checkInBanner, overdueDays > 0 && styles.overdueBanner]} accessibilityRole="alert">
            <View style={styles.bannerRow}>
              <AppIcon name="bell" size={24} color={colors.neutral.white} />
              <View style={styles.bannerBody}>
                <Text style={styles.bannerTitle}>
                  {overdueDays > 0 ? `Your check-in is ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue` : 'Your check-in is open'}
                </Text>
                <Text style={styles.bannerText}>
                  {overdueDays > 0 && deadlineAt
                    ? `Check in before ${formatDate(deadlineAt)}, or a release review will start.`
                    : checkInDate ? `Due ${formatDate(checkInDate)}. Confirm so we know you’re active.` : 'Confirm so we know you’re active.'}
                </Text>
              </View>
            </View>
            {checkInError ? <Text style={styles.bannerError}>{checkInError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: confirmingCheckIn, disabled: confirmingCheckIn }}
              disabled={confirmingCheckIn}
              onPress={() => void handleConfirmCheckIn()}
              style={({ pressed }) => [styles.bannerButton, pressed && styles.pressed]}
            >
              <Text style={styles.bannerButtonText}>{confirmingCheckIn ? 'Confirming…' : 'I’m active'}</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.greeting} accessibilityRole="header">
          {firstName ? `Hello, ${firstName}` : 'Welcome to Virasat'}
        </Text>
        <Text style={styles.greetingSubtitle}>Your information, under your control.</Text>

        {refreshError || (vaultStatus === 'error') || issues.length > 0 ? (
          <InlineNotice
            tone="danger"
            message={refreshError || (issues.length > 0 ? issues.join(' ') : 'We couldn’t refresh your vault.')}
            actionLabel="Try again"
            onAction={() => void loadOverview()}
            style={styles.section}
          />
        ) : null}

        {firstLoad ? (
          <SkeletonGroup label="Loading your vault" style={styles.section}>
            <Skeleton height={168} radius={16} />
            <Skeleton height={56} radius={12} style={styles.skeletonGap} />
            <Skeleton height={56} radius={12} style={styles.skeletonGap} />
          </SkeletonGroup>
        ) : (
          <>
            {nextStep ? (
              <View style={[styles.readinessCard, styles.section]}>
                <View style={styles.readinessHeader}>
                  <Text style={styles.readinessTitle} accessibilityRole="header">Get your legacy ready</Text>
                  <Text style={styles.readinessCount}>{doneCount} of {steps.length} done</Text>
                </View>
                <View
                  style={styles.progressTrack}
                  accessible
                  accessibilityRole="progressbar"
                  accessibilityLabel="Setup progress"
                  accessibilityValue={{ min: 0, max: steps.length, now: doneCount }}
                >
                  <View style={[styles.progressFill, { width: `${(doneCount / steps.length) * 100}%` }]} />
                </View>

                <View style={styles.steps}>
                  {steps.map((step) => (
                    <Pressable
                      key={step.title}
                      accessibilityRole="button"
                      accessibilityLabel={`${step.title}. ${step.done ? 'Done' : 'Not done'}. ${step.detail}`}
                      onPress={step.go}
                      style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}
                    >
                      <View style={[styles.stepCircle, step.done && styles.stepCircleDone]}>
                        {step.done ? <AppIcon name="check" size={16} color={colors.neutral.white} strokeWidth={3} /> : null}
                      </View>
                      <View style={styles.stepBody}>
                        <Text style={[styles.stepTitle, step.done && styles.stepTitleDone]}>{step.title}</Text>
                        <Text style={styles.stepDetail}>{step.detail}</Text>
                      </View>
                      <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
                    </Pressable>
                  ))}
                </View>

                <Button title={nextStep.title} onPress={nextStep.go} size="md" style={styles.nextButton} />
              </View>
            ) : (
              <InlineNotice
                tone="success"
                title="Your legacy is set up"
                message={`${totalItems} ${totalItems === 1 ? 'item' : 'items'} saved and assigned. Your records are encrypted and stay private.`}
                style={styles.section}
              />
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Your legacy</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate({ pathname: '/(auth)/(tabs)/saved-items', params: { category: '' } })}
                style={styles.sectionLink}
              >
                <Text style={styles.sectionLinkText}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.group}>
              {CATEGORIES.map((category, index) => {
                const count = counts[category.id];
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${category.title}, ${count} ${count === 1 ? 'item' : 'items'}`}
                    onPress={() => router.navigate({ pathname: '/(auth)/(tabs)/saved-items', params: { category: category.id } })}
                    style={({ pressed }) => [styles.row, index < CATEGORIES.length - 1 && styles.rowDivider, pressed && styles.pressed]}
                  >
                    <View style={styles.rowIcon}>
                      <AppIcon name={category.icon} size={20} color={colors.primary.deepForest} />
                    </View>
                    <Text style={styles.rowTitle}>{category.title}</Text>
                    <Text style={styles.rowCount}>{count}</Text>
                    <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, styles.sectionHeaderSolo]} accessibilityRole="header">Trusted person</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={trustedPerson ? `Trusted person: ${trustedPerson.name}, ${trustedStatusLabel(trustedPerson.status)}` : 'Add a trusted person. Not set up yet'}
              onPress={() =>
                trustedPerson
                  ? router.push({ pathname: '/(auth)/trusted-person', params: { recipientId: trustedPerson.id } })
                  : router.push('/(auth)/trusted-person')
              }
              style={({ pressed }) => [styles.statusCard, !trustedPerson && styles.statusCardWarning, pressed && styles.pressed]}
            >
              <View style={[styles.statusIcon, !trustedPerson && styles.statusIconWarning]}>
                <AppIcon
                  name={trustedPerson ? 'userCheck' : 'userPlus'}
                  size={22}
                  color={trustedPerson ? colors.primary.deepForest : colors.semantic.warning}
                />
              </View>
              <View style={styles.statusBody}>
                <Text style={styles.statusTitle}>{trustedPerson ? trustedPerson.name : 'No trusted person yet'}</Text>
                <Text style={[styles.statusDetail, !trustedPerson && styles.statusDetailWarning]}>
                  {trustedPerson ? trustedStatusLabel(trustedPerson.status) : 'Add someone who can receive your legacy'}
                </Text>
              </View>
              <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
            </Pressable>

            <Text style={[styles.sectionTitle, styles.sectionHeaderSolo]} accessibilityRole="header">Check-ins</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/check-in-preferences' as never)}
              style={({ pressed }) => [styles.statusCard, !checkInStatus && styles.statusCardWarning, pressed && styles.pressed]}
            >
              <View style={[styles.statusIcon, !checkInStatus && styles.statusIconWarning]}>
                <AppIcon name="clock" size={22} color={checkInStatus ? colors.primary.deepForest : colors.semantic.warning} />
              </View>
              <View style={styles.statusBody}>
                <Text style={styles.statusTitle}>
                  {!checkInStatus ? 'Check-ins not set up' : checkInOpen ? (overdueDays > 0 ? 'Check-in overdue' : 'Check-in open') : 'You’re all set'}
                </Text>
                <Text style={[styles.statusDetail, !checkInStatus && styles.statusDetailWarning]}>
                  {!checkInStatus
                    ? 'Choose how often we check you’re active'
                    : checkInDate
                      ? `Next check-in: ${formatDate(checkInDate)}${!checkInOpen && opensAt ? ` · opens ${formatDate(opensAt.toISOString())}` : ''}`
                      : 'Schedule saved'}
                </Text>
              </View>
              <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function trustedStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INVITED':
      return 'Invitation sent';
    default:
      return 'Saved privately · not informed';
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'soon';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  header: {
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { fontFamily: typography.fonts.playfair.bold, fontSize: 20, letterSpacing: 3, color: colors.primary.deepForest },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  avatarButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.caption, color: colors.neutral.white },
  pressed: { opacity: 0.8 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },

  checkInBanner: { padding: 16, borderRadius: 16, backgroundColor: colors.primary.deepForest, marginBottom: 24, gap: 12 },
  bannerRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  overdueBanner: { backgroundColor: '#7A3B12' },
  reviewBanner: { backgroundColor: colors.semantic.error },
  reviewBannerText: { color: colors.neutral.white },
  sharedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.brand.mint,
    marginBottom: 24,
  },
  sharedTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, color: colors.neutral.textPrimary },
  sharedText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, color: colors.neutral.textSecondary },
  bannerBody: { flex: 1, gap: 2 },
  bannerTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.white },
  bannerText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.brand.mint },
  bannerError: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.caption, color: colors.semantic.errorSoft },
  bannerButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerButtonText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, color: colors.primary.deepForest },

  greeting: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  greetingSubtitle: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
  section: { marginTop: 20 },
  skeletonGap: { marginTop: 12 },

  readinessCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  readinessHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  readinessTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.title3,
    lineHeight: typography.lineHeights.title3,
    color: colors.neutral.textPrimary,
  },
  readinessCount: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.caption, color: colors.neutral.textSecondary },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.brand.sage, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary.forest },
  steps: { marginTop: 8 },
  stepRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: { backgroundColor: colors.semantic.success, borderColor: colors.semantic.success },
  stepBody: { flex: 1 },
  stepTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, lineHeight: 22, color: colors.neutral.textPrimary },
  stepTitleDone: { color: colors.neutral.textSecondary },
  stepDetail: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textMuted },
  nextButton: { marginTop: 12 },

  sectionHeader: { marginTop: 28, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderSolo: { marginTop: 28, marginBottom: 8 },
  sectionTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.title3,
    lineHeight: typography.lineHeights.title3,
    color: colors.neutral.textPrimary,
  },
  sectionLink: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  sectionLinkText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, color: colors.primary.forest },

  group: {
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    overflow: 'hidden',
  },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral.border },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { flex: 1, fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, color: colors.neutral.textPrimary },
  rowCount: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, color: colors.neutral.textSecondary },

  statusCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  statusCardWarning: { backgroundColor: colors.semantic.warningSoft, borderColor: colors.semantic.warningBorder },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconWarning: { backgroundColor: colors.neutral.white },
  statusBody: { flex: 1, gap: 2 },
  statusTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  statusDetail: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  statusDetailWarning: { color: colors.semantic.warning },
});
