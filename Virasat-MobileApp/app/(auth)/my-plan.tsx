import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { PlanCode, SubscriptionStatus } from '@/src/types/subscription.types';
import { useSubscription } from '@/src/store/subscription.slice';
import { PurchaseService } from '@/src/services/purchase.service';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function MyPlanScreen() {
  const insets = useSafeAreaInsets();
  const { currentPlan, subscription, subscriptionStatus, restorePurchases, refreshSubscription } =
    useSubscription();
  const [restoring, setRestoring] = useState(false);

  const isStarter = !currentPlan || currentPlan.code === PlanCode.STARTER;
  const isSecure = currentPlan?.code === PlanCode.SECURE;
  const isFamily = currentPlan?.code === PlanCode.FAMILY;

  const handleManage = async () => {
    try {
      await PurchaseService.openSubscriptionManagement();
    } catch {
      Alert.alert(
        'Manage Subscription',
        'Open your device Google Play or App Store account settings to manage your recurring subscriptions.',
      );
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      await restorePurchases();
      await refreshSubscription();
      Alert.alert('Purchases Restored', 'Your latest subscription status is refreshed.');
    } catch (error) {
      Alert.alert('Restore Failed', getApiErrorMessage(error));
    } finally {
      setRestoring(false);
    }
  };

  const formatExpiryDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Active · No expiration';
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
        return { bg: '#FEF3C7', text: '#92400E' };
      case SubscriptionStatus.PAYMENT_FAILED:
      case SubscriptionStatus.EXPIRED:
        return { bg: '#FDE8E8', text: '#9B1C1C' };
      default:
        return { bg: '#F1F3F5', text: colors.neutral.textSecondary };
    }
  };

  const badge = getStatusColor(subscriptionStatus);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
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

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>MEMBERSHIP & BILLING</Text>
          <Text style={styles.title}>Current Plan</Text>
          <Text style={styles.subtitle}>
            Review your active plan, entitlements, and renewal preferences.
          </Text>
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
                {subscriptionStatus}
              </Text>
            </View>
          </View>

          <View style={styles.renewalRow}>
            <Text style={styles.renewalLabel}>
              {isStarter ? 'Term:' : 'Renewal Date:'}
            </Text>
            <Text style={styles.renewalValue}>
              {formatExpiryDate(subscription?.expiryDate)}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.benefitsTitle}>ACTIVE ENTITLEMENTS</Text>
          <View style={styles.benefitsList}>
            {isStarter ? (
              <>
                <BenefitRow text="1 Trusted Person" />
                <BenefitRow text="Standard monthly life check-in" />
                <BenefitRow text="Standard release policy" />
                <BenefitRow text="Up to 3 written messages & 1 video message" />
                <BenefitRow text="Basic activity history" />
              </>
            ) : isSecure ? (
              <>
                <BenefitRow text="Up to 3 Trusted Persons" />
                <BenefitRow text="Custom check-in frequency & schedules" />
                <BenefitRow text="Customizable grace period" />
                <BenefitRow text="Recipient verification options" />
                <BenefitRow text="Full item-level recipient assignment" />
                <BenefitRow text="Unlimited personal written messages" />
                <BenefitRow text="Up to 10 personal video messages" />
                <BenefitRow text="Full activity history" />
              </>
            ) : (
              <>
                <BenefitRow text="Up to 8 Trusted Persons" />
                <BenefitRow text="Advanced release policies" />
                <BenefitRow text="Multiple independent verifiers" />
                <BenefitRow text="Multi-person verification workflow" />
                <BenefitRow text="Advanced escalation rules" />
                <BenefitRow text="Family & emergency instructions" />
                <BenefitRow text="Up to 50 personal video messages" />
                <BenefitRow text="Priority support" />
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!isFamily && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/plans' as never)}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryActionText}>
                {isStarter ? 'Upgrade to Secure or Family' : 'Upgrade to Family'}
              </Text>
              <Text style={styles.actionArrow}>→</Text>
            </Pressable>
          )}

          {!isStarter && (
            <Pressable
              accessibilityRole="button"
              onPress={handleManage}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryActionText}>
                Manage Subscription in Store
              </Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={handleRestore}
            disabled={restoring}
            style={({ pressed }) => [
              styles.restoreAction,
              pressed && styles.pressed,
            ]}
          >
            {restoring ? (
              <ActivityIndicator size="small" color={colors.primary.deepForest} />
            ) : (
              <Text style={styles.restoreActionText}>Restore Purchases</Text>
            )}
          </Pressable>
        </View>

        {/* Downgrade & Continuity Policy Guarantee */}
        <View style={styles.guaranteeBox}>
          <Text style={styles.guaranteeTitle}>🛡 CONTINUITY GUARANTEE</Text>
          <Text style={styles.guaranteeText}>
            Virasat never deletes your digital legacy data, uploaded documents, or
            saved release policies if your subscription ends or you change tiers.
            Your appointed trusted persons remain intact.
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
        <Text style={styles.checkIcon}>✓</Text>
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 4,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 32,
    color: colors.primary.deepForest,
    lineHeight: 36,
  },
  brand: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.deepForest,
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heading: {
    marginBottom: 20,
  },
  eyebrow: {
    fontFamily: typography.fonts.ui,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.forest,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.fonts.display,
    fontSize: 26,
    fontWeight: '700',
    color: colors.neutral.textPrimary,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    color: colors.neutral.textSecondary,
    lineHeight: 21,
  },
  planCard: {
    backgroundColor: colors.brand.white,
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
    fontFamily: typography.fonts.display,
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral.textPrimary,
  },
  tierPrice: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontFamily: typography.fonts.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  renewalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  renewalLabel: {
    fontFamily: typography.fonts.ui,
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },
  renewalValue: {
    fontFamily: typography.fonts.ui,
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F0',
    marginVertical: 14,
  },
  benefitsTitle: {
    fontFamily: typography.fonts.ui,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral.textMuted,
    letterSpacing: 0.8,
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
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary.deepForest,
  },
  benefitText: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    color: colors.neutral.textPrimary,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  primaryAction: {
    backgroundColor: colors.primary.deepForest,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    fontFamily: typography.fonts.ui,
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  actionArrow: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: colors.brand.sage,
    backgroundColor: colors.brand.white,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.deepForest,
  },
  restoreAction: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  restoreActionText: {
    fontFamily: typography.fonts.ui,
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
    textDecorationLine: 'underline',
  },
  guaranteeBox: {
    backgroundColor: colors.brand.mint,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  guaranteeTitle: {
    fontFamily: typography.fonts.ui,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.deepForest,
    letterSpacing: 0.5,
  },
  guaranteeText: {
    fontFamily: typography.fonts.ui,
    fontSize: 13,
    color: colors.primary.deepForest,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.8,
  },
});
