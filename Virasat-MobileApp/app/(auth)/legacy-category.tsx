import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StepProgress } from '@/src/components/StepProgress';
import { LEGACY_CATEGORIES, type LegacyCategoryInfo } from '@/src/utils/legacy-categories';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { LEGACY_CATEGORY_KEYS,
  parseLegacyCategories,
  type LegacyCategory, } from '@/src/utils/legacy-flow';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';

type CategoryConfig = LegacyCategoryInfo & { route: string };

const CATEGORY_ROUTES: Record<LegacyCategory, string> = {
  DOCUMENTS: '/(auth)/legacy-documents',
  INVESTMENTS: '/(auth)/legacy-investments',
  MESSAGES: '/(auth)/legacy-message',
  VIDEOS: '/(auth)/legacy-video-message',
  OTHER: '/(auth)/legacy-documents',
};

const CATEGORY_CONFIG: CategoryConfig[] = LEGACY_CATEGORIES.map((category) => ({
  ...category,
  route: CATEGORY_ROUTES[category.id],
}));

export default function LegacyCategoryScreen() {
  const dispatch = useAppDispatch();
  const savedItems = useAppSelector((state) => state.vault.items);
  const params = useLocalSearchParams<{
    categories?: string | string[];
    add?: string;
  }>();

  const selectedCategories = useMemo(
    () => {
      const parsedCategories = parseLegacyCategories(params.categories);
      return parsedCategories.length > 0
        ? parsedCategories
        : LEGACY_CATEGORY_KEYS;
    },
    [params.categories],
  );

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of savedItems) counts.set(item.category.toUpperCase(), (counts.get(item.category.toUpperCase()) ?? 0) + 1);
    return counts;
  }, [savedItems]);

  const savedCategories = useMemo(
    () => new Set(savedItems.map((item) => item.category.toUpperCase())),
    [savedItems],
  );

  const completedCategories = useMemo(
    () =>
      selectedCategories.filter(
        (category) =>
          savedCategories.has(category),
      ),
    [savedCategories, selectedCategories],
  );

  /*
   * Refresh completion state every time this hub becomes active.
   * Each category screen marks itself complete after a successful save.
   */
  useFocusEffect(
    useCallback(() => {
      void dispatch(refreshVaultData());
    }, [dispatch]),
  );

  const openCategory = (category: CategoryConfig) => {
    router.push({
      pathname: completedCategories.includes(category.id) && params.add !== 'true' ? '/(auth)/(tabs)/saved-items' : category.route,
      params: {
        category: category.id,
        categories: selectedCategories.join(','),
      },
    } as never);
  };

  const allComplete =
    selectedCategories.length > 0 &&
    selectedCategories.every((category) =>
      completedCategories.includes(category),
    );

  const completedCount = completedCategories.filter((category) =>
    selectedCategories.includes(category),
  ).length;

  const handleReview = () => {
    if (completedCount === 0) {
      return;
    }

    router.push({
      pathname: '/(auth)/legacy-review',
      params: {
        categories: selectedCategories.join(','),
      },
    } as never);
  };

  const onboarding = params.add !== 'true';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {onboarding ? <StepProgress phase="Legacy" /> : null}

        <Text style={[styles.title, onboarding && styles.titleOnboarding]} accessibilityRole="header">
          {onboarding ? 'Let’s preserve what matters' : 'Add to your vault'}
        </Text>
        <Text style={styles.subtitle}>
          {onboarding ? 'Add something to each category you chose. You’ll come back here after each one.' : 'Choose what you’d like to add.'}
        </Text>

        {onboarding ? (
          <View
            style={styles.progressRow}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${completedCount} of ${selectedCategories.length} categories done`}
            accessibilityValue={{ min: 0, max: selectedCategories.length, now: completedCount }}
          >
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: selectedCategories.length > 0 ? `${Math.round((completedCount / selectedCategories.length) * 100)}%` : '0%' },
                ]}
              />
            </View>
            <Text style={styles.progressCount}>
              {completedCount} of {selectedCategories.length} done
            </Text>
          </View>
        ) : null}

        <View style={styles.categories}>
          {CATEGORY_CONFIG.filter((category) => selectedCategories.includes(category.id)).map((category) => {
            const complete = completedCategories.includes(category.id);
            const count = countByCategory.get(category.id) ?? 0;
            const status = complete ? `${count} added` : 'Not started';

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${category.title}. ${status}`}
                accessibilityHint={complete && onboarding ? 'Opens what you’ve saved' : 'Opens a form to add one'}
                key={category.id}
                onPress={() => openCategory(category)}
                style={({ pressed }) => [styles.categoryCard, complete && styles.categoryCardComplete, pressed && styles.pressed]}
              >
                <View style={[styles.iconContainer, complete && styles.iconContainerComplete]}>
                  <AppIcon name={complete ? 'check' : category.icon} size={22} color={complete ? colors.neutral.white : colors.primary.deepForest} />
                </View>

                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                  <View style={[styles.statusChip, complete && styles.statusChipComplete]}>
                    <Text style={[styles.statusText, complete && styles.statusTextComplete]}>{status}</Text>
                  </View>
                </View>

                <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
              </Pressable>
            );
          })}
        </View>

        <InlineNotice
          tone="brand"
          title="Private by design"
          message="Everything you add stays private until your release rules are met."
        />
      </ScrollView>

      {onboarding ? (
        <ActionBar>
          <Button
            title={allComplete ? 'Review my legacy' : `Review my legacy (${completedCount} of ${selectedCategories.length} done)`}
            onPress={handleReview}
            disabled={completedCount === 0}
          />
        </ActionBar>
      ) : null}
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
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  progressRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.brand.sage, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary.forest },
  progressCount: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.caption, color: colors.neutral.textSecondary },
  categories: { marginVertical: 24, gap: 12 },
  categoryCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  categoryCardComplete: { borderColor: colors.primary.forest, backgroundColor: colors.brand.mint },
  pressed: { opacity: 0.85 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerComplete: { backgroundColor: colors.primary.forest },
  categoryContent: { flex: 1, gap: 2 },
  categoryTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  categoryDescription: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.semantic.warningSoft,
  },
  statusChipComplete: { backgroundColor: colors.semantic.successSoft },
  statusText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.micro, lineHeight: 16, color: colors.semantic.warning },
  statusTextComplete: { color: colors.semantic.success },
});
