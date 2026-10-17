import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SelectInput } from '@/src/components/SelectInput';
import { SearchablePickerModal, type PickerItem } from '@/src/components/SearchablePickerModal';
import { StepProgress } from '@/src/components/StepProgress';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getProfile, updateProfile } from '@/src/api/users.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { haptics } from '@/src/utils/haptics';
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

type Snapshot = { name: string; country: string; language: string };

// Onboarding "Complete your profile" and, with mode=edit, "Personal details"
// (opened from the Account tab).
export default function ProfileScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const editing = mode === 'edit';
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [initial, setInitial] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; country?: string; language?: string }>({});

  const countryPickerItems = useMemo<PickerItem[]>(
    () =>
      getAllCountries().map((c) => ({
        id: c.code,
        title: c.name,
        subtitle: c.native !== c.name ? `${c.native} • ${c.code}` : c.code,
        badge: c.code,
        icon: c.flag,
        searchTerms: c.searchTerms,
      })),
    [],
  );

  const popularCountryItems = useMemo<PickerItem[]>(
    () =>
      getPopularCountries().map((c) => ({
        id: c.code,
        title: c.name,
        subtitle: c.native !== c.name ? `${c.native} • ${c.code}` : c.code,
        badge: c.code,
        icon: c.flag,
        searchTerms: c.searchTerms,
      })),
    [],
  );

  const languagePickerItems = useMemo<PickerItem[]>(
    () =>
      getAllLanguages().map((l) => ({
        id: l.code,
        title: l.name,
        subtitle: l.nativeName !== l.name ? `${l.nativeName} • ${l.code}` : l.code,
        badge: l.code,
        searchTerms: l.searchTerms,
      })),
    [],
  );

  const popularLanguageItems = useMemo<PickerItem[]>(
    () =>
      getPopularLanguages().map((l) => ({
        id: l.code,
        title: l.name,
        subtitle: l.nativeName !== l.name ? `${l.nativeName} • ${l.code}` : l.code,
        badge: l.code,
        searchTerms: l.searchTerms,
      })),
    [],
  );

  const selectedCountryObj = useMemo(() => findCountry(country), [country]);
  const displayCountry = selectedCountryObj ? `${selectedCountryObj.flag}  ${selectedCountryObj.name}` : country;

  const selectedLanguageObj = useMemo(() => findLanguage(language), [language]);
  const displayLanguage = selectedLanguageObj
    ? selectedLanguageObj.name === selectedLanguageObj.nativeName
      ? selectedLanguageObj.name
      : `${selectedLanguageObj.name} (${selectedLanguageObj.nativeName})`
    : language;

  useEffect(() => {
    let active = true;

    void getProfile()
      .then((profile) => {
        if (!active) return;
        const snapshot = {
          name: profile.name ?? '',
          country: profile.country ?? '',
          language: profile.preferredLanguage ?? '',
        };
        setName(snapshot.name);
        setCountry(snapshot.country);
        setLanguage(snapshot.language);
        setInitial(snapshot);
      })
      .catch(() => {
        // The form remains available even if a profile refresh is delayed.
      });

    return () => {
      active = false;
    };
  }, []);

  const dirty = !initial || initial.name !== name || initial.country !== country || initial.language !== language;

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Enter your full name.';
    if (!country) newErrors.country = 'Choose your country.';
    if (!language) newErrors.language = 'Choose your preferred language.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) {
      haptics.error();
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
      haptics.success();
      if (editing) {
        if (router.canGoBack()) router.back();
        else router.replace('/(auth)/(tabs)/account' as never);
      } else {
        router.replace('/(auth)/trusted-person-intro');
      }
    } catch (error) {
      haptics.error();
      setSubmitError(getApiErrorMessage(error, 'We couldn’t save your details. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader onBack="default" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!editing ? <StepProgress phase="Account" /> : null}

          <View style={[styles.heading, !editing && styles.headingOnboarding]}>
            <Text style={styles.title} accessibilityRole="header">
              {editing ? 'Personal details' : 'Complete your profile'}
            </Text>
            <Text style={styles.subtitle}>
              {editing ? 'Your legal name, where you live and the language we use to contact you.' : 'Tell us a little about yourself.'}
            </Text>
          </View>

          <Input
            label="Full name"
            placeholder="Your full legal name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (errors.name) setErrors((previous) => ({ ...previous, name: undefined }));
            }}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
          />

          <SelectInput
            label="Country"
            placeholder="Choose your country"
            value={displayCountry}
            onPress={() => setCountryModalVisible(true)}
            error={errors.country}
          />

          <SelectInput
            label="Preferred language"
            placeholder="Choose a language"
            value={displayLanguage}
            onPress={() => setLanguageModalVisible(true)}
            error={errors.language}
          />

          <InlineNotice
            tone="brand"
            icon="info"
            title="Why we ask"
            message="We use this to verify your identity and to contact you in your language."
          />
        </ScrollView>

        <ActionBar>
          {submitError ? <InlineNotice tone="danger" message={submitError} style={styles.error} /> : null}
          <Button
            title={editing ? 'Save changes' : 'Continue'}
            onPress={() => void handleContinue()}
            loading={loading}
            disabled={editing && !dirty}
          />
        </ActionBar>
      </KeyboardAvoidingView>

      <SearchablePickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        title="Choose country"
        subtitle="Where you live"
        placeholder="Search by name or code"
        items={countryPickerItems}
        popularItems={popularCountryItems}
        selectedId={selectedCountryObj?.code || country}
        onSelect={(item) => {
          setCountry(item.title);
          setErrors((previous) => ({ ...previous, country: undefined }));
        }}
        emptyMessage="No countries match your search."
      />
      <SearchablePickerModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        title="Choose language"
        subtitle="The language we use to contact you"
        placeholder="Search by name or native script"
        items={languagePickerItems}
        popularItems={popularLanguageItems}
        selectedId={selectedLanguageObj?.code || language}
        onSelect={(item) => {
          setLanguage(item.title);
          setErrors((previous) => ({ ...previous, language: undefined }));
        }}
        emptyMessage="No languages match your search."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  keyboard: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  heading: { marginTop: 8, marginBottom: 24 },
  headingOnboarding: { marginTop: 24 },
  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  error: { marginBottom: 8 },
});
