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
import { PlanCode } from '@/src/types/subscription.types';
import { useSubscription } from '@/src/store/subscription.slice';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const { currentPlan, purchasePlan, restorePurchases, refreshSubscription } =
    useSubscription();
  const [purchasingPlan, setPurchasingPlan] = useState<PlanCode | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handleSelectPlan = async (planCode: PlanCode) => {
    if (planCode === PlanCode.STARTER) {
      Alert.alert(
        'Starter Plan',
        'You are already on the Starter plan. To upgrade your limits, select Secure or Family.',
      );
      return;
    }

    if (currentPlan?.code === planCode) {
      Alert.alert(
        'Current Plan',
        `You are currently subscribed to Virasat ${currentPlan.name}.`,
      );
      return;
    }

    try {
      setPurchasingPlan(planCode);
      await purchasePlan(planCode);
      await refreshSubscription();
      Alert.alert(
        'Upgrade Successful',
        `Welcome to Virasat ${planCode === PlanCode.FAMILY ? 'Family' : 'Secure'}! Your new entitlements are now active.`,
        [{ text: 'Continue', onPress: () => router.replace('/(auth)/home') }],
      );
    } catch (error) {
      Alert.alert(
        'Subscription Failed',
        getApiErrorMessage(error, 'We were unable to complete your subscription. Please try again.'),
      );
    } finally {
      setPurchasingPlan(null);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      await restorePurchases();
      await refreshSubscription();
      Alert.alert(
        'Purchases Restored',
        'Your subscription status has been verified with your store account.',
      );
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        getApiErrorMessage(error, 'Could not restore prior purchases.'),
      );
    } finally {
      setRestoring(false);
    }
  };

  const isStarter = !currentPlan || currentPlan.code === PlanCode.STARTER;
  const isSecure = currentPlan?.code === PlanCode.SECURE;
  const isFamily = currentPlan?.code === PlanCode.FAMILY;

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
          <Text style={styles.eyebrow}>PLANS & PROTECTION</Text>
          <Text style={styles.title}>Choose Your Legacy Shield</Text>
          <Text style={styles.subtitle}>
            Every tier provides a secure baseline release workflow. Higher plans
            provide more trusted persons, multi-party verifiers, and customization.
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
                <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceAmount}>0</Text>
            <Text style={styles.pricePeriod}>/ forever</Text>
          </View>

          <View style={styles.featureList}>
            <FeatureItem text="1 Trusted Person" />
            <FeatureItem text="Standard monthly check-in" />
            <FeatureItem text="Standard release policy" />
            <FeatureItem text="Up to 3 written messages & 1 video message" />
            <FeatureItem text="Basic activity history" />
          </View>

          <Pressable
            disabled
            style={[styles.planButton, styles.planButtonDisabled]}
          >
            <Text style={styles.planButtonDisabledText}>
              {isStarter ? 'Active Tier' : 'Free Baseline'}
            </Text>
          </Pressable>
        </View>

        {/* 2. SECURE PLAN */}
        <View style={[styles.planCard, styles.popularCard, isSecure && styles.currentPlanBorder]}>
          <View style={styles.recommendTag}>
            <Text style={styles.recommendTagText}>Recommended for Individuals</Text>
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
                <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceAmount}>999</Text>
            <Text style={styles.pricePeriod}>/ year</Text>
          </View>

          <View style={styles.featureList}>
            <FeatureItem text="Up to 3 Trusted Persons" highlight />
            <FeatureItem text="Custom check-in frequency & schedules" highlight />
            <FeatureItem text="Customizable grace period" highlight />
            <FeatureItem text="Recipient verification options" highlight />
            <FeatureItem text="Item-level recipient assignment" highlight />
            <FeatureItem text="Unlimited written personal messages" />
            <FeatureItem text="Up to 10 personal video messages" />
            <FeatureItem text="Full activity history & logs" />
          </View>

          <Pressable
            disabled={isSecure || purchasingPlan !== null}
            onPress={() => handleSelectPlan(PlanCode.SECURE)}
            style={({ pressed }) => [
              styles.planButton,
              styles.planButtonPrimary,
              isSecure && styles.planButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {purchasingPlan === PlanCode.SECURE ? (
              <ActivityIndicator color={colors.neutral.white} />
            ) : (
              <Text style={styles.planButtonPrimaryText}>
                {isSecure ? 'Current Plan' : 'Upgrade to Secure'}
              </Text>
            )}
          </Pressable>
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
                <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceAmount}>2,499</Text>
            <Text style={styles.pricePeriod}>/ year</Text>
          </View>

          <View style={styles.featureList}>
            <FeatureItem text="Up to 8 Trusted Persons" highlight />
            <FeatureItem text="Advanced release policies" highlight />
            <FeatureItem text="Multiple independent verifiers" highlight />
            <FeatureItem text="Multi-person verification workflow" highlight />
            <FeatureItem text="Advanced escalation rules" highlight />
            <FeatureItem text="Family & emergency instructions" highlight />
            <FeatureItem text="Up to 50 personal video messages" />
            <FeatureItem text="Priority support & future family vault readiness" />
          </View>

          <Pressable
            disabled={isFamily || purchasingPlan !== null}
            onPress={() => handleSelectPlan(PlanCode.FAMILY)}
            style={({ pressed }) => [
              styles.planButton,
              styles.planButtonPrimary,
              isFamily && styles.planButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {purchasingPlan === PlanCode.FAMILY ? (
              <ActivityIndicator color={colors.neutral.white} />
            ) : (
              <Text style={styles.planButtonPrimaryText}>
                {isFamily ? 'Current Plan' : 'Upgrade to Family'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Restore purchases & calm notice */}
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={handleRestore}
            disabled={restoring}
            style={styles.restoreButton}
          >
            {restoring ? (
              <ActivityIndicator size="small" color={colors.primary.deepForest} />
            ) : (
              <Text style={styles.restoreText}>Restore Existing Purchases</Text>
            )}
          </Pressable>

          <Text style={styles.disclaimerText}>
            Subscriptions auto-renew annually. You can manage or cancel your
            subscription anytime in your app store settings. Your legacy records
            and release policies are never deleted upon plan expiration or downgrade.
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
        <Text style={styles.checkIcon}>✓</Text>
      </View>
      <Text style={[styles.featureText, highlight && styles.featureTextHighlight]}>
        {text}
      </Text>
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
    marginBottom: 24,
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
    fontFamily: typography.fonts.ui,
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral.white,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 12,
  },
  planName: {
    fontFamily: typography.fonts.display,
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral.textPrimary,
  },
  planSubtitle: {
    fontFamily: typography.fonts.ui,
    fontSize: 13,
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
    fontFamily: typography.fonts.ui,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary.deepForest,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F2',
  },
  priceCurrency: {
    fontFamily: typography.fonts.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral.textPrimary,
  },
  priceAmount: {
    fontFamily: typography.fonts.display,
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral.textPrimary,
  },
  pricePeriod: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
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
    backgroundColor: '#E5EBE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleHighlight: {
    backgroundColor: colors.brand.mint,
  },
  checkIcon: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary.deepForest,
  },
  featureText: {
    flex: 1,
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    color: colors.neutral.textSecondary,
    lineHeight: 19,
  },
  featureTextHighlight: {
    color: colors.neutral.textPrimary,
    fontWeight: '500',
  },
  planButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonPrimary: {
    backgroundColor: colors.primary.deepForest,
  },
  planButtonPrimaryText: {
    fontFamily: typography.fonts.ui,
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  planButtonDisabled: {
    backgroundColor: '#ECEFEF',
  },
  planButtonDisabledText: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    gap: 14,
  },
  restoreButton: {
    paddingVertical: 10,
  },
  restoreText: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.deepForest,
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    fontFamily: typography.fonts.ui,
    fontSize: 12,
    color: colors.neutral.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
