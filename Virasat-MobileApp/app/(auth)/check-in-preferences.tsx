import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
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
import { getCheckInStatus, updateCheckInSettings, type CheckInPolicy } from '@/src/api/check-in.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';
import { useSubscription } from '@/src/store/subscription.slice';
import { Feature } from '@/src/types/subscription.types';
import { UpgradeModal } from '@/src/components/UpgradeModal';

export default function CheckInPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const email = useAppSelector((state) => state.session.user?.email);
  const { canUseFeature } = useSubscription();
  const hasCustomCheckIn = canUseFeature(Feature.CUSTOM_CHECK_IN);
  const [initialPolicy, setInitialPolicy] = useState<CheckInPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    setError('');
    void getCheckInStatus().then(({ policy }) => {
      if (!active) return;
      setInitialPolicy(policy);
      setPreferredTime(policy.preferredTime);
      setSelectedSchedule(policy.cadence);
    }).catch((reason) => {
      if (!active) return;
      if (isAxiosError(reason) && reason.response?.status === 404) {
        setInitialPolicy(null);
      } else {
        setLoadFailed(true);
        setError(getApiErrorMessage(reason, 'Could not load your saved settings. Retry before editing.'));
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  const selectPreferredTime = () => {
    Alert.alert('Preferred time', 'Choose when to receive your check-in reminder.', [
      { text: '8:00 AM', onPress: () => setPreferredTime('08:00') },
      { text: '10:00 AM', onPress: () => setPreferredTime('10:00') },
      { text: '6:00 PM', onPress: () => setPreferredTime('18:00') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleContinue = async () => {
    if (loading || loadFailed || saving) return;
    try {
      setSaving(true);
      setError('');
      await updateCheckInSettings({
        cadence: initialPolicy?.cadence === selectedSchedule ? undefined : selectedSchedule,
        preferredTime,
        timezone: initialPolicy?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        reminderConfig: {
          channels: ['EMAIL'],
          reminderDaysBefore: initialPolicy?.cadence === selectedSchedule ? initialPolicy.reminderConfig.reminderDaysBefore : selectedSchedule === 'WEEKLY' ? [3, 1] : [7, 3, 1],
        },
        escalationEnabled: initialPolicy?.escalationEnabled ?? false,
      });
      await dispatch(refreshVaultData()).unwrap();
      router.push('/(auth)/release-rules');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not save your check-in settings. Please try again.'));
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

        {/* Heading */}

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>
            CHECK-IN PREFERENCES
          </Text>

          <Text style={styles.title}>
            Stay connected with Virasat.
          </Text>

          <Text style={styles.subtitle}>
            Save your check-in preferences and confirm activity in the app. Automatic email reminders and escalation are not available yet.
          </Text>
        </View>

        {/* Frequency */}

        <Text style={styles.sectionLabel}>
          CHECK-IN FREQUENCY
        </Text>

        <Pressable
          onPress={() => setSelectedSchedule('MONTHLY')}
          style={[styles.frequencyCard, selectedSchedule === 'MONTHLY' && styles.frequencyCardSelected]}
        >
          <View style={[styles.checkCircle, selectedSchedule === 'MONTHLY' && styles.checkCircleSelected]}>
            <Text style={[styles.check, selectedSchedule === 'MONTHLY' && styles.checkSelected]}>
              ✓
            </Text>
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              Every month
            </Text>

            <Text style={styles.optionSubtitle}>
              Standard monthly schedule · Recommended
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            if (!hasCustomCheckIn) {
              setCustomModalVisible(true);
            } else {
              setSelectedSchedule('WEEKLY');
            }
          }}
          style={[styles.frequencyCard, selectedSchedule === 'WEEKLY' && styles.frequencyCardSelected]}
        >
          <View style={[styles.checkCircle, selectedSchedule === 'WEEKLY' && styles.checkCircleSelected]}>
            <Text style={[styles.check, selectedSchedule === 'WEEKLY' && styles.checkSelected]}>
              {hasCustomCheckIn && selectedSchedule === 'WEEKLY' ? '✓' : '🔒'}
            </Text>
          </View>

          <View style={styles.optionContent}>
            <View style={styles.customScheduleTitleRow}>
              <Text style={styles.optionTitle}>
                Custom Schedule
              </Text>
              {!hasCustomCheckIn && (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockBadgeText}>SECURE</Text>
                </View>
              )}
            </View>

            <Text style={styles.optionSubtitle}>
              {hasCustomCheckIn ? 'Weekly check-in cadence' : 'Weekly cadence requires Secure or Family'}
            </Text>
          </View>
        </Pressable>

        {/* Schedule */}

        <Text style={styles.sectionLabel}>
          SCHEDULE
        </Text>

        <View style={styles.selectCard}>
          <View>
            <Text style={styles.selectValue}>
              {selectedSchedule === 'WEEKLY' ? 'Weekly check-in' : 'Monthly check-in'}
            </Text>
          </View>
        </View>

        {/* Time */}

        <Text style={styles.sectionLabel}>
          PREFERRED TIME
        </Text>

        <Pressable onPress={selectPreferredTime} style={styles.selectCard}>
          <Text style={styles.selectValue}>
            {new Date(`2000-01-01T${preferredTime}`).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>

          <Text style={styles.chevron}>
            ›
          </Text>
        </Pressable>

        {/* Contact */}

        <Text style={styles.sectionLabel}>
          HOW SHOULD WE CONTACT YOU?
        </Text>

        <View style={styles.contactCard}>
          <ContactOption
            selected
            title="Email"
            subtitle={email ?? 'Your account email'}
          />
        </View>

        {/* Response Window */}

        <Text style={styles.sectionLabel}>
          REMINDER WINDOW
        </Text>

        <View style={styles.selectCard}>
          <Text style={styles.selectValue}>
            {selectedSchedule === 'WEEKLY' ? '3 and 1 days before (planned)' : '7, 3 and 1 days before (planned)'}
          </Text>
        </View>

        {/* Information */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoText}>
              i
            </Text>
          </View>

          <Text style={styles.infoDescription}>
            These preferences are saved for future reminders. Missing a check-in does not release your information. Automated reminders, escalation, and inheritance release are unavailable.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {loading && <ActivityIndicator />}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {loadFailed && <Pressable onPress={() => setRetry((value) => value + 1)}><Text style={{ color: colors.primary.forest, paddingVertical: 12 }}>Retry loading settings</Text></Pressable>}

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

      <UpgradeModal
        visible={customModalVisible}
        onClose={() => setCustomModalVisible(false)}
        title="Custom Check-in"
        message="Available with Virasat Secure."
        benefits={[
          'Choose your own check-in schedule',
          'Customize your grace period',
          'Get advanced reminder controls',
          'Ensure continuity at your own pace',
        ]}
        ctaText="Upgrade to Secure"
        onCtaPress={() => router.push('/(auth)/plans' as never)}
        secondaryCtaText="Not now"
      />
    </SafeAreaView>
  );
}

function ContactOption({
  selected = false,
  title,
  subtitle,
}: {
  selected?: boolean;
  title: string;
  subtitle?: string;
}) {
  return (
    <Pressable style={styles.contactOption}>
      <View
        style={[
          styles.radio,
          selected && styles.radioSelected,
        ]}
      >
        {selected && (
          <View style={styles.radioDot} />
        )}
      </View>

      <View style={styles.contactContent}>
        <Text style={styles.contactTitle}>
          {title}
        </Text>

        {subtitle && (
          <Text style={styles.contactSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
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
    marginBottom: 21,
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

  sectionLabel: {
    marginTop: 17,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.1,
    color: colors.neutral.textMuted,
  },

  selectedCard: {
    minHeight: 57,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    flexDirection: 'row',
    alignItems: 'center',
  },

  frequencyCard: {
    minHeight: 57,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  frequencyCardSelected: {
    backgroundColor: colors.brand.mint,
    borderColor: colors.primary.forest,
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5EBE8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircleSelected: {
    backgroundColor: colors.primary.forest,
  },

  check: {
    color: colors.neutral.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  checkSelected: {
    color: colors.neutral.white,
  },

  customScheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  lockBadge: {
    backgroundColor: colors.primary.deepForest,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },

  lockBadgeText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    color: colors.neutral.white,
    letterSpacing: 0.5,
  },

  optionContent: {
    marginLeft: 11,
  },

  optionTitle: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11.5,
    color: colors.primary.deepForest,
  },

  optionSubtitle: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    color: colors.primary.forest,
  },

  selectCard: {
    height: 52,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectValue: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },

  chevron: {
    fontSize: 23,
    fontWeight: '300',
    color: colors.primary.forest,
  },

  contactCard: {
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    overflow: 'hidden',
  },

  contactOption: {
    minHeight: 55,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.neutral.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioSelected: {
    borderColor: colors.primary.forest,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary.forest,
  },

  contactContent: {
    marginLeft: 11,
  },

  contactTitle: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },

  contactSubtitle: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9,
    color: colors.neutral.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginLeft: 44,
  },

  infoCard: {
    marginTop: 19,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
  },

  infoIcon: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.primary.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.primary.forest,
  },

  infoDescription: {
    flex: 1,
    marginLeft: 9,
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
