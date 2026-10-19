import React, { useEffect, useState } from 'react';
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
import { haptics } from '@/src/utils/haptics';
import { PurchaseError, PurchaseService } from '@/src/services/purchase.service';

type PlanCard = {
  code: PlanCode;
  name: string;
  subtitle: string;
  price: string;
  period: string;
  recommended?: string;
  features: { text: string; highlight?: boolean }[];
};

// Only what each plan really includes today.
const PLANS: PlanCard[] = [
  {
    code: PlanCode.STARTER,
    name: 'Starter',
    subtitle: 'Start building your digital legacy',
    price: '0',
    period: '/ forever',
    features: [
      { text: '1 trusted person' },
      { text: 'Monthly check-ins with email reminders' },
      { text: 'App notifications when a check-in is long overdue' },
      { text: 'Release review after 3 months without a check-in' },
      { text: 'Up to 3 written messages and 1 video message' },
    ],
  },
  {
    code: PlanCode.SECURE,
    name: 'Secure',
    subtitle: 'Decide exactly who receives what, and when',
    price: '999',
    period: '/ year',
    recommended: 'Recommended for individuals',
    features: [
      { text: 'Up to 3 trusted people', highlight: true },
      { text: 'Weekly or monthly check-ins', highlight: true },
      { text: 'Choose your review deadline: 1, 2, 3 or 6 months', highlight: true },
      { text: 'SMS and phone-call reminders when you’re overdue', highlight: true },
      { text: 'Unlimited written messages' },
      { text: 'Up to 10 video messages' },
    ],
  },
  {
    code: PlanCode.FAMILY,
    name: 'Family',
    subtitle: 'The most careful protection for your family',
    price: '2,499',
    period: '/ year',
    features: [
      { text: 'Everything in Secure' },
      { text: 'Up to 8 trusted people', highlight: true },
      { text: 'A Virasat team member visits before any release', highlight: true },
      { text: 'Up to 50 video messages', highlight: true },
    ],
  },
];

const RANK: Record<PlanCode, number> = { STARTER: 0, SECURE: 1, FAMILY: 2 };

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const { effectivePlanCode, restorePurchases, refreshSubscription, purchasePlan } = useSubscription();
  const [busy, setBusy] = useState<PlanCode | 'restore' | null>(null);
  const [result, setResult] = useState<{ tone: 'success' | 'danger' | 'info'; message: string } | null>(null);
  const [prices, setPrices] = useState<Partial<Record<PlanCode, string>>>({});

  useEffect(() => {
    // Google Play's localized price, when the store is reachable.
    void PurchaseService.getProducts()
      .then((products) => setPrices(Object.fromEntries(products.map((p) => [p.planCode, p.priceText]))))
      .catch(() => undefined);
  }, []);

  const buy = async (planCode: PlanCode) => {
    if (busy) return;
    setBusy(planCode);
    setResult(null);
    try {
      await purchasePlan(planCode);
      await refreshSubscription();
      haptics.success();
      setResult({ tone: 'success', message: `You’re on ${planCode === PlanCode.FAMILY ? 'Family' : 'Secure'}. Thank you!` });
    } catch (error) {
      const cancelled = error instanceof PurchaseError && error.cancelled;
      if (!cancelled) haptics.error();
      setResult(
        cancelled
          ? null
          : { tone: 'danger', message: error instanceof Error && error.message ? error.message : getApiErrorMessage(error, 'The purchase didn’t complete. You weren’t charged twice; try again.') },
      );
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy('restore');
    setResult(null);
    try {
      await restorePurchases();
      await refreshSubscription();
      setResult({ tone: 'success', message: 'Your plan is up to date with Google Play.' });
    } catch (error) {
      setResult({ tone: 'danger', message: error instanceof Error && error.message ? error.message : getApiErrorMessage(error, 'We couldn’t restore your purchases. Try again.') });
    } finally {
      setBusy(null);
    }
  };

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
            Start free. Upgrade any time through Google Play; cancel whenever you like and keep everything you saved.
          </Text>
        </View>

        {result ? <InlineNotice tone={result.tone} message={result.message} style={styles.resultNotice} /> : null}

        {PLANS.map((plan) => {
          const current = effectivePlanCode === plan.code;
          const lower = RANK[plan.code] < RANK[effectivePlanCode];
          return (
            <View key={plan.code} style={[styles.planCard, plan.recommended && styles.popularCard, current && styles.currentPlanBorder]}>
              {plan.recommended ? (
                <View style={styles.recommendTag}>
                  <Text style={styles.recommendTagText}>{plan.recommended}</Text>
                </View>
              ) : null}
              <View style={styles.planHeader}>
                <View style={styles.planHeaderText}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                </View>
                {current ? (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current plan</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.priceRow}>
                {prices[plan.code] && plan.code !== PlanCode.STARTER ? (
                  <Text style={styles.priceAmount}>{prices[plan.code]}</Text>
                ) : (
                  <>
                    <Text style={styles.priceCurrency}>₹</Text>
                    <Text style={styles.priceAmount}>{plan.price}</Text>
                    <Text style={styles.pricePeriod}>{plan.period}</Text>
                  </>
                )}
              </View>

              <View style={styles.featureList}>
                {plan.features.map((feature) => (
                  <FeatureItem key={feature.text} text={feature.text} highlight={feature.highlight} />
                ))}
              </View>

              {current ? (
                <View style={styles.statusChip}>
                  <AppIcon name="checkCircle" size={16} color={colors.semantic.success} />
                  <Text style={styles.statusChipText}>Your current plan</Text>
                </View>
              ) : plan.code !== PlanCode.STARTER && !lower ? (
                <Button
                  title={effectivePlanCode === PlanCode.STARTER ? `Get ${plan.name}` : `Upgrade to ${plan.name}`}
                  onPress={() => void buy(plan.code)}
                  loading={busy === plan.code}
                  disabled={busy !== null && busy !== plan.code}
                />
              ) : null}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Button title="Restore purchases" variant="secondary" size="md" onPress={() => void handleRestore()} loading={busy === 'restore'} disabled={busy !== null && busy !== 'restore'} />
          {effectivePlanCode !== PlanCode.STARTER ? (
            <Button title="Manage in Google Play" variant="tertiary" size="md" onPress={() => void PurchaseService.openSubscriptionManagement()} />
          ) : null}
          <Text style={styles.disclaimerText}>
            Billed yearly through Google Play and renewed automatically until you cancel. If a paid plan ends, everything you saved is kept; only new items follow Starter’s limits.
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
  resultNotice: { marginBottom: 16 },
  planHeaderText: { flex: 1, paddingRight: 8 },
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
  statusChipText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, color: colors.semantic.success },
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
