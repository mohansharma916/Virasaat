import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { FormScrollView } from '@/src/components/FormScrollView';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import {
  getSharedOverview,
  respondToInvitation,
  submitReleaseStatement,
  type SharedOverview,
} from '@/src/api/shared.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Everything other people shared with you as their trusted person. */
export default function SharedWithMeScreen() {
  const [overview, setOverview] = useState<SharedOverview | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [statements, setStatements] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setOverview(await getSharedOverview());
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'We couldn’t load what was shared with you. Try again.'));
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const respond = async (recipientId: string, accept: boolean) => {
    if (busy) return;
    setBusy(recipientId);
    setError('');
    try {
      await respondToInvitation(recipientId, accept);
      haptics.success();
      setNotice(accept ? 'You accepted. We’ll email you if you’re ever needed.' : 'You declined. They won’t be told why.');
      await load();
    } catch (reason) {
      haptics.error();
      setError(getApiErrorMessage(reason, 'We couldn’t save your answer. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const sendStatement = async (caseId: string) => {
    const text = statements[caseId]?.trim();
    if (!text || busy) return;
    setBusy(caseId);
    setError('');
    try {
      await submitReleaseStatement(caseId, text);
      haptics.success();
      setNotice('Thank you. Virasat will review this and contact you.');
      setStatements((current) => ({ ...current, [caseId]: '' }));
      await load();
    } catch (reason) {
      haptics.error();
      setError(getApiErrorMessage(reason, 'We couldn’t send your statement. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const empty = overview && !overview.invitations.length && !overview.cases.length && !overview.releases.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <FormScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            tintColor={colors.primary.forest}
            colors={[colors.primary.forest]}
          />
        }
      >
        <Text style={styles.title} accessibilityRole="header">Shared with you</Text>
        <Text style={styles.subtitle}>People who chose you as their trusted person, and anything they left for you.</Text>

        {error ? <InlineNotice tone="danger" message={error} actionLabel="Try again" onAction={() => void load()} style={styles.gap} /> : null}
        {notice ? <InlineNotice tone="success" message={notice} style={styles.gap} /> : null}

        {!overview && !error ? (
          <SkeletonGroup label="Loading">
            <Skeleton height={110} radius={16} style={styles.gap} />
            <Skeleton height={110} radius={16} style={styles.gap} />
          </SkeletonGroup>
        ) : null}

        {empty ? (
          <View style={styles.emptyCard}>
            <AppIcon name="users" size={28} color={colors.primary.deepForest} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>
              When someone adds you as their trusted person with this email address, you’ll see it here.
            </Text>
          </View>
        ) : null}

        {overview?.releases.length ? (
          <>
            <Text style={styles.sectionTitle} accessibilityRole="header">Left for you</Text>
            {overview.releases.map((release) => (
              <Pressable
                key={release.caseId}
                accessibilityRole="button"
                accessibilityLabel={`Items from ${release.ownerName}`}
                onPress={() => router.push({ pathname: '/(auth)/shared-items', params: { caseId: release.caseId, owner: release.ownerName } } as never)}
                style={({ pressed }) => [styles.card, styles.row, pressed && styles.pressed]}
              >
                <View style={styles.icon}><AppIcon name="heart" size={22} color={colors.primary.deepForest} /></View>
                <View style={styles.body}>
                  <Text style={styles.cardTitle}>From {release.ownerName}</Text>
                  <Text style={styles.cardText}>Available until {formatDate(release.expiresAt)}</Text>
                </View>
                <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
              </Pressable>
            ))}
          </>
        ) : null}

        {overview?.cases.length ? (
          <>
            <Text style={styles.sectionTitle} accessibilityRole="header">Needs your help</Text>
            {overview.cases.map((releaseCase) => (
              <View key={releaseCase.caseId} style={styles.card}>
                <Text style={styles.cardTitle}>We can’t reach {releaseCase.ownerName}</Text>
                {releaseCase.statementSubmittedAt ? (
                  <Text style={styles.cardText}>
                    You responded on {formatDate(releaseCase.statementSubmittedAt)}. Virasat is reviewing. You can update what you wrote below.
                  </Text>
                ) : (
                  <Text style={styles.cardText}>
                    They haven’t checked in for a long time. Tell us who you are and what you know, for example if something has happened to them. Virasat reviews every case before anything is released.
                  </Text>
                )}
                <Input
                  label="Your statement"
                  multiline
                  maxLength={2000}
                  value={statements[releaseCase.caseId] ?? ''}
                  onChangeText={(text) => setStatements((current) => ({ ...current, [releaseCase.caseId]: text }))}
                  placeholder="I’m their brother. They passed away on…"
                  editable={busy !== releaseCase.caseId}
                  style={styles.statement}
                />
                <Button
                  title={releaseCase.statementSubmittedAt ? 'Update statement' : 'Send to Virasat'}
                  size="md"
                  onPress={() => void sendStatement(releaseCase.caseId)}
                  loading={busy === releaseCase.caseId}
                  disabled={!statements[releaseCase.caseId]?.trim()}
                />
              </View>
            ))}
          </>
        ) : null}

        {overview?.invitations.length ? (
          <>
            <Text style={styles.sectionTitle} accessibilityRole="header">Invitations</Text>
            {overview.invitations.map((invitation) => (
              <View key={invitation.recipientId} style={styles.card}>
                <Text style={styles.cardTitle}>{invitation.ownerName} chose you as a trusted person</Text>
                <Text style={styles.cardText}>
                  {invitation.relationship ? `As their ${invitation.relationship.toLowerCase()}, you` : 'You'} may one day receive messages or documents they leave for you. You can’t see anything now; Virasat contacts you only if they stop checking in.
                </Text>
                <View style={styles.actions}>
                  <Button title="Accept" size="md" onPress={() => void respond(invitation.recipientId, true)} loading={busy === invitation.recipientId} style={styles.action} />
                  <Button title="Decline" variant="secondary" size="md" onPress={() => void respond(invitation.recipientId, false)} disabled={busy === invitation.recipientId} style={styles.action} />
                </View>
              </View>
            ))}
          </>
        ) : null}
      </FormScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  gap: { marginTop: 16 },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 10,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    color: colors.neutral.textSecondary,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: 12,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  cardTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.callout,
    lineHeight: 22,
    color: colors.neutral.textPrimary,
  },
  cardText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: 20,
    color: colors.neutral.textSecondary,
  },
  statement: { minHeight: 110, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  pressed: { opacity: 0.85 },
  emptyCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.callout,
    color: colors.neutral.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: 20,
    color: colors.neutral.textSecondary,
  },
});
