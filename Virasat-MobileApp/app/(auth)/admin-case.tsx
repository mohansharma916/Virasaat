import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { Button } from '@/src/components/Button';
import { FormScrollView } from '@/src/components/FormScrollView';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { decideReviewCase, getReviewCase, recordReviewVisit, REVIEW_STATUS_LABEL as STATUS_LABEL, type ReviewCaseDetail } from '@/src/api/admin.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** One release case. Reviewers see who and why, never vault contents. */
export default function AdminCaseScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [detail, setDetail] = useState<ReviewCaseDetail | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');

  const saveVisit = async () => {
    if (!detail || busy || !visitNotes.trim()) return;
    setBusy(true);
    setError('');
    try {
      setDetail(await recordReviewVisit(detail.id, visitNotes));
      setVisitNotes('');
      haptics.success();
    } catch (reason) {
      haptics.error();
      setError(getApiErrorMessage(reason, 'We couldn’t save the visit.'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void getReviewCase(id)
      .then(setDetail)
      .catch((reason) => setError(getApiErrorMessage(reason, 'We couldn’t load this case.')));
  }, [id]);

  const decide = (decision: 'approve' | 'reject') => {
    if (!detail || busy) return;
    const approve = decision === 'approve';
    Alert.alert(
      approve ? 'Release items?' : 'Reject this release?',
      approve
        ? 'The trusted people listed will be able to open the items assigned to them. The owner can still cancel by checking in.'
        : 'Nothing will be released. If the owner still doesn’t check in, a new review can open later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approve ? 'Approve release' : 'Reject',
          style: approve ? 'default' : 'destructive',
          onPress: async () => {
            setBusy(true);
            setError('');
            try {
              setDetail(await decideReviewCase(detail.id, decision, notes));
              haptics.success();
            } catch (reason) {
              haptics.error();
              setError(getApiErrorMessage(reason, 'We couldn’t save this decision.'));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const open = detail && (detail.status === 'OPEN' || detail.status === 'UNDER_REVIEW');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <FormScrollView contentContainerStyle={styles.content}>
        {!detail && !error ? (
          <SkeletonGroup label="Loading case">
            <Skeleton height={34} width="60%" />
            <Skeleton height={160} radius={16} style={styles.gap} />
          </SkeletonGroup>
        ) : null}
        {error ? <InlineNotice tone="danger" message={error} style={styles.gap} /> : null}

        {detail ? (
          <>
            <Text style={styles.title} accessibilityRole="header">{detail.owner?.name ?? 'Deleted account'}</Text>
            <Text style={styles.meta}>{STATUS_LABEL[detail.status]}{detail.owner ? ` · ${detail.owner.email}` : ''}</Text>

            <View style={styles.card}>
              <Fact label="Overdue" value={detail.overdueDays != null ? `${detail.overdueDays} days` : '—'} />
              <Fact label="Check-in was due" value={formatDate(detail.dueAt)} />
              <Fact label="Last check-in" value={formatDate(detail.lastCheckInAt)} />
              <Fact label="Case opened" value={formatDate(detail.openedAt)} />
              {detail.owner?.phone ? <Fact label="Owner phone" value={detail.owner.phone} /> : null}
              {detail.note ? <Fact label="Note" value={detail.note} /> : null}
            </View>

            {detail.inPersonVisit?.required ? (
              <>
                <Text style={styles.sectionTitle}>In-person visit (Family plan)</Text>
                <View style={styles.card}>
                  {detail.inPersonVisit.completedAt ? (
                    <>
                      <Fact label="Visited" value={formatDate(detail.inPersonVisit.completedAt)} />
                      <Text selectable style={styles.statementText}>{detail.inPersonVisit.notes}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.personMeta}>
                        Visit the owner{detail.owner?.phone ? ` (phone ${detail.owner.phone})` : ''} or their family before approving. Approval stays locked until the visit is recorded.
                      </Text>
                      {open ? (
                        <>
                          <Input
                            label="What you found"
                            multiline
                            maxLength={2000}
                            value={visitNotes}
                            onChangeText={setVisitNotes}
                            placeholder="Date, address, who you met, what you saw…"
                            style={styles.notes}
                          />
                          <Button title="Record visit" size="md" variant="secondary" onPress={() => void saveVisit()} loading={busy} disabled={!visitNotes.trim()} />
                        </>
                      ) : null}
                    </>
                  )}
                </View>
              </>
            ) : null}

            <Text style={styles.sectionTitle}>Trusted people</Text>
            {detail.recipients.map((person) => (
              <View key={person.id} style={styles.card}>
                <Text style={styles.personName}>{person.name}{person.relationship ? ` · ${person.relationship}` : ''}</Text>
                <Text style={styles.personMeta}>
                  {person.email} · {person.assignedItems} assigned {person.assignedItems === 1 ? 'item' : 'items'}
                  {person.verificationRequired ? ' · identity check required' : ''}
                  {person.authorized ? ' · has access' : ''}
                </Text>
                {person.statement ? (
                  <View style={styles.statement}>
                    <Text style={styles.statementLabel}>Statement · {formatDate(person.statementSubmittedAt)}</Text>
                    <Text selectable style={styles.statementText}>{person.statement}</Text>
                  </View>
                ) : (
                  <Text style={styles.personMeta}>No statement yet.</Text>
                )}
              </View>
            ))}

            {detail.reviewerNotes ? (
              <InlineNotice tone="info" title="Reviewer notes" message={detail.reviewerNotes} style={styles.gap} />
            ) : null}

            {open ? (
              <Input
                label="Review notes"
                required={false}
                multiline
                maxLength={2000}
                value={notes}
                onChangeText={setNotes}
                placeholder="How you confirmed the statement, who you spoke to…"
                style={styles.notes}
              />
            ) : null}
          </>
        ) : null}
      </FormScrollView>

      {open ? (
        <ActionBar>
          <Button title="Approve release" onPress={() => decide('approve')} loading={busy} />
          <Button title="Reject" variant="destructiveOutline" onPress={() => decide('reject')} disabled={busy} />
        </ActionBar>
      ) : null}
    </SafeAreaView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
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
  meta: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    color: colors.neutral.textSecondary,
  },
  gap: { marginTop: 16 },
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    gap: 8,
  },
  sectionTitle: {
    marginTop: 24,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    color: colors.neutral.textSecondary,
  },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factLabel: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, color: colors.neutral.textSecondary },
  factValue: { flexShrink: 1, textAlign: 'right', fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.caption, color: colors.neutral.textPrimary },
  personName: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, color: colors.neutral.textPrimary },
  personMeta: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  statement: { padding: 12, borderRadius: 12, backgroundColor: colors.brand.mint, gap: 4 },
  statementLabel: { fontFamily: typography.fonts.inter.medium, fontSize: 12, color: colors.neutral.textSecondary },
  statementText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  notes: { minHeight: 90, textAlignVertical: 'top' },
});
