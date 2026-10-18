import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { AppIcon } from '@/src/components/AppIcon';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { listReviewCases, REVIEW_STATUS_LABEL as STATUS_LABEL, type ReviewCaseStatus, type ReviewCaseSummary } from '@/src/api/admin.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const FILTERS: { label: string; status?: ReviewCaseStatus }[] = [
  { label: 'To review', status: 'UNDER_REVIEW' },
  { label: 'Waiting', status: 'OPEN' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'All' },
];

/** Release cases for Virasat reviewers. The server refuses anyone else. */
export default function AdminCasesScreen() {
  const [filter, setFilter] = useState(0);
  const [cases, setCases] = useState<ReviewCaseSummary[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setCases(await listReviewCases(FILTERS[filter].status));
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'We couldn’t load release cases.'));
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { setCases(null); void load(); }, [load]));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView
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
        <Text style={styles.title} accessibilityRole="header">Release reviews</Text>
        <Text style={styles.subtitle}>Approve a release only when you are confident the owner can no longer check in.</Text>

        <View style={styles.filters} accessibilityRole="tablist">
          {FILTERS.map((option, index) => (
            <Pressable
              key={option.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === index }}
              onPress={() => setFilter(index)}
              style={[styles.chip, filter === index && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === index && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <InlineNotice tone="danger" message={error} actionLabel="Try again" onAction={() => void load()} style={styles.gap} /> : null}
        {!cases && !error ? (
          <SkeletonGroup label="Loading cases">
            <Skeleton height={76} radius={16} style={styles.gap} />
            <Skeleton height={76} radius={16} style={styles.gap} />
          </SkeletonGroup>
        ) : null}
        {cases && !cases.length ? <InlineNotice tone="info" message="No cases here." style={styles.gap} /> : null}

        <View style={styles.list}>
          {cases?.map((releaseCase) => (
            <Pressable
              key={releaseCase.id}
              accessibilityRole="button"
              accessibilityLabel={`${releaseCase.ownerName}. ${STATUS_LABEL[releaseCase.status]}`}
              onPress={() => router.push({ pathname: '/(auth)/admin-case', params: { id: releaseCase.id } } as never)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.body}>
                <Text style={styles.rowTitle}>{releaseCase.ownerName}</Text>
                <Text style={styles.rowMeta}>
                  {STATUS_LABEL[releaseCase.status]} · {releaseCase.statementCount} {releaseCase.statementCount === 1 ? 'statement' : 'statements'}
                  {releaseCase.openedAt ? ` · opened ${new Date(releaseCase.openedAt).toLocaleDateString()}` : ''}
                </Text>
              </View>
              <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
  },
  chipActive: { backgroundColor: colors.primary.deepForest, borderColor: colors.primary.deepForest },
  chipText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.caption, color: colors.neutral.textPrimary },
  chipTextActive: { color: colors.neutral.white },
  gap: { marginTop: 16 },
  list: { marginTop: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  body: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, color: colors.neutral.textPrimary },
  rowMeta: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  pressed: { opacity: 0.85 },
});
