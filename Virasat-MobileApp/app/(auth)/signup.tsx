import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';


import { signInWithGoogle } from '@/src/utils/google-auth';
import { googleLogin, register } from '@/src/api/auth.api';
import { saveAccessToken } from '@/src/storage/auth.storage';
import { getApiErrorMessage } from '@/src/utils/api-error';

import { ActionBar } from '@/src/components/ActionBar';
import { Button } from '@/src/components/Button';
import { GoogleButton } from '@/src/components/GoogleButton';
import { IconButton } from '@/src/components/IconButton';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { TextLink } from '@/src/components/TextLink';

import { AppIcon } from '@/src/components/AppIcon';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { useAppDispatch } from '@/src/store/hooks';
import { setSessionUser } from '@/src/store/session.slice';
import { passwordTooLong } from '@/src/utils/password';

export default function SignupScreen() {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    terms?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Enter your full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Enter your email address.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      newErrors.email = 'Enter an email address like name@example.com.';
    }

    if (!password) {
      newErrors.password = 'Create a password.';
    } else if (password.length < 8) {
      newErrors.password = 'Use at least 8 characters.';
    } else if (passwordTooLong(password)) {
      newErrors.password = 'Password must be 72 characters or fewer.';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'Agree to the Terms and Privacy Policy to continue.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignup = async () => {
    if (loading || googleLoading) return;

    setGoogleLoading(true);
    setSubmitError('');

    try {
      const idToken = await signInWithGoogle();

      if (!idToken) {
        return;
      }

      const result = await googleLogin(idToken);

      await saveAccessToken(result.accessToken);
      dispatch(setSessionUser(result.user));

      // New Google accounts get the same onboarding as email signups.
      router.replace(result.isNewUser
        ? { pathname: '/(auth)/security', params: { onboarding: 'true' } } as never
        : '/(auth)/(tabs)/home');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Google sign-up didn’t work. Try again or use your email.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!validate()) {
      return;
    }
  

    try {
      setLoading(true);
      setSubmitError('');

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim();

      const result = await register({
        email: normalizedEmail,
        name: normalizedName,
        password,
      });

      router.push({
        pathname: '/(auth)/verify',
        params: {
          email: normalizedEmail,
          developmentOtp: result.developmentOtp ?? '',
        },
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'We couldn’t create your account. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader onBack="default" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title} accessibilityRole="header">Create your account</Text>
          <Text style={styles.subtitle}>Start securing your digital legacy today.</Text>

          <GoogleButton onPress={() => void handleGoogleSignup()} loading={googleLoading} disabled={loading} />

          <View style={styles.dividerRow} accessible accessibilityLabel="Or sign up with email">
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or use your email</Text>
            <View style={styles.divider} />
          </View>

          <Input
            label="Full name"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
          />

          <Input
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />

          <View>
            <Input
              label="Create password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              style={styles.passwordInput}
              containerStyle={styles.passwordContainer}
            />
            <IconButton
              icon={showPassword ? 'eyeOff' : 'eye'}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((value) => !value)}
              color={colors.neutral.textSecondary}
              size={22}
              style={styles.eyeButton}
            />
          </View>

          <View style={styles.requirements} accessibilityLiveRegion="polite">
            <Requirement valid={password.length >= 8 && !passwordTooLong(password)} text="8 to 72 characters" />
            <Text style={styles.hint}>Longer is stronger. Avoid common passwords like “password123”.</Text>
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel="I agree to the Terms and Privacy Policy"
            style={styles.termsRow}
            onPress={() => setAcceptedTerms((value) => !value)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxSelected]}>
              {acceptedTerms ? <AppIcon name="check" size={16} color={colors.neutral.white} strokeWidth={3} /> : null}
            </View>
            <Text style={styles.termsText}>I agree to the Terms and Privacy Policy</Text>
          </Pressable>
          <View style={styles.legalLinks}>
            <TextLink title="Read the Terms" onPress={() => void Linking.openURL('https://www.virasat.knowyourviews.com/terms/')} />
            <TextLink title="Read the Privacy Policy" onPress={() => void Linking.openURL('https://www.virasat.knowyourviews.com/privacy/')} />
          </View>
          {errors.terms ? <InlineNotice tone="danger" message={errors.terms} /> : null}

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TextLink title="Sign in" onPress={() => router.replace('/(auth)/login')} />
          </View>
        </ScrollView>

        <ActionBar>
          {submitError ? <InlineNotice tone="danger" message={submitError} style={styles.submitError} /> : null}
          <Button title="Create account" onPress={() => void handleCreateAccount()} loading={loading} disabled={googleLoading} />
        </ActionBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Requirement({ valid, text }: { valid: boolean; text: string }) {
  return (
    <View style={styles.requirement} accessible accessibilityLabel={`${text}: ${valid ? 'met' : 'not met yet'}`}>
      <View style={[styles.requirementIcon, valid && styles.requirementIconValid]}>
        {valid ? <AppIcon name="check" size={14} color={colors.neutral.white} strokeWidth={3} /> : null}
      </View>
      <Text style={[styles.requirementText, valid && styles.requirementTextValid]}>{text}</Text>
    </View>
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: colors.neutral.border },
  dividerText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.caption, color: colors.neutral.textMuted },
  passwordContainer: { marginBottom: 8 },
  passwordInput: { paddingRight: 56 },
  eyeButton: { position: 'absolute', right: 2, top: 30 },
  requirements: { marginBottom: 20, gap: 6 },
  requirement: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requirementIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.neutral.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementIconValid: { backgroundColor: colors.semantic.success, borderColor: colors.semantic.success },
  requirementText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, color: colors.neutral.textSecondary },
  requirementTextValid: { color: colors.semantic.success, fontFamily: typography.fonts.inter.medium },
  hint: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textMuted },
  termsRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral.control,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: colors.primary.forest, borderColor: colors.primary.forest },
  termsText: { flex: 1, fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.callout, lineHeight: 22, color: colors.neutral.textPrimary },
  legalLinks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, paddingLeft: 36 },
  loginRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  loginText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.callout, color: colors.neutral.textSecondary },
  submitError: { marginBottom: 8 },
});
