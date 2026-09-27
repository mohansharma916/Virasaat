import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { SelectInput } from '@/src/components/SelectInput';
import {
  SearchablePickerModal,
  type PickerItem,
} from '@/src/components/SearchablePickerModal';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getProfile, updateProfile } from '@/src/api/users.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { setSessionUser } from '@/src/store/session.slice';
import {
  findCountry,
  findLanguage,
  getAllCountries,
  getAllLanguages,
  getPopularCountries,
  getPopularLanguages,
} from '@/src/utils/geo-data';

export default function ProfileScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const countryPickerItems = useMemo<PickerItem[]>(() => {
    return getAllCountries().map((c) => ({
      id: c.code,
      title: c.name,
      subtitle: c.native !== c.name ? `${c.native} • ${c.code}` : c.code,
      badge: c.code,
      icon: c.flag,
      searchTerms: c.searchTerms,
    }));
  }, []);

  const popularCountryItems = useMemo<PickerItem[]>(() => {
    return getPopularCountries().map((c) => ({
      id: c.code,
      title: c.name,
      subtitle: c.native !== c.name ? `${c.native} • ${c.code}` : c.code,
      badge: c.code,
      icon: c.flag,
      searchTerms: c.searchTerms,
    }));
  }, []);

  const languagePickerItems = useMemo<PickerItem[]>(() => {
    return getAllLanguages().map((l) => ({
      id: l.code,
      title: l.name,
      subtitle: l.nativeName !== l.name ? `${l.nativeName} • ${l.code}` : l.code,
      badge: l.code,
      icon: '🗣️',
      searchTerms: l.searchTerms,
    }));
  }, []);

  const popularLanguageItems = useMemo<PickerItem[]>(() => {
    return getPopularLanguages().map((l) => ({
      id: l.code,
      title: l.name,
      subtitle: l.nativeName !== l.name ? `${l.nativeName} • ${l.code}` : l.code,
      badge: l.code,
      icon: '🗣️',
      searchTerms: l.searchTerms,
    }));
  }, []);

  const selectedCountryObj = useMemo(() => findCountry(country), [country]);
  const displayCountry = selectedCountryObj
    ? `${selectedCountryObj.flag}  ${selectedCountryObj.name}`
    : country;

  const selectedLanguageObj = useMemo(() => findLanguage(language), [language]);
  const displayLanguage = selectedLanguageObj
    ? selectedLanguageObj.name === selectedLanguageObj.nativeName
      ? selectedLanguageObj.name
      : `${selectedLanguageObj.name} (${selectedLanguageObj.nativeName})`
    : language;

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
      const profile = await updateProfile({
        name: name.trim(),
        country,
        preferredLanguage: language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      });
      dispatch(setSessionUser(profile));
      router.replace(
        mode === 'edit'
          ? '/(auth)/home'
          : '/(auth)/trusted-person-intro',
      );
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'We could not save your profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountry = (item: PickerItem) => {
    setCountry(item.title);
    setErrors((previous) => ({
      ...previous,
      country: undefined,
    }));
  };

  const handleSelectLanguage = (item: PickerItem) => {
    setLanguage(item.title);
    setErrors((previous) => ({
      ...previous,
      language: undefined,
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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

          {/* Progress (only in onboarding) */}
          {mode !== 'edit' && (
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
          )}

          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.title}>
              {mode === 'edit' ? 'Profile Details' : 'Complete your profile'}
            </Text>

            <Text style={styles.subtitle}>
              {mode === 'edit' ? 'Update your personal preferences.' : 'Tell us a little about yourself.'}
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
              value={displayCountry}
              onPress={() => setCountryModalVisible(true)}
            />

            {errors.country && (
              <Text style={styles.error}>
                {errors.country}
              </Text>
            )}

            <SelectInput
              label="Preferred language"
              placeholder="Select your language"
              value={displayLanguage}
              onPress={() => setLanguageModalVisible(true)}
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

          {/* Danger Zone in Edit Mode */}
          {mode === 'edit' && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/delete-account' as never)}
              style={styles.dangerZone}
            >
              <Text style={styles.dangerIcon}>⚠</Text>
              <View style={styles.dangerContent}>
                <Text style={styles.dangerTitle}>Delete Account</Text>
                <Text style={styles.dangerSubtitle}>Permanently remove vault data and assignments</Text>
              </View>
              <Text style={styles.dangerChevron}>›</Text>
            </Pressable>
          )}

          <Text style={styles.footerText}>
            You can edit this information later from Settings.
          </Text>
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {submitError ? (
            <Text style={styles.error}>{submitError}</Text>
          ) : null}
          <Button
            title={mode === 'edit' ? 'Save Changes' : 'Continue'}
            onPress={handleContinue}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>

      <SearchablePickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        title="Select Country"
        subtitle="Choose your country of residence"
        placeholder="Search country by name, code..."
        items={countryPickerItems}
        popularItems={popularCountryItems}
        selectedId={selectedCountryObj?.code || country}
        onSelect={handleSelectCountry}
        emptyMessage="No matching countries found"
      />

      <SearchablePickerModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        title="Select Language"
        subtitle="Choose your preferred language for communications"
        placeholder="Search language by name or native script..."
        items={languagePickerItems}
        popularItems={popularLanguageItems}
        selectedId={selectedLanguageObj?.code || language}
        onSelect={handleSelectLanguage}
        emptyMessage="No matching languages found"
      />
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

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  dangerZone: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerIcon: {
    fontSize: 20,
    color: '#DC2626',
    marginRight: 12,
  },
  dangerContent: {
    flex: 1,
  },
  dangerTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: '#991B1B',
  },
  dangerSubtitle: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: '#B91C1C',
  },
  dangerChevron: {
    fontSize: 20,
    color: '#DC2626',
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
