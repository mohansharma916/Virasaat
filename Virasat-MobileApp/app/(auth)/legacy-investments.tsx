import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { useAppSelector } from '@/src/store/hooks';
import { ASSET_TYPES } from '@/src/utils/financial-assets';

export default function LegacyInvestmentsScreen() {
  const params = useLocalSearchParams<{ category?: string; categories?: string }>();
  const items = useAppSelector((state) => state.vault.items);
  const assets = items.filter((item) => item.category === 'INVESTMENTS');

  const addAsset = () =>
    router.push({
      pathname: '/(auth)/legacy-investment-details',
      params: { category: params.category ?? 'INVESTMENTS', categories: params.categories ?? 'INVESTMENTS' },
    });

  const finish = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/(auth)/legacy-category', params: { categories: params.categories ?? 'INVESTMENTS' } });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.category}>Investments and finance</Text>
        <Text style={styles.title} accessibilityRole="header">Help your family find what you’ve built</Text>
        <Text style={styles.subtitle}>Add your investments, insurance, bank accounts and property.</Text>

        {assets.length === 0 ? (
          <EmptyState
            icon="investment"
            title="No financial assets yet"
            message="Add where each asset is held so your family can find it."
            actionLabel="Add a financial asset"
            onAction={addAsset}
          />
        ) : (
          <>
            <View style={styles.list}>
              {assets.map((asset) => {
                const type = ASSET_TYPES.find((entry) => entry.label === asset.title) ?? ASSET_TYPES[ASSET_TYPES.length - 1];
                return (
                  <Pressable
                    key={asset.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${asset.title}. Opens details`}
                    onPress={() => router.push({ pathname: '/(auth)/saved-item', params: { id: asset.id } } as never)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  >
                    <View style={styles.rowIcon}>
                      <AppIcon name={type.icon} size={22} color={colors.primary.deepForest} />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>{asset.title}</Text>
                      <Text style={styles.rowMeta}>
                        Added {new Date(asset.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
                  </Pressable>
                );
              })}
            </View>
            <Button
              title="Add another asset"
              variant="secondary"
              onPress={addAsset}
              icon={<AppIcon name="plus" size={20} color={colors.primary.forest} />}
              style={styles.addButton}
            />
          </>
        )}

        <InlineNotice
          tone="warning"
          icon="key"
          title="Keep secrets out"
          message="Never store passwords, PINs, OTPs or card CVVs in Virasat."
          style={styles.notice}
        />
      </ScrollView>

      <ActionBar>
        {assets.length === 0 ? (
          <Button title="Skip for now" variant="secondary" onPress={finish} />
        ) : (
          <Button title="Done" onPress={finish} />
        )}
      </ActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  category: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, color: colors.primary.forest },
  title: {
    marginTop: 4,
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
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  rowMeta: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, color: colors.neutral.textSecondary },
  addButton: { marginTop: 16 },
  notice: { marginTop: 24 },
});
