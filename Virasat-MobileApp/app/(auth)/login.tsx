import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { saveAccessToken } from '@/src/storage/auth.storage';
import { login } from '@/src/api/auth.api';
import { signInWithGoogle } from '@/src/utils/google-auth';
import { googleLogin } from '@/src/api/auth.api';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const canContinue = email.trim().length > 0 && password.length > 0;


  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;

    setGoogleLoading(true);
    setError('');

    try {
      const idToken = await signInWithGoogle();

      if (!idToken) {
        return;
      }

      const result = await googleLogin(idToken);

      await saveAccessToken(result.accessToken);

      router.replace('/(auth)/home' as never);
    } catch (error) {
      setError(getApiErrorMessage(error, 'Google sign-in failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!canContinue || loading) return;
    setLoading(true);
    setError('');
    try {

      const result = await login({
        email,
        password,
      });

      await saveAccessToken(result.accessToken);
      router.replace('/(auth)/home' as never);
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to sign in. Please try again.'));
    }
    finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brand}>VIRASAT</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.iconCircle}><Text style={styles.lockIcon}>⌑</Text></View>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.title}>Your legacy is waiting.</Text>
            <Text style={styles.subtitle}>
              Sign in to securely manage the information you've chosen to preserve.
            </Text>
          </View>

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
                <Pressable onPress={() => { }} hitSlop={8}>
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
              disabled={!canContinue || loading}
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
            disabled={loading || googleLoading}
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
            <Text style={styles.securityText}>Your information remains private and protected.</Text>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to Virasat's Terms and Privacy Policy.
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
  hero: { alignItems: 'center', marginTop: 38 },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brand.mint, alignItems: 'center', justifyContent: 'center' },
  lockIcon: { fontSize: 25, color: colors.primary.forest },
  eyebrow: { marginTop: 22, fontFamily: typography.fonts.inter.semiBold, fontSize: 9, letterSpacing: 1.6, color: colors.primary.forest },
  title: { marginTop: 8, textAlign: 'center', fontFamily: typography.fonts.playfair.semiBold, fontSize: 29, lineHeight: 37, color: colors.primary.deepForest },
  subtitle: { maxWidth: 330, marginTop: 9, textAlign: 'center', fontFamily: typography.fonts.inter.regular, fontSize: 12.5, lineHeight: 20, color: colors.neutral.textSecondary },
  form: { marginTop: 34 },
  googleButton: {
    height: 52,
    marginTop: 14,
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
  field: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  label: { marginBottom: 7, fontFamily: typography.fonts.inter.semiBold, fontSize: 9, letterSpacing: 1.2, color: colors.neutral.textSecondary },
  forgot: { fontFamily: typography.fonts.inter.semiBold, fontSize: 9.5, color: colors.primary.forest },
  input: { height: 54, paddingHorizontal: 15, borderRadius: 13, backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.neutral.border, fontFamily: typography.fonts.inter.regular, fontSize: 13, color: colors.neutral.textPrimary },
  passwordContainer: { height: 54, flexDirection: 'row', alignItems: 'center', borderRadius: 13, backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.neutral.border },
  passwordInput: { flex: 1, height: '100%', paddingHorizontal: 15, fontFamily: typography.fonts.inter.regular, fontSize: 13, color: colors.neutral.textPrimary },
  error: { marginTop: 10, fontFamily: typography.fonts.inter.regular, fontSize: 11, color: '#B42318' },
  visibilityButton: { paddingHorizontal: 14 },
  visibilityText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 10, color: colors.primary.forest },
  loginButton: { height: 55, marginTop: 3, borderRadius: 14, backgroundColor: colors.primary.deepForest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginButtonDisabled: { opacity: 0.4 },
  loginButtonText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 14, color: colors.neutral.white },
  loginArrow: { marginLeft: 11, fontSize: 18, color: colors.neutral.white },
  dividerRow: { marginTop: 26, flexDirection: 'row', alignItems: 'center' },
  divider: { flex: 1, height: 1, backgroundColor: colors.neutral.border },
  dividerText: { marginHorizontal: 12, fontFamily: typography.fonts.inter.semiBold, fontSize: 8.5, letterSpacing: 1, color: colors.neutral.textMuted },
  signupButton: { height: 52, marginTop: 17, borderRadius: 14, backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.primary.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  signupText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 13, color: colors.primary.forest },
  signupArrow: { marginLeft: 10, fontSize: 17, color: colors.primary.forest },
  securityNote: { marginTop: 24, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  securityIcon: { marginRight: 7, fontSize: 11 },
  securityText: { fontFamily: typography.fonts.inter.regular, fontSize: 9.5, color: colors.neutral.textMuted },
  footer: { marginTop: 16, textAlign: 'center', fontFamily: typography.fonts.inter.regular, fontSize: 8.5, lineHeight: 14, color: colors.neutral.textMuted },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
