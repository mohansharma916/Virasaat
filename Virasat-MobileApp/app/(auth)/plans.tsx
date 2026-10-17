import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { PlanCode } from '@/src/types/subscription.types';
import { useSubscription } from '@/src/store/subscription.slice';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const { effectivePlanCode, restorePurchases, refreshSubscription } =
    useSubscription();
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);


  const handleRestore = async () => {
    try {
      setRestoring(true);
      setRestoreResult(null);
      await restorePurchases();
      await refreshSubscription();
      setRestoreResult({ tone: 'success', message: 'Your plan is up to date.' });
    } catch (error) {
      setRestoreResult({ tone: 'danger', message: getApiErrorMessage(error, 'We couldn’t refresh your plan. Try again.') });
    } finally {
      setRestoring(false);
    }
  };

  const isStarter = effectivePlanCode === PlanCode.STARTER;
  const isSecure = effectivePlanCode === PlanCode.SECURE;
  const isFamily = effectivePlanCode === PlanCode.FAMILY;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack="default" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">Plans</Text>
          <Text style={styles.subtitle}>
            Starter is free and available now. Secure and Family are coming soon. Their features below are planned.
          </Text>
        </View>

        {/* 1. STARTER PLAN */}
        <View style={[styles.planCard, isStarter && styles.currentPlanBorder]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>Starter</Text>
              <Text style={styles.planSubtitle}>Start building your digital legacy</Text>
            </View>
            {isStarter && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current plan</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceAmount}>0</Text>
            <Text style={styles.pricePeriod}>/ forever</Text>
          </View>

          <View style={styles.featureList}>
            <FeatureItem text="1 trusted person" />
            <FeatureItem text="Standard monthly check-in" />
            <FeatureItem text="Standard release policy" />
            <FeatureItem text="Up to 3 written messages and 1 video message" />
            <FeatureItem text="Basic activity history" />
          </View>

          {isStarter ? (
            <View style={styles.statusChip}>
              <AppIcon name="checkCircle" size={16} color={colors.semantic.success} />
              <Text style={styles.statusChipText}>Your current plan</Text>
            </View>
          ) : null}
        </View>

        {/* 2. SECURE PLAN */}
        <View style={[styles.planCard, styles.popularCard, isSecure && styles.currentPlanBorder]}>
          <View style={styles.recommendTag}>
            <Text style={styles.recommendTagText}>Recommended for individuals</Text>
          </View>

          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>Secure</Text>
              <Text style={styles.planSubtitle}>
                Secure your legacy and decide exactly who receives what
              </Text>
            </View>
            {isSecure && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current plan</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceAmount}>999</Text>
            <Text style={styles.pricePeriod}>/ year</Text>
          </View>

          <View style={styles.featureList}>
            <FeatureItem text="Up to 3 trusted people" highlight />
            <FeatureItem text="Custom check-in frequency and schedules" highlight />
            <FeatureItem text="Customizable grace period" highlight />
            <FeatureItem text="Recipient verification options" highlight />
            <FeatureItem text="Item-level recipient assignment" highlight />
            <FeatureItem text="Unlimited written personal messages" />
            <FeatureItem text="Up to 10 personal video messages" />
            <FeatureItem text="Full activity history" />
          </View>

          <View style={[styles.statusChip, styles.statusChipSoon]} accessible accessibilityLabel="Coming soon. Not available to buy yet">
            <AppIcon name="hourglass" size={16} color={colors.semantic.warning} />
            <Text style={[styles.statusChipText, styles.statusChipTextSoon]}>Coming soon</Text>
          </View>
        </View>

        {/* 3. FAMILY PLAN */}
        <View style={[styles.planCard, isFamily && styles.currentPlanBorder]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>Family</Text>
              <Text style={styles.planSubtitle}>
                Advanced protection and continuity for your entire family
              </Text>
            </View>
            {isFamily && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current plan</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceAmount}>2,499</Text>
            <Text style={styles.pricePeriod}>/ year</Text>
          </View>

          <View style={styles.featureList}>
            <FeatureItem text="Up to 8 trusted people" highlight />
            <FeatureItem text="Advanced release policies" highlight />
            <FeatureItem text="Multiple independent verifiers" highlight />
            <FeatureItem text="Multi-person verification workflow" highlight />
            <FeatureItem text="Advanced escalation rules" highlight />
            <FeatureItem text="Family and emergency instructions" highlight />
            <FeatureItem text="Up to 50 personal video messages" />
            <FeatureItem text="Priority support" />
          </View>

          <View style={[styles.statusChip, styles.statusChipSoon]} accessible accessibilityLabel="Coming soon. Not available to buy yet">
            <AppIcon name="hourglass" size={16} color={colors.semantic.warning} />
            <Text style={[styles.statusChipText, styles.statusChipTextSoon]}>Coming soon</Text>
          </View>
        </View>

        {/* Restore purchases & calm notice */}
        <View style={styles.footer}>
          {restoreResult ? <InlineNotice tone={restoreResult.tone} message={restoreResult.message} /> : null}
          <Button title="Refresh my plan" variant="secondary" size="md" onPress={() => void handleRestore()} loading={restoring} />

          <Text style={styles.disclaimerText}>
            Paid plans can’t be bought yet, so there’s nothing to restore from the store. If your plan’s limits change, everything you saved is kept.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({
  text,
  highlight = false,
}: {
  text: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.checkCircle, highlight && styles.checkCircleHighlight]}>
        <AppIcon name="check" style={styles.checkIcon} />
      </View>
      <Text style={[styles.featureText, highlight && styles.featureTextHighlight]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusChip: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.semantic.successSoft,
  },
  statusChipSoon: { backgroundColor: colors.semantic.warningSoft },
  statusChipText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, color: colors.semantic.success },
  statusChipTextSoon: { color: colors.semantic.warning },
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heading: {
    marginBottom: 24,
  },
  title: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 26,
    color: colors.neutral.textPrimary,
    lineHeight: 38,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textSecondary,
    lineHeight: 21,
  },
  planCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    shadowColor: colors.primary.deepForest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  popularCard: {
    borderColor: colors.primary.forest,
    borderWidth: 2,
  },
  currentPlanBorder: {
    borderColor: colors.semantic.success,
  },
  recommendTag: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.primary.deepForest,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
  },
  recommendTagText: {
    fontFamily: typography.fonts.inter.bold,
    fontSize: 13,
    color: colors.neutral.white,
    
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 12,
  },
  planName: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 22,
    color: colors.neutral.textPrimary,
  },
  planSubtitle: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    color: colors.neutral.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  currentBadge: {
    backgroundColor: colors.brand.mint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontFamily: typography.fonts.inter.bold,
    fontSize: 12,
    color: colors.primary.deepForest,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.sunken,
  },
  priceCurrency: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 20,
    color: colors.neutral.textPrimary,
  },
  priceAmount: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 32,
    color: colors.neutral.textPrimary,
  },
  pricePeriod: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textSecondary,
    marginLeft: 6,
  },
  featureList: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleHighlight: {
    backgroundColor: colors.brand.mint,
  },
  checkIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.deepForest,
  },
  featureText: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textSecondary,
    lineHeight: 22,
  },
  featureTextHighlight: {
    color: colors.neutral.textPrimary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    gap: 14,
  },
  disclaimerText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
