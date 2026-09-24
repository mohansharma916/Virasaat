import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { SelectInput } from '@/src/components/SelectInput';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getProfile, updateProfile } from '@/src/api/users.api';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    country?: string;
    language?: string;
  }>({});

  useEffect(() => {
    let active = true;

    void getProfile()
      .then((profile) => {
        if (!active) {
          return;
        }

        setName(profile.name ?? '');
        setCountry(profile.country ?? '');
        setLanguage(profile.preferredLanguage ?? '');
      })
      .catch(() => {
        // The form remains available even if a profile refresh is delayed.
      });

    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }

    if (!country) {
      newErrors.country = 'Please select your country.';
    }

    if (!language) {
      newErrors.language =
        'Please select your preferred language.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');
      await updateProfile({
        name: name.trim(),
        country,
        preferredLanguage: language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      });
      router.replace('/(auth)/trusted-person-intro');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'We could not save your profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const selectCountry = () => {
    Alert.alert(
      'Select country',
      '',
      [
        {
          text: 'India',
          onPress: () => {
            setCountry('India');
            setErrors((previous) => ({
              ...previous,
              country: undefined,
            }));
          },
        },
        {
          text: 'United States',
          onPress: () => {
            setCountry('United States');
            setErrors((previous) => ({
              ...previous,
              country: undefined,
            }));
          },
        },
        {
          text: 'United Kingdom',
          onPress: () => {
            setCountry('United Kingdom');
            setErrors((previous) => ({
              ...previous,
              country: undefined,
            }));
          },
        },
        {
          text: 'Canada',
          onPress: () => {
            setCountry('Canada');
            setErrors((previous) => ({
              ...previous,
              country: undefined,
            }));
          },
        },
        {
          text: 'Australia',
          onPress: () => {
            setCountry('Australia');
            setErrors((previous) => ({
              ...previous,
              country: undefined,
            }));
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const selectLanguage = () => {
    Alert.alert(
      'Preferred language',
      '',
      [
        {
          text: 'English',
          onPress: () => {
            setLanguage('English');
            setErrors((previous) => ({
              ...previous,
              language: undefined,
            }));
          },
        },
        {
          text: 'Hindi',
          onPress: () => {
            setLanguage('Hindi');
            setErrors((previous) => ({
              ...previous,
              language: undefined,
            }));
          },
        },
        {
          text: 'Tamil',
          onPress: () => {
            setLanguage('Tamil');
            setErrors((previous) => ({
              ...previous,
              language: undefined,
            }));
          },
        },
        {
          text: 'Telugu',
          onPress: () => {
            setLanguage('Telugu');
            setErrors((previous) => ({
              ...previous,
              language: undefined,
            }));
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={styles.brand}>
            VIRASAT
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <ProgressDot active />
          <ProgressLine active />
          <ProgressDot active />
          <ProgressLine active />
          <ProgressDot active />
          <ProgressLine active />
          <ProgressDot active />
          <ProgressLine />
          <ProgressDot />
          <ProgressLine />
          <ProgressDot />
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>
            Complete your profile
          </Text>

          <Text style={styles.subtitle}>
            Tell us a little about yourself.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full name"
            placeholder="Your full name"
            value={name}
            onChangeText={(value) => {
              setName(value);

              if (errors.name) {
                setErrors((previous) => ({
                  ...previous,
                  name: undefined,
                }));
              }
            }}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="done"
          />

          <SelectInput
            label="Country"
            placeholder="Select your country"
            value={country}
            onPress={selectCountry}
          />

          {errors.country && (
            <Text style={styles.error}>
              {errors.country}
            </Text>
          )}

          <SelectInput
            label="Preferred language"
            placeholder="Select your language"
            value={language}
            onPress={selectLanguage}
          />

          {errors.language && (
            <Text style={styles.error}>
              {errors.language}
            </Text>
          )}
        </View>

        {/* Privacy information */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>
              i
            </Text>
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Why we ask this
            </Text>

            <Text style={styles.infoText}>
              This information helps us keep your
              account accurate and provide the
              right experience for you.
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            loading={loading}
          />
        </View>

        {submitError ? (
          <Text style={styles.error}>{submitError}</Text>
        ) : null}

        <Text style={styles.footerText}>
          You can edit this information later
          from Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressDot({
  active = false,
}: {
  active?: boolean;
}) {
  return (
    <View
      style={[
        styles.progressDot,
        active && styles.progressDotActive,
      ]}
    />
  );
}

function ProgressLine({
  active = false,
}: {
  active?: boolean;
}) {
  return (
    <View
      style={[
        styles.progressLine,
        active && styles.progressLineActive,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 35,
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
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 34,
    lineHeight: 36,
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
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.neutral.border,
  },

  progressDotActive: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary.forest,
  },

  progressLine: {
    width: 24,
    height: 1,
    marginHorizontal: 4,
    backgroundColor: colors.neutral.border,
  },

  progressLineActive: {
    backgroundColor: colors.primary.forest,
  },

  heading: {
    marginTop: 38,
    marginBottom: 30,
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 31,
    lineHeight: 40,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 9,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.neutral.textSecondary,
  },

  form: {
    width: '100%',
  },

  error: {
    marginTop: -12,
    marginBottom: 18,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: '#B42318',
  },

  infoCard: {
    flexDirection: 'row',
    marginTop: 8,
    padding: 15,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.brand.sage,
  },

  infoIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoIconText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.primary.forest,
  },

  infoContent: {
    flex: 1,
    marginLeft: 10,
  },

  infoTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.primary.deepForest,
  },

  infoText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textSecondary,
  },

  buttonContainer: {
    marginTop: 28,
  },

  footerText: {
    marginTop: 16,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },

});
