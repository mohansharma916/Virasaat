import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
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

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getReleasePolicy, updateReleasePolicy, type ReleasePolicy } from '@/src/api/release.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';

export default function ReleaseRulesScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [initialPolicy, setInitialPolicy] = useState<ReleasePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    setError('');
    void getReleasePolicy().then((policy) => {
      if (!active) return;
      setInitialPolicy(policy);
      setVerificationRequired(policy?.verificationRequired ?? true);
    }).catch((reason) => {
      if (!active) return;
      if (isAxiosError(reason) && reason.response?.status === 404) setInitialPolicy(null);
      else {
        setLoadFailed(true);
        setError(getApiErrorMessage(reason, 'Could not load your saved policy. Retry before editing.'));
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  const handleContinue = async () => {
    if (loading || loadFailed || saving) return;
    try {
      setSaving(true);
      setError('');
      await updateReleasePolicy({
        trigger: initialPolicy?.trigger ?? 'CHECK_IN_ESCALATION',
        verificationRequired,
        verificationLevel: initialPolicy?.verificationLevel ?? 'STANDARD',
        escalationConfig: initialPolicy?.escalationConfig ?? {
          missedCheckInsBeforeReview: 3,
          manualReviewRequired: true,
        },
        enabled: true,
      });
      await dispatch(refreshVaultData()).unwrap();
      router.replace('/(auth)/home');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not save your release plan. Please try again.'));
    } finally {
      setSaving(false);
    }
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

        <View style={{ paddingVertical: 16 }}>
          <Text style={{ fontSize: 18 }}>Recipient identity verification</Text>
          <Text>Authentication always applies. This preference affects new assignments; existing assigned policies stay unchanged.</Text>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: verificationRequired }} onPress={() => setVerificationRequired(!verificationRequired)} style={{ paddingVertical: 16 }}>
            <Text>{verificationRequired ? '✓ Required' : '○ Not required'} — tap to change</Text>
          </Pressable>
        </View>

        {/* Heading */}

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>
            RELEASE RULES
          </Text>

          <Text style={styles.title}>
            Save your release preferences.
          </Text>

          <Text style={styles.subtitle}>
            These preferences guide future release workflows. Automatic escalation, recipient verification, and inheritance release are not available yet.
          </Text>
        </View>

        {/* Monthly Check-in */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              CHECK-IN PREFERENCES
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  '/(auth)/check-in-preferences',
                )
              }
            >
              <Text style={styles.edit}>
                Edit
              </Text>
            </Pressable>
          </View>

          <View style={styles.checkInRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>
                ✓
              </Text>
            </View>

            <View style={styles.checkInContent}>
              <Text style={styles.checkInTitle}>
                View your saved schedule
              </Text>

              <Text style={styles.checkInText}>
                You can confirm activity in the app. Automated notifications are unavailable.
              </Text>
            </View>
          </View>

          <View style={styles.activeBox}>
            <Text style={styles.activeQuote}>
              "I'm safe & active"
            </Text>
          </View>
        </View>

        {/* Missed Check-ins */}

        <Text style={styles.sectionTitle}>
          PLANNED MISSED CHECK-IN PROCESS
        </Text>

        <View style={styles.timeline}>
          <TimelineItem
            number="1"
            title="1st missed check-in"
            description="Planned reminder · unavailable"
            last={false}
          />

          <TimelineItem
            number="2"
            title="2nd missed check-in"
            description="Planned urgent reminder · unavailable"
            last={false}
          />

          <TimelineItem
            number="3"
            title="3rd missed check-in"
            description="Planned verification · unavailable"
            last
          />
        </View>

        {/* Verification */}

        <Text style={styles.sectionTitle}>
          FUTURE RELEASE WORKFLOW
        </Text>

        <View style={styles.processCard}>
          <ProcessRow
            number="01"
            title="Contact you"
            description="We'll try multiple available channels."
          />

          <ProcessRow
            number="02"
            title="Send verification notifications"
            description="You'll have an opportunity to confirm you're active."
          />

          <ProcessRow
            number="03"
            title="Contact trusted person"
            description="Only if we still cannot reach you."
          />

          <ProcessRow
            number="04"
            title="Begin secure review"
            description="The release process requires additional verification."
          />
        </View>

        {/* Security */}

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Text style={styles.lock}>
              🔐
            </Text>
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Release protection
            </Text>

            <Text style={styles.securityText}>
              Your records remain private. Saving these preferences does not activate reminders, notify recipients, or release any content.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {loading && <ActivityIndicator />}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {loadFailed && <Pressable onPress={() => setRetry((value) => value + 1)}><Text style={styles.edit}>Retry loading policy</Text></Pressable>}

        <Pressable
          disabled={saving || loading || loadFailed}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            (saving || loading || loadFailed) && styles.buttonDisabled,
            pressed && !saving && styles.buttonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.neutral.white} />
          ) : (
            <>
              <Text style={styles.buttonText}>
                Continue
              </Text>

              <Text style={styles.buttonArrow}>
                →
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function TimelineItem({
  number,
  title,
  description,
  last,
}: {
  number: string;
  title: string;
  description: string;
  last: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={styles.numberCircle}>
          <Text style={styles.numberText}>
            {number}
          </Text>
        </View>

        {!last && (
          <View style={styles.timelineLine} />
        )}
      </View>

      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>
          {title}
        </Text>

        <Text style={styles.timelineDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function ProcessRow({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.processRow}>
      <Text style={styles.processNumber}>
        {number}
      </Text>

      <View style={styles.processContent}>
        <Text style={styles.processTitle}>
          {title}
        </Text>

        <Text style={styles.processDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 45,
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
    backgroundColor: colors.primary.forest,
  },

  progressItemActive: {
    backgroundColor: colors.primary.forest,
  },

  heading: {
    marginTop: 35,
    marginBottom: 22,
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
    fontSize: 28,
    lineHeight: 37,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 9,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },

  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.neutral.textMuted,
  },

  edit: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 10,
    color: colors.primary.forest,
  },

  checkInRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 17,
    color: colors.primary.forest,
  },

  checkInContent: {
    flex: 1,
    marginLeft: 11,
  },

  checkInTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },

  checkInText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    lineHeight: 15,
    color: colors.neutral.textSecondary,
  },

  activeBox: {
    marginTop: 13,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
  },

  activeQuote: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 10.5,
    color: colors.primary.forest,
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.neutral.textMuted,
  },

  timeline: {
    paddingLeft: 4,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 67,
  },

  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },

  numberCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
    color: colors.primary.deepForest,
  },

  timelineLine: {
    flex: 1,
    width: 1,
    marginVertical: 4,
    backgroundColor: colors.brand.sage,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 2,
  },

  timelineTitle: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11.5,
    color: colors.neutral.textPrimary,
  },

  timelineDescription: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    color: colors.neutral.textSecondary,
  },

  processCard: {
    padding: 15,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  processRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },

  processNumber: {
    width: 27,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    color: colors.primary.forest,
  },

  processContent: {
    flex: 1,
  },

  processTitle: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },

  processDescription: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    lineHeight: 15,
    color: colors.neutral.textSecondary,
  },

  securityCard: {
    marginTop: 18,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
  },

  securityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lock: {
    fontSize: 13,
  },

  securityContent: {
    flex: 1,
    marginLeft: 10,
  },

  securityTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10.5,
    color: colors.neutral.textPrimary,
  },

  securityText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    lineHeight: 15,
    color: colors.neutral.textSecondary,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  button: {
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

  buttonDisabled: {
    opacity: 0.6,
  },

  error: {
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: '#B42318',
  },

  buttonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.white,
  },

  buttonArrow: {
    marginLeft: 9,
    fontSize: 18,
    color: colors.neutral.white,
  },
});
