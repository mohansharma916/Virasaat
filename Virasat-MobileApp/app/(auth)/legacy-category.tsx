import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getCompletedLegacyCategories,
  parseLegacyCategories,
  subscribeLegacyFlow,
  type LegacyCategory, } from '@/src/utils/legacy-flow';
import { listLegacyItems } from '@/src/api/vault.api';
type CategoryConfig = {
  id: LegacyCategory;
  title: string;
  description: string;
  icon: string;
  route: string;
};

const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    id: 'DOCUMENTS',
    title: 'Important Documents',
    description:
      'Wills, property papers, insurance, certificates and other documents.',
    icon: '▤',
    route: '/(auth)/legacy-documents',
  },
  {
    id: 'INVESTMENTS',
    title: 'Investments & Finance',
    description:
      'Investment information, accounts, policies and financial instructions.',
    icon: '₹',
    route: '/(auth)/legacy-investments',
  },
  {
    id: 'MESSAGES',
    title: 'Personal Messages',
    description:
      "Written messages you'd like someone to receive.",
    icon: '✎',
    route: '/(auth)/legacy-message',
  },
  {
    id: 'VIDEOS',
    title: 'Video Messages',
    description:
      'Personal video messages recorded for your loved ones.',
    icon: '▶',
    route: '/(auth)/legacy-video-message',
  },
  {
    id: 'OTHER',
    title: 'Other Files',
    description:
      'PDFs, images and other important files.',
    icon: '□',
    route: '/(auth)/legacy-documents',
  },
];

export default function LegacyCategoryScreen() {
  const params = useLocalSearchParams<{
    categories?: string | string[];
  }>();

  const selectedCategories = useMemo(
    () => parseLegacyCategories(params.categories),
    [params.categories],
  );

  const [completedCategories, setCompletedCategories] =
    useState<LegacyCategory[]>(() =>
      getCompletedLegacyCategories(selectedCategories),
    );

  /*
   * Refresh completion state every time this hub becomes active.
   * Each category screen marks itself complete after a successful save.
   */
  useFocusEffect(
    useMemo(
      () => () => {
        const refresh = async () => {
          const locallyCompleted = getCompletedLegacyCategories(
            selectedCategories,
          );

          try {
            const savedItems = await listLegacyItems();
            const savedCategories = new Set(
              savedItems.map((item) => item.category.toUpperCase()),
            );

            setCompletedCategories(
              selectedCategories.filter(
                (category) =>
                  locallyCompleted.includes(category) ||
                  savedCategories.has(category),
              ),
            );
          } catch {
            // The local state still lets an in-progress onboarding flow
            // continue if a refresh is temporarily unavailable.
            setCompletedCategories(locallyCompleted);
          }
        };

        void refresh();

        return subscribeLegacyFlow(refresh);
      },
      [selectedCategories.join(',')],
    ),
  );

  const openCategory = (category: CategoryConfig) => {
    router.push({
      pathname: category.route,
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
    if (!allComplete) {
      return;
    }

    router.push({
      pathname: '/(auth)/legacy-review',
      params: {
        categories: selectedCategories.join(','),
      },
    } as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={styles.brand}>VIRASAT</Text>
        </View>

        <View style={styles.progressContainer}>
          {Array.from({ length: 10 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressItem,
                styles.progressItemActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>YOUR DIGITAL LEGACY</Text>

          <Text style={styles.title}>
            Let's preserve what matters.
          </Text>

          <Text style={styles.subtitle}>
            Complete the categories you selected. You can
            return here after adding each one.
          </Text>
        </View>

        <View style={styles.categories}>
          {CATEGORY_CONFIG
            .filter((category) =>
              selectedCategories.includes(category.id),
            )
            .map((category) => {
              const complete = completedCategories.includes(
                category.id,
              );

              return (
                <Pressable
                  key={category.id}
                  onPress={() => openCategory(category)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    complete && styles.categoryCardComplete,
                    pressed && styles.categoryCardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      complete &&
                        styles.iconContainerComplete,
                    ]}
                  >
                    <Text style={styles.icon}>
                      {complete ? '✓' : category.icon}
                    </Text>
                  </View>

                  <View style={styles.categoryContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.categoryTitle}>
                        {category.title}
                      </Text>

                      <Text
                        style={[
                          styles.status,
                          complete &&
                            styles.statusComplete,
                        ]}
                      >
                        {complete
                          ? 'Complete'
                          : 'Add now'}
                      </Text>
                    </View>

                    <Text
                      style={styles.categoryDescription}
                    >
                      {category.description}
                    </Text>

                    <Text style={styles.actionText}>
                      {complete
                        ? 'Open & edit →'
                        : 'Open & add →'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              LEGACY SETUP PROGRESS
            </Text>

            <Text style={styles.progressCount}>
              {completedCount}/{selectedCategories.length}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    selectedCategories.length > 0
                      ? `${Math.round(
                          (completedCount /
                            selectedCategories.length) *
                            100,
                        )}%`
                      : '0%',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Text style={styles.lock}>🔒</Text>
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Private by design
            </Text>

            <Text style={styles.securityText}>
              Everything you add to Virasat is intended to
              remain private until your release conditions
              are satisfied.
            </Text>
          </View>
        </View>

        <Pressable
          disabled={!allComplete}
          onPress={handleReview}
          style={({ pressed }) => [
            styles.button,
            !allComplete && styles.buttonDisabled,
            pressed &&
              allComplete &&
              styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            Review My Legacy
          </Text>

          <Text style={styles.buttonArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 35,
  },
  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 34,
    fontWeight: '300',
    color: colors.primary.deepForest,
  },
  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.primary.deepForest,
  },
  progressContainer: {
    marginTop: 27,
    flexDirection: 'row',
    gap: 5,
  },
  progressItem: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressItemActive: {
    backgroundColor: colors.primary.forest,
  },
  heading: {
    marginTop: 35,
    marginBottom: 24,
  },
  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary.forest,
  },
  title: {
    marginTop: 7,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 29,
    lineHeight: 38,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.neutral.textSecondary,
  },
  categories: {
    gap: 11,
  },
  categoryCard: {
    minHeight: 104,
    padding: 15,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCardComplete: {
    borderColor: colors.primary.forest,
    backgroundColor: colors.brand.mint,
  },
  categoryCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  iconContainer: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerComplete: {
    backgroundColor: colors.brand.sage,
  },
  icon: {
    fontSize: 18,
    color: colors.primary.forest,
  },
  categoryContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },
  status: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9.5,
    color: colors.neutral.textMuted,
  },
  statusComplete: {
    color: colors.primary.forest,
  },
  categoryDescription: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },
  actionText: {
    marginTop: 7,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.primary.forest,
  },
  progressCard: {
    marginTop: 18,
    padding: 15,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
    color: colors.neutral.textSecondary,
  },
  progressCount: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.primary.forest,
  },
  progressTrack: {
    height: 6,
    marginTop: 10,
    borderRadius: 3,
    backgroundColor: colors.neutral.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary.forest,
  },
  securityCard: {
    marginTop: 15,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIcon: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    fontSize: 12,
  },
  securityContent: {
    flex: 1,
    marginLeft: 10,
  },
  securityTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },
  securityText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },
  button: {
    height: 56,
    marginTop: 23,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },
  buttonArrow: {
    marginLeft: 10,
    fontSize: 19,
    color: colors.neutral.white,
  },
});
