import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SelectionRow } from '@/src/components/SelectionRow';
import { StepProgress } from '@/src/components/StepProgress';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { LEGACY_CATEGORIES } from '@/src/utils/legacy-categories';
import type { LegacyCategory } from '@/src/utils/legacy-flow';

export default function LegacySetupScreen() {
  const [selectedCategories, setSelectedCategories] = useState<LegacyCategory[]>([]);

  const toggleCategory = (category: LegacyCategory) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  };

  const count = selectedCategories.length;

  const handleContinue = () => {
    if (count === 0) return;
    router.push({ pathname: '/(auth)/legacy-category', params: { categories: selectedCategories.join(',') } });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StepProgress phase="Legacy" />

        <Text style={styles.title} accessibilityRole="header">What would you like to preserve?</Text>
        <Text style={styles.subtitle}>Choose everything you’d like Virasat to keep safe. You can add more later.</Text>

        <View style={styles.categories}>
          {LEGACY_CATEGORIES.map((category) => {
            const selected = selectedCategories.includes(category.id);
            return (
              <SelectionRow
                key={category.id}
                kind="checkbox"
                selected={selected}
                onPress={() => toggleCategory(category.id)}
                title={category.title}
                description={category.description}
                leading={
                  <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
                    <AppIcon name={category.icon} size={22} color={selected ? colors.neutral.white : colors.primary.deepForest} />
                  </View>
                }
              />
            );
          })}
        </View>

        <InlineNotice tone="brand" title="Private by design" message="Everything you add is encrypted and stays private." />
      </ScrollView>

      <ActionBar>
        <Button
          title={count > 0 ? `Continue with ${count} selected` : 'Choose at least one'}
          onPress={handleContinue}
          disabled={count === 0}
        />
      </ActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  title: {
    marginTop: 24,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  categories: { gap: 12, marginBottom: 24 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: { backgroundColor: colors.primary.forest },
});
