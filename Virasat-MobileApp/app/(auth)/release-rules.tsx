import { useState } from 'react';
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
import { updateReleasePolicy } from '@/src/api/release.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';

export default function ReleaseRulesScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(true);

  const handleContinue = async () => {
    try {
      setSaving(true);
      setError('');
      await updateReleasePolicy({
        trigger: 'CHECK_IN_ESCALATION',
        verificationRequired,
        verificationLevel: 'STANDARD',
        escalationConfig: {
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
            Decide when Virasat should start
            looking for you.
          </Text>

          <Text style={styles.subtitle}>
            Your information will never be released
            simply because you missed a check-in.
          </Text>
        </View>

        {/* Monthly Check-in */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              MONTHLY CHECK-IN
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
                Every month
              </Text>

              <Text style={styles.checkInText}>
                Virasat will send you a check-in
                notification.
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
          MISSED CHECK-INS
        </Text>

        <View style={styles.timeline}>
          <TimelineItem
            number="1"
            title="1st missed check-in"
            description="Reminder"
            last={false}
          />

          <TimelineItem
            number="2"
            title="2nd missed check-in"
            description="Urgent reminder"
            last={false}
          />

          <TimelineItem
            number="3"
            title="3rd missed check-in"
            description="Verification begins"
            last
          />
        </View>

        {/* Verification */}

        <Text style={styles.sectionTitle}>
          AFTER 3 MISSED CHECK-INS
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
              Your legacy information will only
              become accessible after the required
              verification process is completed.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={saving}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            saving && styles.buttonDisabled,
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
