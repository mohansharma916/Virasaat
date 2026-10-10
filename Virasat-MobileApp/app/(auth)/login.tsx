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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
        const [available, bioType, lastEmail, bioSession, enabled] = await Promise.all([
          isBiometricAvailable(),
          getBiometricType(),
          getLastEmail(),
          getBiometricSession(),
          getBiometricUnlockEnabled(),
        ]);

        if (!active) return;

        setBiometricAvailable(available);
        setBiometricType(bioType);

        if (lastEmail) setEmail((current) => current || lastEmail);

        setHasSavedSession(enabled && available && Boolean(bioSession?.token));
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
        await saveBiometricSession({ email: finalEmail, token: result.accessToken });
      } else {
        await clearBiometricSession();
      }
    }

    dispatch(setSessionUser(result.user));
    router.replace('/(auth)/home');
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
          setError(`${biometricType} verification failed. Please try again or use your password.`);
        }
        return;
      }

      // Biometric verified! Check if we have an active token or saved session
      const token = await getAccessToken();
      const bioSession = await getBiometricSession();

      if (token || bioSession?.token) {
        if (!token && bioSession?.token) {
          await saveAccessToken(bioSession.token);
        }
        try {
          const hydrated = await dispatch(hydrateSession()).unwrap();
          if (hydrated) {
            router.replace('/(auth)/home');
            return;
          }
        } catch {
          // Token expired, require password once to re-authenticate
        }
      }

      // If no valid session exists, guide user
      setError(
        `${biometricType} recognized! Enter your password once to connect ${biometricType} for 1-tap sign-in.`
      );
    } catch {
      setError(`Unable to authenticate with ${biometricType}. Please use your password.`);
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
      setError(getApiErrorMessage(error, 'Google sign-in failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!canContinue || loading || googleLoading || biometricLoading) return;
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
      setError(getApiErrorMessage(error, 'Unable to sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const isFaceID = biometricType === 'Face ID';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brand}>VIRASAT</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <Text style={styles.lockIcon}>⌑</Text>
            </View>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.title}>Your legacy is waiting.</Text>
            <Text style={styles.subtitle}>
              Sign in to securely manage the information you've chosen to preserve.
            </Text>
          </View>

          {/* Quick Biometric Login Button (Face ID / Fingerprint) */}
          {biometricAvailable && (
            <Pressable
              disabled={loading || googleLoading || biometricLoading}
              onPress={handleBiometricLogin}
              style={({ pressed }) => [
                styles.biometricButton,
                pressed && styles.buttonPressed,
                biometricLoading && styles.biometricButtonDisabled,
              ]}
            >
              {biometricLoading ? (
                <View style={styles.biometricLoadingRow}>
                  <ActivityIndicator size="small" color={colors.primary.deepForest} />
                  <Text style={styles.biometricLoadingText}>Scanning {biometricType}...</Text>
                </View>
              ) : (
                <View style={styles.biometricContentRow}>
                  <View style={styles.biometricBadge}>
                    <Text style={styles.biometricIconSymbol}>
                      {isFaceID ? '👤' : '👆'}
                    </Text>
                  </View>
                  <View style={styles.biometricTextCol}>
                    <Text style={styles.biometricTitle}>
                      Sign in with {biometricType}
                    </Text>
                    <Text style={styles.biometricSub}>
                      {hasSavedSession
                        ? '1-Tap biometric vault unlock'
                        : `Instant login with ${biometricType}`}
                    </Text>
                  </View>
                  <Text style={styles.biometricArrowSymbol}>→</Text>
                </View>
              )}
            </Pressable>
          )}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.neutral.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: '/(auth)/forgot-password',
                      params: email.trim() ? { email: email.trim() } : {},
                    });
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.forgot}>Forgot password?</Text>
                </Pressable>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.neutral.textMuted}
                  secureTextEntry={secureText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  style={styles.passwordInput}
                />
                <Pressable onPress={() => setSecureText((value) => !value)} hitSlop={8} style={styles.visibilityButton}>
                  <Text style={styles.visibilityText}>{secureText ? 'Show' : 'Hide'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              disabled={!canContinue || loading || biometricLoading}
              onPress={handleLogin}
              style={({ pressed }) => [styles.loginButton, !canContinue && styles.loginButtonDisabled, pressed && canContinue && !loading && styles.buttonPressed]}
            >
              {loading ? (
                <ActivityIndicator color={colors.neutral.white} />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Text style={styles.loginArrow}>→</Text>
                </>
              )}
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading || biometricLoading}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && !googleLoading && styles.buttonPressed,
            ]}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.neutral.textPrimary} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/signup' as never)} style={({ pressed }) => [styles.signupButton, pressed && styles.buttonPressed]}>
            <Text style={styles.signupText}>Create a new Virasat</Text>
            <Text style={styles.signupArrow}>→</Text>
          </Pressable>

          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>Protected with hardware biometric encryption.</Text>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to Virasat's{' '}
            <Text
              style={{ color: colors.primary.deepForest, textDecorationLine: 'underline', fontWeight: '600' }}
              onPress={() => void Linking.openURL('https://virasat.app/terms/')}
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              style={{ color: colors.primary.deepForest, textDecorationLine: 'underline', fontWeight: '600' }}
              onPress={() => void Linking.openURL('https://virasat.app/privacy/')}
            >
              Privacy Policy
            </Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 28 },
  header: { height: 48, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: typography.fonts.playfair.bold, fontSize: 18, letterSpacing: 3, color: colors.primary.deepForest },
  hero: { alignItems: 'center', marginTop: 14 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brand.mint, alignItems: 'center', justifyContent: 'center' },
  lockIcon: { fontSize: 21, color: colors.primary.forest },
  eyebrow: { marginTop: 10, fontFamily: typography.fonts.inter.semiBold, fontSize: 9, letterSpacing: 1.6, color: colors.primary.forest },
  title: { marginTop: 6, textAlign: 'center', fontFamily: typography.fonts.playfair.semiBold, fontSize: 25, lineHeight: 32, color: colors.primary.deepForest },
  subtitle: { maxWidth: 330, marginTop: 4, textAlign: 'center', fontFamily: typography.fonts.inter.regular, fontSize: 12, lineHeight: 18, color: colors.neutral.textSecondary },

  // Biometric Button Styles
  biometricButton: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#EAF3EF',
    borderWidth: 1.5,
    borderColor: colors.primary.forest,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowColor: colors.primary.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  biometricButtonDisabled: {
    opacity: 0.7,
  },
  biometricContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  biometricLoadingText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.deepForest,
  },
  biometricBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  biometricIconSymbol: {
    fontSize: 20,
    color: colors.brand.mint,
  },
  biometricTextCol: {
    flex: 1,
  },
  biometricTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.primary.deepForest,
  },
  biometricSub: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.primary.forest,
    marginTop: 1,
  },
  biometricArrowSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.deepForest,
    marginLeft: 8,
  },

  form: { marginTop: 16 },
  googleButton: {
    height: 50,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  googleIcon: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 17,
    color: '#4285F4',
    marginRight: 10,
  },

  googleButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },
  field: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  label: { marginBottom: 5, fontFamily: typography.fonts.inter.semiBold, fontSize: 9, letterSpacing: 1.2, color: colors.neutral.textSecondary },
  forgot: { fontFamily: typography.fonts.inter.semiBold, fontSize: 9.5, color: colors.primary.forest },
  input: { height: 50, paddingHorizontal: 15, borderRadius: 13, backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.neutral.border, fontFamily: typography.fonts.inter.regular, fontSize: 13, color: colors.neutral.textPrimary },
  passwordContainer: { height: 50, flexDirection: 'row', alignItems: 'center', borderRadius: 13, backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.neutral.border },
  passwordInput: { flex: 1, height: '100%', paddingHorizontal: 15, fontFamily: typography.fonts.inter.regular, fontSize: 13, color: colors.neutral.textPrimary },
  error: { marginTop: 8, fontFamily: typography.fonts.inter.regular, fontSize: 11, color: '#B42318' },
  visibilityButton: { paddingHorizontal: 14 },
  visibilityText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 10, color: colors.primary.forest },
  loginButton: { height: 52, marginTop: 4, borderRadius: 14, backgroundColor: colors.primary.deepForest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginButtonDisabled: { opacity: 0.4 },
  loginButtonText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 14, color: colors.neutral.white },
  loginArrow: { marginLeft: 11, fontSize: 18, color: colors.neutral.white },
  dividerRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  divider: { flex: 1, height: 1, backgroundColor: colors.neutral.border },
  dividerText: { marginHorizontal: 12, fontFamily: typography.fonts.inter.semiBold, fontSize: 8.5, letterSpacing: 1, color: colors.neutral.textMuted },
  signupButton: { height: 50, marginTop: 10, borderRadius: 14, backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.primary.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  signupText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 13, color: colors.primary.forest },
  signupArrow: { marginLeft: 10, fontSize: 17, color: colors.primary.forest },
  securityNote: { marginTop: 14, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  securityIcon: { marginRight: 7, fontSize: 11 },
  securityText: { fontFamily: typography.fonts.inter.regular, fontSize: 9.5, color: colors.neutral.textMuted },
  footer: { marginTop: 10, textAlign: 'center', fontFamily: typography.fonts.inter.regular, fontSize: 8.5, lineHeight: 14, color: colors.neutral.textMuted },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
