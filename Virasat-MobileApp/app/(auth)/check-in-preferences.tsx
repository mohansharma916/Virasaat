import { useState } from 'react';
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
import { updateCheckInSettings } from '@/src/api/check-in.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';

export default function CheckInPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const email = useAppSelector((state) => state.session.user?.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00');

  const selectPreferredTime = () => {
    Alert.alert('Preferred time', 'Choose when to receive your check-in reminder.', [
      { text: '8:00 AM', onPress: () => setPreferredTime('08:00') },
      { text: '10:00 AM', onPress: () => setPreferredTime('10:00') },
      { text: '6:00 PM', onPress: () => setPreferredTime('18:00') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleContinue = async () => {
    try {
      setSaving(true);
      setError('');
      await updateCheckInSettings({
        cadence: 'MONTHLY',
        preferredTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        reminderConfig: {
          channels: ['EMAIL'],
          reminderDaysBefore: [7, 3, 1],
        },
        escalationEnabled: true,
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
            We'll periodically check that you're safe
            and your account is still active.
          </Text>
        </View>

        {/* Frequency */}

        <Text style={styles.sectionLabel}>
          CHECK-IN FREQUENCY
        </Text>

        <View style={styles.selectedCard}>
          <View style={styles.checkCircle}>
            <Text style={styles.check}>
              ✓
            </Text>
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              Every month
            </Text>

            <Text style={styles.optionSubtitle}>
              Recommended
            </Text>
          </View>
        </View>

        {/* Schedule */}

        <Text style={styles.sectionLabel}>
          SCHEDULE
        </Text>

        <View style={styles.selectCard}>
          <View>
            <Text style={styles.selectValue}>
              Monthly check-in
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
            Email reminders 7, 3 and 1 days before
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
            Missing a check-in does not
            automatically release your information.
            Virasat follows a separate verification
            process.
          </Text>
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

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    color: colors.neutral.white,
    fontSize: 12,
    fontWeight: '600',
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
