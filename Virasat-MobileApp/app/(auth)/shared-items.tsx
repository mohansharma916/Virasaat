import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AppIcon } from '@/src/components/AppIcon';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ItemThumbnail, itemTypeIcon } from '@/src/components/ItemThumbnail';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { listReleasedItems, type SharedItem } from '@/src/api/shared.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const TYPE_LABEL: Record<SharedItem['type'], string> = {
  TEXT: 'Message', FINANCIAL: 'Financial asset', DOCUMENT: 'Document', IMAGE: 'Image', VIDEO: 'Video', OTHER: 'Other',
};

/** The items one owner released to this user. */
export default function SharedItemsScreen() {
  const { caseId, owner } = useLocalSearchParams<{ caseId?: string; owner?: string }>();
  const [items, setItems] = useState<SharedItem[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    if (!caseId || !/^[0-9a-f-]{36}$/i.test(caseId)) {
      setError('This link is invalid.');
      return;
    }
    void listReleasedItems(caseId)
      .then((result) => { if (active) setItems(result); })
      .catch((reason) => { if (active) setError(getApiErrorMessage(reason, 'We couldn’t load these items. Try again.')); });
    return () => { active = false; };
  }, [caseId, retry]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">{owner ? `From ${owner}` : 'Left for you'}</Text>
        <Text style={styles.subtitle}>They chose these for you. Open each one to read, watch or save it.</Text>

        {error ? <InlineNotice tone="danger" message={error} actionLabel="Try again" onAction={() => setRetry((v) => v + 1)} style={styles.gap} /> : null}
        {!items && !error ? (
          <SkeletonGroup label="Loading items">
            <Skeleton height={72} radius={16} style={styles.gap} />
            <Skeleton height={72} radius={16} style={styles.gap} />
          </SkeletonGroup>
        ) : null}
        {items && !items.length ? <InlineNotice tone="info" message="There are no items for you in this release." style={styles.gap} /> : null}

        <View style={styles.list}>
          {items?.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${TYPE_LABEL[item.type]}`}
              onPress={() => router.push({ pathname: '/(auth)/saved-item', params: { id: item.id, shared: '1', owner: owner ?? '' } } as never)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <ItemThumbnail itemId={item.id} hasThumbnail={item.hasThumbnail} shared icon={itemTypeIcon(item.type)} size={52} />
              <View style={styles.body}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowMeta}>{TYPE_LABEL[item.type]}</Text>
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
  gap: { marginTop: 16 },
  list: { marginTop: 20, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  body: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.callout,
    color: colors.neutral.textPrimary,
  },
  rowMeta: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    color: colors.neutral.textSecondary,
  },
  pressed: { opacity: 0.85 },
});
