import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { listRecipients, type Recipient } from '@/src/api/recipients.api';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useSubscription } from '@/src/store/subscription.slice';
import { UpgradeModal } from '@/src/components/UpgradeModal';
import { PlanLimit } from '@/src/types/subscription.types';

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const { currentPlan, getLimit } = useSubscription();
  const [people, setPeople] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    listRecipients()
      .then((value) => {
        if (active) setPeople(value);
      })
      .catch((reason: unknown) => {
        if (active) setError(getApiErrorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Active', bg: colors.brand.mint, text: colors.primary.deepForest };
      case 'PRIVATE':
        return { label: 'Private · Silent', bg: '#F1F3F5', text: colors.neutral.textSecondary };
      case 'REVOKED':
        return { label: 'Revoked', bg: '#FDE8E8', text: '#9B1C1C' };
      default:
        return { label: 'Pending', bg: '#FEF3C7', text: '#92400E' };
    }
  };

  const activePeople = people.filter((person) => person.status !== 'REVOKED');
  const trustedPersonLimit = getLimit(PlanLimit.TRUSTED_PERSONS) ?? 1;
  const isOverLimit = activePeople.length > trustedPersonLimit;
  const isAtAllowedLimit = activePeople.length >= trustedPersonLimit;

  const handleAddPerson = () => {
    if (isAtAllowedLimit) {
      setUpgradeModalVisible(true);
    } else {
      router.push('/(auth)/trusted-person');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace('/(auth)/home')}
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.brand}>VIRASAT</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>TRUSTED CONTACTS</Text>
          <Text style={styles.title}>Your Trusted Circle</Text>
          <Text style={styles.subtitle}>
            Recipients only receive access when your release conditions are met.
            Adding a person does not notify them unless you explicitly choose to.
          </Text>
        </View>

        {isOverLimit && (
          <View style={styles.overLimitBanner}>
            <Text style={styles.overLimitIcon}>ℹ</Text>
            <View style={styles.overLimitContent}>
              <Text style={styles.overLimitTitle}>Preserved Configuration</Text>
              <Text style={styles.overLimitText}>
                Your current {currentPlan?.name ?? 'Starter'} plan supports {trustedPersonLimit} Trusted Person{trustedPersonLimit > 1 ? 's' : ''}. Your existing Trusted Persons remain preserved, but you cannot add new ones until you upgrade or reduce the number of active Trusted Persons.
              </Text>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary.deepForest} size="small" />
            <Text style={styles.loadingText}>Loading contacts…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => setRetry((v) => v + 1)}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && people.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>👤</Text>
            </View>
            <Text style={styles.emptyTitle}>No trusted contacts yet</Text>
            <Text style={styles.emptySubtitle}>
              Designate family members or trusted advisors to safely receive parts of your legacy.
            </Text>
          </View>
        ) : null}

        {people.map((person) => {
          const badge = getStatusBadge(person.status);
          const initials = (person.name || '?')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <Pressable
              key={person.id}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.personCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/(auth)/trusted-person',
                  params: { recipientId: person.id },
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.personInfo}>
                <View style={styles.personHeader}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {person.email ? (
                  <Text style={styles.personDetail}>{person.email}</Text>
                ) : null}
                {person.phone ? (
                  <Text style={styles.personDetail}>{person.phone}</Text>
                ) : null}

                <View style={styles.personFooter}>
                  <Text style={styles.securityTag}>
                    🔒 {person.verificationRequired ? 'ID Verification Required' : 'Direct Authorized Access'}
                  </Text>
                </View>
              </View>

              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={handleAddPerson}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Add Trusted Person</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </Pressable>
      </View>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        title="Protect More People"
        message={`Your ${currentPlan?.name ?? 'Starter'} plan supports ${trustedPersonLimit} Trusted Person${trustedPersonLimit > 1 ? 's' : ''}.\n\nSecure supports up to 3.\nFamily supports up to 8.`}
        benefits={[
          'Appoint up to 3 Trusted Persons on Secure',
          'Appoint up to 8 Trusted Persons on Family',
          'Assign individual items to specific people',
          'Preserve all records and contacts safely',
        ]}
        ctaText="View Plans"
        onCtaPress={() => router.push('/(auth)/plans' as never)}
        secondaryCtaText="Not now"
      />
    </SafeAreaView>
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
    left: 24,
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  heading: {
    marginTop: 14,
    marginBottom: 20,
  },
  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary.forest,
  },
  title: {
    marginTop: 6,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 27,
    lineHeight: 34,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },
  overLimitBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    marginBottom: 8,
    gap: 10,
  },
  overLimitIcon: {
    fontSize: 18,
    color: '#92400E',
    marginTop: 1,
  },
  overLimitContent: {
    flex: 1,
  },
  overLimitTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: '#92400E',
    marginBottom: 2,
  },
  overLimitText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 17,
    color: '#78350F',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textMuted,
  },
  errorCard: {
    backgroundColor: '#FDE8E8',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F8B4B4',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    color: '#9B1C1C',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#9B1C1C',
    borderRadius: 8,
  },
  retryText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.neutral.white,
  },
  emptyCard: {
    backgroundColor: colors.neutral.white,
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIcon: {
    fontSize: 26,
  },
  emptyTitle: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 18,
    color: colors.primary.deepForest,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.neutral.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  personCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: '#FAF9F5',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.primary.deepForest,
  },
  personInfo: {
    flex: 1,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  personName: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.primary.deepForest,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
  },
  personDetail: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textSecondary,
    marginTop: 1,
  },
  personFooter: {
    marginTop: 6,
  },
  securityTag: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 10.5,
    color: colors.primary.forest,
  },
  chevron: {
    fontSize: 22,
    color: colors.neutral.textMuted,
    marginLeft: 8,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
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
