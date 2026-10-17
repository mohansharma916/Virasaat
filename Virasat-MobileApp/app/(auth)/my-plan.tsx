import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { Feature, PlanCode, PlanLimit, SubscriptionStatus } from '@/src/types/subscription.types';
import { useSubscription } from '@/src/store/subscription.slice';
import { PurchaseService } from '@/src/services/purchase.service';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function MyPlanScreen() {
  const insets = useSafeAreaInsets();
  const { currentPlan, subscription, subscriptionStatus, purchaseVerification, getLimit, canUseFeature, restorePurchases, refreshSubscription } =
    useSubscription();
  const [restoring, setRestoring] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger' | 'info'; message: string } | null>(null);

  const isStarter = !currentPlan || currentPlan.code === PlanCode.STARTER;
  const isFamily = currentPlan?.code === PlanCode.FAMILY;

  const handleManage = async () => {
    try {
      await PurchaseService.openSubscriptionManagement();
    } catch {
      setNotice({ tone: 'info', message: 'Open Google Play or the App Store on your phone to manage your subscription.' });
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      setNotice(null);
      await restorePurchases();
      await refreshSubscription();
      setNotice({ tone: 'success', message: 'Your plan is up to date.' });
    } catch (error) {
      setNotice({ tone: 'danger', message: getApiErrorMessage(error, 'We couldn’t refresh your plan. Try again.') });
    } finally {
      setRestoring(false);
    }
  };

  const formatExpiryDate = (dateStr?: string | null) => {
    if (!dateStr) return 'No end date';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return { bg: colors.brand.mint, text: colors.primary.deepForest };
      case SubscriptionStatus.GRACE_PERIOD:
        return { bg: colors.semantic.warningSoft, text: colors.semantic.warning };
      case SubscriptionStatus.PAYMENT_FAILED:
      case SubscriptionStatus.EXPIRED:
        return { bg: colors.semantic.errorSoft, text: colors.semantic.error };
      default:
        return { bg: colors.neutral.sunken, text: colors.neutral.textSecondary };
    }
  };

  const badge = getStatusColor(subscriptionStatus);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack="default" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">Your plan</Text>
          <Text style={styles.subtitle}>What your plan includes and when it renews.</Text>
        </View>

        {/* Plan Summary Card */}
        <View style={styles.planCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.tierName}>
                Virasat {currentPlan?.name ?? 'Starter'}
              </Text>
              <Text style={styles.tierPrice}>
                {isStarter
                  ? 'Free tier'
                  : `₹${currentPlan?.price ?? 999} / year`}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                {subscriptionStatus.charAt(0) + subscriptionStatus.slice(1).toLowerCase().replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.renewalRow}>
            <Text style={styles.renewalLabel}>
              {isStarter ? 'Term' : 'Renews on'}
            </Text>
            <Text style={styles.renewalValue}>
              {formatExpiryDate(subscription?.expiryDate)}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.benefitsTitle}>What you can use now</Text>
          {purchaseVerification === 'UNVERIFIED' && <Text style={styles.subtitle}>We couldn’t verify a store purchase for this plan, so Starter limits apply for now.</Text>}
          <View style={styles.benefitsList}>
            <BenefitRow text={`${getLimit(PlanLimit.TRUSTED_PERSONS) ?? 'Unlimited'} trusted ${getLimit(PlanLimit.TRUSTED_PERSONS) === 1 ? 'person' : 'people'}`} />
            <BenefitRow text={`${getLimit(PlanLimit.PERSONAL_MESSAGES) ?? 'Unlimited'} written messages`} />
            <BenefitRow text={`${getLimit(PlanLimit.VIDEO_MESSAGES) ?? 'Unlimited'} video messages`} />
            <BenefitRow text={canUseFeature(Feature.CUSTOM_CHECK_IN) ? 'Monthly or weekly check-ins' : 'Monthly check-ins'} />
            <BenefitRow text="Encrypted storage and choosing who receives each item" />
          </View>
        </View>

        {notice ? <InlineNotice tone={notice.tone} message={notice.message} style={styles.noticeGap} /> : null}

        <View style={styles.actionsContainer}>
          {!isFamily ? <Button title="Compare plans" onPress={() => router.push('/(auth)/plans' as never)} /> : null}
          {!isStarter && purchaseVerification === 'VERIFIED' ? (
            <Button title="Manage subscription in store" variant="secondary" onPress={() => void handleManage()} />
          ) : null}
          <Button title="Refresh my plan" variant="tertiary" onPress={() => void handleRestore()} loading={restoring} />
        </View>

        <InlineNotice
          tone="info"
          title="Coming soon"
          message="Paid plans, automatic reminders, invitations and releasing items aren’t available yet."
          style={styles.noticeGap}
        />

        {/* Downgrade & Continuity Policy Guarantee */}
        <View style={styles.guaranteeBox}>
          <View style={styles.guaranteeHeader}>
            <AppIcon name="shieldCheck" size={20} color={colors.primary.deepForest} />
            <Text style={styles.guaranteeTitle}>Nothing is lost if you change plans</Text>
          </View>
          <Text style={styles.guaranteeText}>
            If your plan ends or changes, we keep your documents, messages, release rules and trusted people.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.checkCircle}>
        <AppIcon name="check" style={styles.checkIcon} />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeGap: { marginTop: 16 },
  guaranteeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: colors.brand.sage,
    shadowColor: colors.primary.deepForest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tierName: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 22,
    color: colors.neutral.textPrimary,
  },
  tierPrice: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontFamily: typography.fonts.inter.bold,
    fontSize: 13,
  },
  renewalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  renewalLabel: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    color: colors.neutral.textSecondary,
  },
  renewalValue: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.sunken,
    marginVertical: 14,
  },
  benefitsTitle: {
    fontFamily: typography.fonts.inter.bold,
    fontSize: 13,
    color: colors.neutral.textMuted,
    
    marginBottom: 12,
  },
  benefitsList: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.deepForest,
  },
  benefitText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  guaranteeBox: {
    backgroundColor: colors.brand.mint,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  guaranteeTitle: {
    fontFamily: typography.fonts.inter.bold,
    fontSize: 13,
    color: colors.primary.deepForest,
    
  },
  guaranteeText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    color: colors.primary.deepForest,
    lineHeight: 19,
  },
});
