import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StepProgress } from '@/src/components/StepProgress';
import { TextLink } from '@/src/components/TextLink';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';

export default function LegacyReviewScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.vault.items);
  const releasePolicy = useAppSelector((state) => state.vault.releasePolicy);
  const trustedPerson = useAppSelector(
    (state) => state.vault.recipients.find((recipient) => recipient.status !== 'REVOKED') ?? null,
  );

  useFocusEffect(
    useCallback(() => {
      void dispatch(refreshVaultData());
    }, [dispatch]),
  );

  const rows: { icon: IconName; title: string; count: number; unit: [string, string]; route: string }[] = [
    {
      icon: 'document',
      title: 'Documents',
      count: items.filter((item) => ['DOCUMENT', 'IMAGE', 'OTHER'].includes(item.type)).length,
      unit: ['item', 'items'],
      route: '/(auth)/legacy-documents',
    },
    {
      icon: 'investment',
      title: 'Investments',
      count: items.filter((item) => item.type === 'FINANCIAL').length,
      unit: ['asset', 'assets'],
      route: '/(auth)/legacy-investments',
    },
    {
      icon: 'message',
      title: 'Personal messages',
      count: items.filter((item) => item.type === 'TEXT').length,
      unit: ['message', 'messages'],
      route: '/(auth)/legacy-message',
    },
    {
      icon: 'video',
      title: 'Video messages',
      count: items.filter((item) => item.type === 'VIDEO').length,
      unit: ['video', 'videos'],
      route: '/(auth)/legacy-video-message',
    },
  ];
  const completeCount = rows.filter((row) => row.count > 0).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StepProgress phase="Legacy" />
        <Text style={styles.title} accessibilityRole="header">Review your legacy</Text>
        <Text style={styles.subtitle}>
          {completeCount} of {rows.length} categories have something saved. Assign items to your trusted people so they reach the right person.
        </Text>

        <View style={styles.card}>
          {rows.map((row, index) => {
            const empty = row.count === 0;
            const value = empty ? 'Nothing added yet' : `${row.count} ${row.count === 1 ? row.unit[0] : row.unit[1]}`;
            return (
              <Pressable
                key={row.title}
                accessibilityRole="button"
                accessibilityLabel={`${row.title}, ${value}`}
                accessibilityHint={empty ? 'Opens a form to add one' : 'Opens to add more'}
                onPress={() => router.push(row.route as never)}
                style={({ pressed }) => [styles.row, index < rows.length - 1 && styles.rowDivider, pressed && styles.pressed]}
              >
                <View style={styles.rowIcon}>
                  <AppIcon name={row.icon} size={20} color={colors.primary.deepForest} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <View style={styles.statusRow}>
                    {empty ? <View style={styles.warningDot} /> : null}
                    <Text style={[styles.rowValue, empty && styles.rowValueWarning]}>{value}</Text>
                  </View>
                </View>
                <AppIcon name={empty ? 'plus' : 'chevronRight'} size={20} color={empty ? colors.primary.forest : colors.neutral.textMuted} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Trusted person</Text>
          <TextLink
            title={trustedPerson ? 'Edit' : 'Add'}
            onPress={() =>
              trustedPerson
                ? router.push({ pathname: '/(auth)/trusted-person', params: { recipientId: trustedPerson.id } })
                : router.push('/(auth)/trusted-person')
            }
          />
        </View>
        <View style={[styles.card, styles.cardPadded]}>
          <View style={styles.personRow}>
            <View style={[styles.avatar, !trustedPerson && styles.avatarEmpty]}>
              {trustedPerson ? (
                <Text style={styles.avatarText}>{trustedPerson.name.charAt(0).toUpperCase()}</Text>
              ) : (
                <AppIcon name="userPlus" size={22} color={colors.semantic.warning} />
              )}
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{trustedPerson?.name ?? 'No trusted person yet'}</Text>
              <Text style={styles.rowValue}>
                {trustedPerson ? [trustedPerson.relationship, trustedPerson.email].filter(Boolean).join(' · ') : 'Optional now. You can add one later.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">When items are released</Text>
          <TextLink title="Edit" onPress={() => router.push('/(auth)/release-rules')} />
        </View>
        <View style={[styles.card, styles.cardPadded]}>
          <View style={styles.personRow}>
            <View style={styles.rowIcon}>
              <AppIcon name="hourglass" size={20} color={colors.primary.deepForest} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>
                {releasePolicy?.trigger === 'MANUAL' ? 'Only when you decide' : 'After missed check-ins'}
              </Text>
              <Text style={styles.rowValue}>
                {releasePolicy?.verificationRequired === false
                  ? 'Followed by Virasat’s review before anything is released.'
                  : 'Followed by identity checks and Virasat’s review before anything is released.'}
              </Text>
            </View>
          </View>
        </View>

        <InlineNotice
          tone="brand"
          title="You stay in control"
          message="Everything is encrypted, you choose who receives it, and you can change it any time."
          style={styles.notice}
        />
      </ScrollView>

      <ActionBar>
        <Button title="Continue to check-ins" onPress={() => router.push({ pathname: '/(auth)/check-in-preferences', params: { onboarding: 'true' } } as never)} />
        <Button title="Save and finish later" variant="tertiary" onPress={() => router.replace('/(auth)/(tabs)/home')} />
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
  card: {
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    overflow: 'hidden',
  },
  cardPadded: { padding: 16 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral.border },
  pressed: { backgroundColor: colors.brand.mint },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, lineHeight: 22, color: colors.neutral.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  warningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.semantic.warning },
  rowValue: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  rowValueWarning: { color: colors.semantic.warning, fontFamily: typography.fonts.inter.medium },
  sectionHeader: { marginTop: 24, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.title3, lineHeight: 24, color: colors.neutral.textPrimary },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmpty: { backgroundColor: colors.semantic.warningSoft },
  avatarText: { fontFamily: typography.fonts.playfair.semiBold, fontSize: 20, color: colors.primary.deepForest },
  notice: { marginTop: 24 },
});
