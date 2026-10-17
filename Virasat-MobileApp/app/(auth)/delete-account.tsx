import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { api } from '@/src/api/client';
import { AppIcon } from '@/src/components/AppIcon';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { signInWithGoogle } from '@/src/utils/google-auth';
import { runWithSystemUi } from '@/src/components/SessionGate';
import { removeAccessToken } from '@/src/storage/auth.storage';
import { useAppDispatch } from '@/src/store/hooks';
import { clearSession } from '@/src/store/session.slice';
import { clearVaultData } from '@/src/store/vault.slice';

const CONFIRMATION_WORD = 'DELETE';

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const confirmed = confirmation.trim().toUpperCase() === CONFIRMATION_WORD;

  const goBack = () =>
    router.replace({ pathname: '/(auth)/profile', params: { mode: 'edit' } });

  const deleteAccount = async (googleIdToken?: string) => {
    if (busy.current) return;
    if (!confirmed) {
      setError(`Type ${CONFIRMATION_WORD} to confirm.`);
      return;
    }
    if (!googleIdToken && !currentPassword) {
      setError('Enter your password, or confirm with Google, to delete your account.');
      return;
    }
    busy.current = true;
    setDeleting(true);
    setError('');
    try {
      await api.post('/users/me/deletion', {
        confirmation: CONFIRMATION_WORD,
        ...(googleIdToken ? { googleIdToken } : { currentPassword }),
      });
      // The account no longer exists; clear everything stored on this device.
      await removeAccessToken().catch(() => undefined);
      dispatch(clearSession());
      dispatch(clearVaultData());
      router.replace('/(auth)/welcome' as never);
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Your account could not be deleted. Nothing was changed. Please try again.'));
    } finally {
      busy.current = false;
      setDeleting(false);
    }
  };

  const confirmWithGoogle = async () => {
    if (busy.current) return;
    if (!confirmed) {
      setError(`Type ${CONFIRMATION_WORD} to confirm.`);
      return;
    }
    setError('');
    try {
      const idToken = await runWithSystemUi(() => signInWithGoogle());
      if (idToken) await deleteAccount(idToken);
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Google confirmation failed. Try your password instead.'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={goBack} hitSlop={12} style={styles.backButton} accessibilityLabel="Back">
          <AppIcon name="chevronLeft" style={styles.backArrow} />
        </Pressable>
        <Text style={styles.brand}>VIRASAT</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>Critical action</Text>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.subtitle}>
            This permanently deletes your Virasat account and everything in your vault.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <AppIcon name="warning" style={styles.warningSymbol} />
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>This cannot be undone</Text>
            <Text style={styles.warningText}>
              Your vault items, uploaded files, messages, trusted people, check-in and release settings are deleted immediately from our servers.
            </Text>
            <Text style={[styles.warningText, { marginTop: 6 }]}>
              Copies you have already downloaded or shared are not affected.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Confirm it&apos;s you</Text>
          <TextInput
            accessibilityLabel="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            editable={!deleting}
            placeholder="Current password"
            placeholderTextColor={colors.neutral.textMuted}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={() => void confirmWithGoogle()}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineButtonText}>Signed up with Google? Confirm with Google</Text>
          </Pressable>

          <Text style={[styles.infoText, { marginTop: 14 }]}>
            Type {CONFIRMATION_WORD} to confirm
          </Text>
          <TextInput
            accessibilityLabel={`Type ${CONFIRMATION_WORD} to confirm`}
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!deleting}
            placeholder={CONFIRMATION_WORD}
            placeholderTextColor={colors.neutral.textMuted}
            style={styles.input}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Account not deleted</Text>
            <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          accessibilityRole="button"
          disabled={deleting || !confirmed || !currentPassword}
          onPress={() => void deleteAccount()}
          style={({ pressed }) => [
            styles.secondaryButton,
            (deleting || !confirmed || !currentPassword) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {deleting ? (
            <ActivityIndicator color="#991B1B" size="small" />
          ) : (
            <Text style={styles.secondaryButtonText}>Permanently Delete My Account</Text>
          )}
        </Pressable>

        <Pressable accessibilityRole="button"
          onPress={goBack}
          disabled={deleting}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>Keep Account & Return</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  header: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    width: 48,
    height: 48,
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
    fontSize: 12,
    
    color: colors.semantic.error,
  },
  title: {
    marginTop: 6,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 27,
    lineHeight: 39,
    color: colors.semantic.error,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },
  warningCard: {
    backgroundColor: colors.semantic.errorSoft,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.semantic.errorBorder,
    marginBottom: 14,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningSymbol: {
    fontSize: 20,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.semantic.error,
    marginBottom: 4,
  },
  warningText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 17,
    color: colors.semantic.error,
  },
  infoCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: 14,
  },
  infoTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.primary.deepForest,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.neutral.textSecondary,
  },
  statusBox: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textMuted,
  },
  errorBox: {
    backgroundColor: colors.semantic.errorSoft,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.semantic.errorBorder,
    marginBottom: 14,
  },
  errorTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.semantic.error,
    marginBottom: 2,
  },
  errorText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.semantic.error,
  },
  noticeBox: {
    backgroundColor: colors.semantic.warningSoft,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.semantic.warningBorder,
    marginBottom: 14,
  },
  noticeTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.semantic.warning,
    marginBottom: 2,
  },
  noticeText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.semantic.warning,
  },
  safeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  safeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  safeText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textMuted,
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    gap: 10,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.semantic.errorBorder,
    backgroundColor: colors.semantic.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.semantic.error,
  },
  input: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 14,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.primary.deepForest,
  },
  outlineButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineButtonText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    color: colors.primary.forest,
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
