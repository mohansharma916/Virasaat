import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { api } from '@/src/api/client';
import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SelectionRow } from '@/src/components/SelectionRow';
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
  const dispatch = useAppDispatch();
  const [currentPassword, setCurrentPassword] = useState('');
  // The client doesn't know how the account signs in, so the user picks one path.
  const [method, setMethod] = useState<'password' | 'google'>('password');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const confirmed = confirmation.trim().toUpperCase() === CONFIRMATION_WORD;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/(tabs)/account' as never);
  };

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
      setError(getApiErrorMessage(reason, 'Your account wasn’t deleted and nothing changed. Check your details and try again.'));
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
      setError(getApiErrorMessage(reason, 'Google didn’t confirm it’s you. Try again, or use your password.'));
    }
  };

  const canDelete = confirmed && (method === 'google' || !!currentPassword);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader onBack={deleting ? undefined : goBack} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">Delete your account</Text>
          <Text style={styles.subtitle}>This permanently deletes your Virasat account and everything in your vault.</Text>

          <View style={styles.warningCard} accessibilityRole="alert">
            <AppIcon name="warning" size={24} color={colors.semantic.error} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>This can’t be undone</Text>
              <Text style={styles.warningText}>
                Your items, files, messages, trusted people, check-ins and release rules are deleted from our servers straight away.
              </Text>
              <Text style={styles.warningText}>Copies you’ve already downloaded or shared aren’t affected.</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle} accessibilityRole="header">Confirm it’s you</Text>
          <Text style={styles.label} nativeID="methodLabel">How do you sign in?</Text>
          <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabelledBy="methodLabel">
            <SelectionRow kind="radio" appearance="plain" selected={method === 'password'} onPress={() => setMethod('password')} title="With email and password" />
            <SelectionRow kind="radio" appearance="plain" selected={method === 'google'} onPress={() => setMethod('google')} title="With Google" />
          </View>

          {method === 'password' ? (
            <Input
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              editable={!deleting}
              placeholder="Your password"
            />
          ) : (
            <Text style={styles.hint}>We’ll ask Google to confirm it’s you when you tap Delete.</Text>
          )}

          <Input
            label={`Type ${CONFIRMATION_WORD} to confirm`}
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!deleting}
            placeholder={CONFIRMATION_WORD}
          />

          {error ? <InlineNotice tone="danger" title="Account not deleted" message={error} /> : null}
        </ScrollView>

        <ActionBar>
          <Button title="Keep my account" onPress={goBack} disabled={deleting} />
          <Button
            title="Permanently delete my account"
            variant="destructiveOutline"
            onPress={() => void (method === 'google' ? confirmWithGoogle() : deleteAccount())}
            disabled={!canDelete}
            loading={deleting}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.semantic.errorSoft,
    borderWidth: 1,
    borderColor: colors.semantic.errorBorder,
  },
  warningContent: { flex: 1, gap: 6 },
  warningTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, color: colors.semantic.error },
  warningText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textPrimary,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.title3,
    lineHeight: typography.lineHeights.title3,
    color: colors.neutral.textPrimary,
  },
  label: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    lineHeight: typography.lineHeights.label,
    color: colors.neutral.textPrimary,
  },
  options: { marginBottom: 12 },
  hint: {
    marginBottom: 20,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
});
