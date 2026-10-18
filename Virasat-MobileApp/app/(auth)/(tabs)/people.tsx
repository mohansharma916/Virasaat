import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { inviteRecipient, listRecipients, type Recipient } from '@/src/api/recipients.api';
import { TextLink } from '@/src/components/TextLink';
import { haptics } from '@/src/utils/haptics';
import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { UpgradeModal } from '@/src/components/UpgradeModal';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useSubscription } from '@/src/store/subscription.slice';
import { PlanLimit } from '@/src/types/subscription.types';

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: 'Active', bg: colors.semantic.successSoft, fg: colors.semantic.success },
  PRIVATE: { label: 'Private', bg: colors.neutral.sunken, fg: colors.neutral.textSecondary },
  REVOKED: { label: 'Removed', bg: colors.semantic.errorSoft, fg: colors.semantic.error },
  INVITED: { label: 'Invited', bg: colors.semantic.warningSoft, fg: colors.semantic.warning },
};

export default function PeopleScreen() {
  const { currentPlan, getLimit } = useSubscription();
  const [people, setPeople] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState('');
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  const load = useCallback(async (mode: 'focus' | 'pull' = 'focus') => {
    if (mode === 'pull') setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setPeople(await listRecipients());
      setLoaded(true);
    } catch (reason: unknown) {
      setError(getApiErrorMessage(reason, 'We couldn’t load your trusted people. Check your connection and try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const activePeople = people.filter((person) => person.status !== 'REVOKED');
  const trustedPersonLimit = getLimit(PlanLimit.TRUSTED_PERSONS) ?? 1;
  const isOverLimit = activePeople.length > trustedPersonLimit;
  const isAtAllowedLimit = activePeople.length >= trustedPersonLimit;
  const planName = currentPlan?.name ?? 'Starter';
  const limitText = `${trustedPersonLimit} trusted ${trustedPersonLimit === 1 ? 'person' : 'people'}`;

  const invite = async (person: Recipient) => {
    if (inviting) return;
    setInviting(person.id);
    setError('');
    setInviteNotice('');
    try {
      const updated = await inviteRecipient(person.id);
      setPeople((current) => current.map((entry) => (entry.id === person.id ? { ...entry, ...updated } : entry)));
      setInviteNotice(`We emailed ${person.name} an invitation.`);
      haptics.success();
    } catch (reason) {
      haptics.error();
      setError(getApiErrorMessage(reason, 'We couldn’t send the invitation. Try again.'));
    } finally {
      setInviting(null);
    }
  };

  const handleAddPerson = () => {
    if (isAtAllowedLimit) {
      setUpgradeModalVisible(true);
    } else {
      router.push('/(auth)/trusted-person');
    }
  };

  const showSkeleton = loading && !loaded;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load('pull')} tintColor={colors.primary.forest} colors={[colors.primary.forest]} />
        }
      >
        <Text style={styles.title} accessibilityRole="header">Trusted people</Text>
        <Text style={styles.subtitle}>
          They only get access when your release rules are met. Adding someone doesn’t notify them.
        </Text>

        {isOverLimit ? (
          <InlineNotice
            tone="warning"
            title={`Your ${planName} plan includes ${limitText}`}
            message="Everyone you added is kept. To add someone new, remove a person or change your plan."
            actionLabel="See plans"
            onAction={() => router.push('/(auth)/plans' as never)}
            style={styles.notice}
          />
        ) : null}

        {inviteNotice ? <InlineNotice tone="success" message={inviteNotice} style={styles.inviteNotice} /> : null}
        {error ? (
          <InlineNotice tone="danger" message={error} actionLabel="Try again" onAction={() => void load()} style={styles.notice} />
        ) : null}

        {showSkeleton ? (
          <SkeletonGroup label="Loading trusted people" style={styles.list}>
            {[0, 1].map((key) => (
              <View key={key} style={styles.skeletonCard}>
                <Skeleton width={48} height={48} radius={24} />
                <View style={styles.skeletonText}>
                  <Skeleton width="60%" height={18} />
                  <Skeleton width="80%" height={14} />
                </View>
              </View>
            ))}
          </SkeletonGroup>
        ) : null}

        {loaded && !error && people.length === 0 ? (
          <EmptyState
            icon="users"
            title="No trusted people yet"
            message="Add family members or advisers who should receive parts of your legacy."
          />
        ) : null}

        <View style={styles.list}>
          {people.map((person) => {
            const badge = STATUS[person.status] ?? STATUS.PRIVATE;
            const initials = (person.name || '?')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <Pressable
                key={person.id}
                accessibilityRole="button"
                accessibilityLabel={`${person.name}, ${badge.label}`}
                accessibilityHint="Opens their details"
                style={({ pressed }) => [styles.personCard, pressed && styles.cardPressed]}
                onPress={() => router.push({ pathname: '/(auth)/trusted-person', params: { recipientId: person.id } })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                <View style={styles.personInfo}>
                  <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>
                  {person.email ? <Text style={styles.personDetail} numberOfLines={1}>{person.email}</Text> : null}
                  <View style={styles.tags}>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
                    </View>
                    <View style={styles.verifyTag}>
                      <AppIcon name={person.verificationRequired ? 'verified' : 'user'} size={16} color={colors.neutral.textSecondary} />
                      <Text style={styles.verifyText}>{person.verificationRequired ? 'ID check required' : 'No ID check'}</Text>
                    </View>
                  </View>
                  {person.status === 'PRIVATE' || person.status === 'INVITED' ? (
                    <TextLink
                      title={inviting === person.id ? 'Sending…' : person.status === 'PRIVATE' ? 'Send invitation' : 'Resend invitation'}
                      onPress={() => void invite(person)}
                      disabled={inviting !== null}
                      accessibilityHint={`Emails ${person.name} that you chose them as a trusted person`}
                      style={styles.inviteLink}
                    />
                  ) : null}
                </View>

                <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ActionBar aboveTabBar>
        <Button title="Add trusted person" onPress={handleAddPerson} icon={<AppIcon name="userPlus" size={20} color={colors.neutral.white} />} />
      </ActionBar>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        title="You’ve reached your plan’s limit"
        message={`Your ${planName} plan includes ${limitText}. Secure will include up to 3, and Family up to 8.`}
        benefits={[
          'Up to 3 trusted people on Secure',
          'Up to 8 trusted people on Family',
          'Assign individual items to specific people',
        ]}
        onCtaPress={() => router.push('/(auth)/plans' as never)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inviteLink: { alignSelf: 'flex-start', marginTop: 6 },
  inviteNotice: { marginBottom: 12 },
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 },
  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
  notice: { marginBottom: 16 },
  list: { gap: 12 },
  skeletonCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  skeletonText: { flex: 1, gap: 8, justifyContent: 'center' },
  personCard: {
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
  cardPressed: { backgroundColor: colors.brand.mint },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, color: colors.primary.deepForest },
  personInfo: { flex: 1, gap: 2 },
  personName: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textPrimary,
  },
  personDetail: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
  tags: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.micro, lineHeight: 16 },
  verifyTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifyText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.micro,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },
});
