import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { GoogleButton } from '@/src/components/GoogleButton';
import { IconButton } from '@/src/components/IconButton';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { TextLink } from '@/src/components/TextLink';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import {
  saveAccessToken,
  getAccessToken,
  saveLastEmail,
  getLastEmail,
  saveBiometricSession,
  getBiometricSession,
  getBiometricUnlockEnabled,
  clearBiometricSession,
} from '@/src/storage/auth.storage';
import { googleLogin, login } from '@/src/api/auth.api';
import { signInWithGoogle } from '@/src/utils/google-auth';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { setSessionUser, hydrateSession } from '@/src/store/session.slice';
import {
  authenticateWithBiometric,
  getBiometricType,
  isBiometricAvailable,
  type BiometricType,
} from '@/src/services/biometric';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Biometric state (Face ID / Fingerprint)
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('Face ID');
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);

  const canContinue = email.trim().length > 0 && password.length > 0;

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [available, bioType, lastEmail, bioSession, enabled, token] = await Promise.all([
          isBiometricAvailable(),
          getBiometricType(),
          getLastEmail(),
          getBiometricSession(),
          getBiometricUnlockEnabled(),
          getAccessToken(),
        ]);

        if (!active) return;

        setBiometricAvailable(available);
        setBiometricType(bioType);

        if (lastEmail) setEmail((current) => current || lastEmail);

        setHasSavedSession(enabled && available && Boolean(bioSession) && Boolean(token));
      } catch {
        // Fallback gracefully
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const finishAuthentication = async (
    result: Awaited<ReturnType<typeof login>>,
    userEmail?: string
  ) => {
    const finalEmail = userEmail || result.user?.email || email;

    await saveAccessToken(result.accessToken);
    if (finalEmail) {
      await saveLastEmail(finalEmail);
      const existingBiometricSession = await getBiometricSession();
      if (await getBiometricUnlockEnabled() && existingBiometricSession?.email === finalEmail
          && await isBiometricAvailable()) {
        await saveBiometricSession({ email: finalEmail });
      } else {
        await clearBiometricSession();
      }
    }

    dispatch(setSessionUser(result.user));
    // A Google sign-in can create a brand-new account; it gets the same onboarding as email signup.
    router.replace(result.isNewUser
      ? { pathname: '/(auth)/security', params: { onboarding: 'true' } } as never
      : '/(auth)/(tabs)/home');
  };

  const handleBiometricLogin = async () => {
    if (loading || googleLoading || biometricLoading) return;

    setError('');
    setBiometricLoading(true);

    try {
      if (!await getBiometricUnlockEnabled()) {
        setHasSavedSession(false);
        return;
      }
      const bioResult = await authenticateWithBiometric(
        `Sign in to Virasat with ${biometricType}`
      );

      if (!bioResult.success) {
        if (bioResult.error && !bioResult.error.includes('cancel')) {
          setError(`${biometricType} didn’t recognise you. Try again or sign in with your password.`);
        }
        return;
      }

      // Biometrics unlock the session already stored on this device; they never restore a signed-out one.
      const token = await getAccessToken();

      if (token) {
        try {
          const hydrated = await dispatch(hydrateSession()).unwrap();
          if (hydrated) {
            router.replace('/(auth)/(tabs)/home');
            return;
          }
        } catch {
          // Token expired, require password once to re-authenticate
        }
      }

      // If no valid session exists, guide user
      setError(
        `Enter your password once to turn on ${biometricType} sign-in for this device.`
      );
    } catch {
      setError(`${biometricType} isn’t working right now. Sign in with your password.`);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading || biometricLoading) return;

    setGoogleLoading(true);
    setError('');

    try {
      const idToken = await signInWithGoogle();

      if (!idToken) {
        return;
      }

      const result = await googleLogin(idToken);
      await finishAuthentication(result, result.user?.email);
    } catch (error) {
      setError(getApiErrorMessage(error, 'Google sign-in didn’t work. Try again or use your email.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loading || googleLoading || biometricLoading) return;
    if (!canContinue) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await login({
        email: normalizedEmail,
        password,
      });

      await finishAuthentication(result, normalizedEmail);
    } catch (error) {
      setError(getApiErrorMessage(error, 'We couldn’t sign you in. Check your email and password and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const isFaceID = biometricType === 'Face ID';
  const busy = loading || googleLoading || biometricLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader onBack={router.canGoBack() ? 'default' : undefined} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title} accessibilityRole="header">Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage what you’ve chosen to preserve.</Text>

          {biometricAvailable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sign in with ${biometricType}`}
              accessibilityState={{ busy: biometricLoading, disabled: busy }}
              disabled={busy}
              onPress={() => void handleBiometricLogin()}
              style={({ pressed }) => [styles.biometricButton, pressed && styles.pressed]}
            >
              <View style={styles.biometricBadge}>
                {biometricLoading ? (
                  <ActivityIndicator size="small" color={colors.primary.deepForest} />
                ) : (
                  <AppIcon name={isFaceID ? 'face' : 'fingerprint'} size={26} color={colors.primary.deepForest} />
                )}
              </View>
              <View style={styles.biometricTextCol}>
                <Text style={styles.biometricTitle}>Sign in with {biometricType}</Text>
                <Text style={styles.biometricSub}>
                  {biometricLoading ? 'Waiting for your device…' : hasSavedSession ? 'Unlock with one tap' : 'Faster sign-in on this device'}
                </Text>
              </View>
              <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
            </Pressable>
          ) : null}

          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />

          <View>
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry={secureText}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void handleLogin()}
              style={styles.passwordInput}
              containerStyle={styles.passwordField}
            />
            <IconButton
              icon={secureText ? 'eye' : 'eyeOff'}
              accessibilityLabel={secureText ? 'Show password' : 'Hide password'}
              onPress={() => setSecureText((value) => !value)}
              color={colors.neutral.textSecondary}
              size={22}
              style={styles.eyeButton}
            />
          </View>
          <TextLink
            title="Forgot password?"
            onPress={() =>
              router.push({
                pathname: '/(auth)/forgot-password',
                params: email.trim() ? { email: email.trim() } : {},
              })
            }
            style={styles.forgot}
          />

          {error ? <InlineNotice tone="danger" message={error} style={styles.error} /> : null}

          <Button title="Sign in" onPress={() => void handleLogin()} loading={loading} disabled={googleLoading || biometricLoading} />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <GoogleButton onPress={() => void handleGoogleLogin()} loading={googleLoading} disabled={loading || biometricLoading} />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New to Virasat?</Text>
            <TextLink title="Create an account" onPress={() => router.push('/(auth)/signup' as never)} />
          </View>

          <Text style={styles.footer}>By continuing you agree to Virasat’s Terms and Privacy Policy.</Text>
          <View style={styles.legalLinks}>
            <TextLink title="Terms" tone="muted" onPress={() => void Linking.openURL('https://virasat.app/terms/')} />
            <TextLink title="Privacy Policy" tone="muted" onPress={() => void Linking.openURL('https://virasat.app/privacy/')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  keyboard: { flex: 1 },
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
  biometricButton: {
    minHeight: 72,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.brand.sage,
  },
  pressed: { opacity: 0.85 },
  biometricBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricTextCol: { flex: 1, gap: 2 },
  biometricTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.body, lineHeight: 22, color: colors.neutral.textPrimary },
  biometricSub: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  passwordField: { marginBottom: 0 },
  passwordInput: { paddingRight: 56 },
  eyeButton: { position: 'absolute', right: 2, top: 30 },
  forgot: { alignSelf: 'flex-end', marginBottom: 8 },
  error: { marginBottom: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: colors.neutral.border },
  dividerText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.caption, color: colors.neutral.textMuted },
  signupRow: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  signupText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.callout, color: colors.neutral.textSecondary },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    color: colors.neutral.textMuted,
  },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
});
