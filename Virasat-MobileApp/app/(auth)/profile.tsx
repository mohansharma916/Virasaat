import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
import { clearSession, setSessionUser } from '@/src/store/session.slice';
import { clearVaultData } from '@/src/store/vault.slice';
import { removeAccessToken } from '@/src/storage/auth.storage';
import { useSubscription } from '@/src/store/subscription.slice';
import { LogOut, Shield } from 'lucide-react-native';
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
  const { currentPlan } = useSubscription();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  const executeSignOut = async () => {
    try {
      setSigningOut(true);
      await removeAccessToken();
      dispatch(clearSession());
      dispatch(clearVaultData());
      setSignOutModalVisible(false);
      router.replace('/(auth)/welcome' as never);
    } catch {
      setSignOutModalVisible(false);
      router.replace('/(auth)/welcome' as never);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
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

          {/* Account Settings in Edit Mode */}
          {mode === 'edit' && (
            <View style={styles.settingsSection}>
              {/* Plan & Subscription */}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(auth)/my-plan' as never)}
                style={styles.planCardAction}
              >
                <View style={styles.planActionIconCircle}>
                  <Text style={styles.planActionIcon}>✦</Text>
                </View>
                <View style={styles.planActionContent}>
                  <Text style={styles.planActionTitle}>Plan & Subscription</Text>
                  <Text style={styles.planActionSubtitle}>
                    {currentPlan
                      ? `Virasat ${currentPlan.name} · ${currentPlan.price === 0 ? 'Free' : `₹${currentPlan.price}/yr`}`
                      : 'Manage your membership'}
                  </Text>
                </View>
                <Text style={styles.planActionChevron}>›</Text>
              </Pressable>

              {/* Security & Biometrics */}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(auth)/security' as never)}
                style={styles.planCardAction}
              >
                <View style={[styles.planActionIconCircle, { backgroundColor: colors.brand.sage }]}>
                  <Shield size={18} color={colors.primary.deepForest} />
                </View>
                <View style={styles.planActionContent}>
                  <Text style={styles.planActionTitle}>Security & Biometrics</Text>
                  <Text style={styles.planActionSubtitle}>
                    Manage biometric unlock and device protection
                  </Text>
                </View>
                <Text style={styles.planActionChevron}>›</Text>
              </Pressable>

              {/* Sign Out Action */}
              <Pressable
                accessibilityRole="button"
                onPress={handleSignOut}
                style={styles.signOutCardAction}
              >
                <View style={styles.signOutIconCircle}>
                  <LogOut size={18} color="#B42318" />
                </View>
                <View style={styles.planActionContent}>
                  <Text style={styles.signOutTitle}>Sign Out</Text>
                  <Text style={styles.signOutSubtitle}>
                    Sign out of your account on this device
                  </Text>
                </View>
                <Text style={styles.signOutChevron}>›</Text>
              </Pressable>

              {/* Danger Zone */}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(auth)/delete-account' as never)}
                style={styles.dangerZone}
              >
                <Text style={styles.dangerIcon}>⚠</Text>
                <View style={styles.dangerContent}>
                  <Text style={styles.dangerTitle}>Delete Account</Text>
                  <Text style={styles.dangerSubtitle}>
                    Permanently remove vault data and assignments
                  </Text>
                </View>
                <Text style={styles.dangerChevron}>›</Text>
              </Pressable>
            </View>
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

      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!signingOut) setSignOutModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!signingOut) setSignOutModalVisible(false);
            }}
          />
          <View style={styles.signOutModalCard}>
            <View style={styles.modalIconCircle}>
              <LogOut size={22} color="#DC2626" />
            </View>

            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out of your Virasat account on this device?
            </Text>

            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.modalCancelButton}
                disabled={signingOut}
                onPress={() => setSignOutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirmButton}
                disabled={signingOut}
                onPress={() => void executeSignOut()}
              >
                {signingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Sign Out</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  settingsSection: {
    marginTop: 20,
    gap: 12,
  },

  planCardAction: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planActionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planActionIcon: {
    fontSize: 16,
    color: colors.primary.deepForest,
  },
  planActionContent: {
    flex: 1,
  },
  planActionTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.textPrimary,
  },
  planActionSubtitle: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },
  planActionChevron: {
    fontSize: 20,
    color: colors.neutral.textMuted,
  },

  signOutCardAction: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: '#FED7D7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signOutTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: '#B42318',
  },
  signOutSubtitle: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textMuted,
  },
  signOutChevron: {
    fontSize: 20,
    color: '#B42318',
  },

  dangerZone: {
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  signOutModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 20,
    color: colors.primary.deepForest,
    marginBottom: 8,
  },
  modalMessage: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13.5,
    color: colors.primary.deepForest,
  },
  modalConfirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13.5,
    color: '#FFFFFF',
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
