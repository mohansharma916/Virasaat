import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type LegacyCategory =
  | 'DOCUMENTS'
  | 'INVESTMENTS'
  | 'MESSAGES'
  | 'VIDEOS'
  | 'OTHER';

type Category = {
  id: LegacyCategory;
  title: string;
  description: string;
  icon: string;
};

const categories: Category[] = [
  {
    id: 'DOCUMENTS',
    title: 'Important Documents',
    description:
      'Wills, property papers, insurance, certificates and other documents.',
    icon: '▤',
  },
  {
    id: 'INVESTMENTS',
    title: 'Investments & Finance',
    description:
      'Investment information, accounts, policies and financial instructions.',
    icon: '₹',
  },
  {
    id: 'MESSAGES',
    title: 'Personal Messages',
    description:
      "Written messages you'd like someone to receive.",
    icon: '✎',
  },
  {
    id: 'VIDEOS',
    title: 'Video Messages',
    description:
      'Personal video messages recorded for your loved ones.',
    icon: '▶',
  },
  {
    id: 'OTHER',
    title: 'Other Files',
    description:
      'PDFs, images and other important files.',
    icon: '□',
  },
];

export default function LegacySetupScreen() {
  const [selectedCategories, setSelectedCategories] =
    useState<LegacyCategory[]>([]);

  const toggleCategory = (
    category: LegacyCategory,
  ) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter(
          (item) => item !== category,
        );
      }

      return [...current, category];
    });
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      return;
    }

    router.push({
      pathname: '/(auth)/legacy-category',
      params: {
        categories:
          selectedCategories.join(','),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.brand}>
            VIRASAT
          </Text>
        </View>

        {/* Progress */}

        <View style={styles.progressContainer}>
          {Array.from({ length: 10 }).map(
            (_, index) => (
              <View
                key={index}
                style={[
                  styles.progressItem,
                  styles.progressItemActive,
                ]}
              />
            ),
          )}
        </View>

        {/* Heading */}

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>
            YOUR DIGITAL LEGACY
          </Text>

          <Text style={styles.title}>
            What would you like to preserve?
          </Text>

          <Text style={styles.subtitle}>
            Select everything you'd like Virasat
            to keep safe for your future legacy.
          </Text>
        </View>

        {/* Categories */}

        <View style={styles.categories}>
          {categories.map((category) => {
            const selected =
              selectedCategories.includes(
                category.id,
              );

            return (
              <Pressable
                key={category.id}
                onPress={() =>
                  toggleCategory(category.id)
                }
                style={({ pressed }) => [
                  styles.categoryCard,
                  selected &&
                    styles.categoryCardSelected,
                  pressed &&
                    styles.categoryCardPressed,
                ]}
              >
                {/* Icon */}

                <View
                  style={[
                    styles.iconContainer,
                    selected &&
                      styles.iconContainerSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.icon,
                      selected &&
                        styles.iconSelected,
                    ]}
                  >
                    {category.icon}
                  </Text>
                </View>

                {/* Content */}

                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>
                    {category.title}
                  </Text>

                  <Text
                    style={styles.categoryDescription}
                  >
                    {category.description}
                  </Text>
                </View>

                {/* Checkbox */}

                <View
                  style={[
                    styles.checkbox,
                    selected &&
                      styles.checkboxSelected,
                  ]}
                >
                  {selected && (
                    <Text style={styles.check}>
                      ✓
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Security */}

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Text style={styles.lock}>
              🔒
            </Text>
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Private by design
            </Text>

            <Text style={styles.securityText}>
              Everything you add to Virasat is
              encrypted and remains private.
            </Text>
          </View>
        </View>

        {/* Continue */}

        <Pressable
          disabled={
            selectedCategories.length === 0
          }
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            selectedCategories.length === 0 &&
              styles.buttonDisabled,
            pressed &&
              selectedCategories.length > 0 &&
              styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            Continue
          </Text>

          <Text style={styles.buttonArrow}>
            →
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          {selectedCategories.length > 0
            ? `${selectedCategories.length} ${
                selectedCategories.length === 1
                  ? 'category'
                  : 'categories'
              } selected`
            : 'Select at least one category'}
        </Text>
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

  categoryCardSelected: {
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

  iconContainerSelected: {
    backgroundColor: colors.brand.sage,
  },

  icon: {
    fontSize: 18,
    color: colors.primary.forest,
  },

  iconSelected: {
    color: colors.primary.deepForest,
  },

  categoryContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  categoryTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },

  categoryDescription: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor: colors.primary.forest,
    borderColor: colors.primary.forest,
  },

  check: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral.white,
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

  footer: {
    marginTop: 14,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },
});