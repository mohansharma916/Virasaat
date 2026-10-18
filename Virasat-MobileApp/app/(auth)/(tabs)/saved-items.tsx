import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { EmptyState } from '@/src/components/EmptyState';
import { IconButton } from '@/src/components/IconButton';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import type { LegacyItemType } from '@/src/api/vault.api';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';
import { ItemThumbnail } from '@/src/components/ItemThumbnail';
import { LEGACY_CATEGORY_KEYS, parseLegacyCategories, type LegacyCategory } from '@/src/utils/legacy-flow';

const CATEGORY_LABEL: Record<LegacyCategory, string> = {
  DOCUMENTS: 'Documents',
  INVESTMENTS: 'Investments',
  MESSAGES: 'Messages',
  VIDEOS: 'Videos',
  OTHER: 'Other',
};

const CATEGORY_ICON: Record<LegacyCategory, IconName> = {
  DOCUMENTS: 'document',
  INVESTMENTS: 'investment',
  MESSAGES: 'message',
  VIDEOS: 'video',
  OTHER: 'folder',
};

const TYPE_META: Record<LegacyItemType, { label: string; icon: IconName }> = {
  TEXT: { label: 'Message', icon: 'message' },
  FINANCIAL: { label: 'Financial asset', icon: 'investment' },
  DOCUMENT: { label: 'Document', icon: 'document' },
  IMAGE: { label: 'Image', icon: 'image' },
  VIDEO: { label: 'Video', icon: 'video' },
  OTHER: { label: 'Other', icon: 'folder' },
};

export default function SavedItemsScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const initialCategory = parseLegacyCategories(params.category)[0] ?? null;
  const [category, setCategory] = useState<LegacyCategory | null>(initialCategory);
  const [lastParam, setLastParam] = useState(params.category);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.vault);

  // Home links here with a category; follow it when the param changes.
  if (params.category !== lastParam) {
    setLastParam(params.category);
    setCategory(parseLegacyCategories(params.category)[0] ?? null);
  }

  const refresh = useCallback(async () => {
    setRefreshError('');
    try {
      await dispatch(refreshVaultData()).unwrap();
    } catch {
      setRefreshError('We couldn’t refresh your saved items. Check your connection and try again.');
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) => (!category || item.category === category) && (!q || item.title.toLowerCase().includes(q)),
    );
  }, [items, category, query]);

  const addItem = () =>
    category === 'VIDEOS'
      ? router.push('/(auth)/legacy-video-message' as never)
      : router.push({
          pathname: '/(auth)/legacy-category',
          params: { categories: category ?? LEGACY_CATEGORY_KEYS.join(','), add: 'true' },
        } as never);

  const firstLoad = status === 'loading' && items.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">Vault</Text>
        <IconButton icon="plus" accessibilityLabel="Add an item" onPress={addItem} />
      </View>

      <View style={styles.searchBox}>
        <AppIcon name="search" size={20} color={colors.neutral.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your vault"
          placeholderTextColor={colors.neutral.textMuted}
          accessibilityLabel="Search your vault"
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroller}>
        {[null, ...LEGACY_CATEGORY_KEYS].map((key) => {
          const selected = category === key;
          const label = key ? CATEGORY_LABEL[key] : 'All';
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Show ${label.toLowerCase()}`}
              onPress={() => setCategory(key)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
            tintColor={colors.primary.forest}
            colors={[colors.primary.forest]}
          />
        }
      >
        {refreshError ? (
          <InlineNotice tone="danger" message={refreshError} actionLabel="Try again" onAction={() => void refresh()} style={styles.notice} />
        ) : null}

        {firstLoad ? (
          <SkeletonGroup label="Loading your vault" style={styles.list}>
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} height={72} radius={16} />
            ))}
          </SkeletonGroup>
        ) : null}

        {!firstLoad && visibleItems.length === 0 ? (
          query.trim() ? (
            <EmptyState icon="help" title="No matches" message={`Nothing in your vault matches “${query.trim()}”.`} />
          ) : (
            <EmptyState
              icon={category ? CATEGORY_ICON[category] : 'shield'}
              title={category ? `No ${CATEGORY_LABEL[category].toLowerCase()} yet` : 'Your vault is empty'}
              message="Everything you save is encrypted and stays private until your release rules say otherwise."
              actionLabel={category === 'VIDEOS' ? 'Record a video message' : 'Add your first item'}
              onAction={addItem}
            />
          )
        ) : null}

        <View style={styles.list}>
          {visibleItems.map((item) => {
            const meta = TYPE_META[item.type] ?? TYPE_META.OTHER;
            const updated = new Date(item.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${meta.label}. Updated ${updated}. ${item.assignment ? 'Assigned to a person' : 'Not assigned yet'}`}
                onPress={() => router.push({ pathname: '/(auth)/saved-item', params: { id: item.id } } as never)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <ItemThumbnail itemId={item.id} hasThumbnail={item.hasThumbnail} icon={meta.icon} size={52} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>{meta.label} · Updated {updated}</Text>
                  <View style={styles.assignTag}>
                    <AppIcon
                      name={item.assignment ? 'userCheck' : 'user'}
                      size={14}
                      color={item.assignment ? colors.semantic.success : colors.semantic.warning}
                    />
                    <Text style={[styles.assignText, !item.assignment && styles.assignTextWarning]}>
                      {item.assignment ? 'Assigned' : 'Not assigned'}
                    </Text>
                  </View>
                </View>
                <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  titleRow: { paddingLeft: 16, paddingRight: 8, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  searchBox: {
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.control,
    backgroundColor: colors.neutral.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    color: colors.neutral.textPrimary,
  },
  chipScroller: { flexGrow: 0 },
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.control,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary.deepForest, borderColor: colors.primary.deepForest },
  chipText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.label, color: colors.neutral.textPrimary },
  chipTextSelected: { color: colors.neutral.white },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  notice: { marginBottom: 12 },
  list: { gap: 12 },
  row: {
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
  pressed: { backgroundColor: colors.brand.mint },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  rowMeta: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  assignTag: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.micro, lineHeight: 16, color: colors.semantic.success },
  assignTextWarning: { color: colors.semantic.warning },
});
