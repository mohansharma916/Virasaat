import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';


import { signInWithGoogle } from '@/src/utils/google-auth';
import { googleLogin, register } from '@/src/api/auth.api';
import { saveAccessToken } from '@/src/storage/auth.storage';
import { getApiErrorMessage } from '@/src/utils/api-error';

import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { useAppDispatch } from '@/src/store/hooks';
import { setSessionUser } from '@/src/store/session.slice';

export default function SignupScreen() {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');


  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    mobile?: string;
    password?: string;
    terms?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // if (!mobile.trim()) {
    //   newErrors.mobile = 'Please enter your mobile number.';
    // } else if (!/^[0-9]{10}$/.test(mobile)) {
    //   newErrors.mobile =
    //     'Please enter a valid 10-digit mobile number.';
    // }

    if (!password) {
      newErrors.password = 'Please create a password.';
    } else if (password.length < 8) {
      newErrors.password =
        'Password must contain at least 8 characters.';
    }

    if (!acceptedTerms) {
      newErrors.terms =
        'Please accept the Terms and Privacy Policy.';
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

      router.replace('/(auth)/home');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Google sign-up failed. Please try again.'));
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

      const result = await register({
        email: email.trim(),
        name: name.trim(),
        password,
      });
  

      router.push({
        pathname: '/(auth)/verify',
        params: {
          email: email.trim(),
          developmentOtp: result.developmentOtp ?? '',
        },
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'We could not create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
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

          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.title}>
              Create your account
            </Text>

            <Text style={styles.subtitle}>
              Start securing your digital legacy today.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

             <Input
              label="Name"
              placeholder="e.g., John Doe"
              value={name}
              onChangeText={setName}
              error={errors.name}
             
              autoCapitalize="none"
              autoComplete="name"
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
              returnKeyType="next"
            />

           



            {/* Password */}
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>
                Create password
                <Text style={styles.required}> *</Text>
              </Text>

              <View
                style={[
                  styles.passwordInputWrapper,
                  errors.password &&
                  styles.passwordError,
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a strong password"
                  placeholderTextColor={
                    colors.neutral.textMuted
                  }
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  style={styles.passwordInput}
                />

                <Pressable
                  onPress={() =>
                    setShowPassword((value) => !value)
                  }
                  hitSlop={10}
                >
                  <Text style={styles.showPassword}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>

              {errors.password && (
                <Text style={styles.error}>
                  {errors.password}
                </Text>
              )}

              {/* Password requirements */}
              <View style={styles.requirements}>
                <Requirement
                  valid={password.length >= 8}
                  text="8+ characters"
                />

                <Requirement
                  valid={/[A-Z]/.test(password)}
                  text="One uppercase letter"
                />

                <Requirement
                  valid={/[0-9]/.test(password)}
                  text="One number"
                />
              </View>
            </View>

            {/* Terms */}
            <Pressable
              style={styles.termsRow}
              onPress={() =>
                setAcceptedTerms((value) => !value)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedTerms &&
                  styles.checkboxSelected,
                ]}
              >
                {acceptedTerms && (
                  <Text style={styles.checkmark}>
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>
                  Terms
                </Text>{' '}
                and{' '}
                <Text style={styles.termsLink}>
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>

            {errors.terms && (
              <Text style={styles.error}>
                {errors.terms}
              </Text>
            )}

            {/* CTA */}
            {/* CTA */}
            <View style={styles.buttonContainer}>
              <Button
                title="Create Account"
                onPress={handleCreateAccount}
                loading={loading}
              />
            </View>

            {submitError ? (
              <Text style={styles.error}>{submitError}</Text>
            ) : null}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Google */}
            <Pressable
              onPress={handleGoogleSignup}
              disabled={loading || googleLoading}
              style={({ pressed }) => [
                styles.googleButton,
                pressed && !googleLoading && styles.buttonPressed,
              ]}
            >
              {googleLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.neutral.textPrimary}
                />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>

                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>


            {/* Login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                Already have an account?
              </Text>

              <Pressable
                onPress={() =>
                  router.replace('/(auth)/login')
                }
              >
                <Text style={styles.loginLink}>
                  Log In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

/**
 * Small reusable wrapper so every auth screen
 * can eventually share the same safe-area behavior.
 */
function SafeAreaWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.safeArea}>
      {children}
    </View>
  );
}

function Requirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <View style={styles.requirement}>
      <View
        style={[
          styles.requirementDot,
          valid && styles.requirementValid,
        ]}
      >
        {valid && (
          <Text style={styles.requirementCheck}>
            ✓
          </Text>
        )}
      </View>

      <Text
        style={[
          styles.requirementText,
          valid && styles.requirementTextValid,
        ]}
      >
        {text}
      </Text>
    </View>
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
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },

  dividerRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral.border,
  },

  dividerText: {
    marginHorizontal: 12,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.neutral.textMuted,
  },

  googleButton: {
    height: 52,
    marginTop: 14,
    borderRadius: 12,
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

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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
    color: colors.primary.deepForest,
    fontWeight: '300',
  },

  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.primary.deepForest,
  },

  heading: {
    marginTop: 14,
    marginBottom: 16,
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 26,
    lineHeight: 33,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 5,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },

  form: {
    width: '100%',
  },

  passwordContainer: {
    marginBottom: 14,
  },

  passwordLabel: {
    marginBottom: 8,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },

  required: {
    color: colors.primary.forest,
  },

  passwordInputWrapper: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordError: {
    borderColor: '#B42318',
  },

  passwordInput: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },

  showPassword: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.primary.forest,
  },

  error: {
    marginTop: 5,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: '#B42318',
  },

  requirements: {
    marginTop: 12,
    gap: 7,
  },

  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  requirementDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  requirementValid: {
    backgroundColor: colors.primary.forest,
    borderColor: colors.primary.forest,
  },

  requirementCheck: {
    color: colors.neutral.white,
    fontSize: 9,
    fontWeight: '700',
  },

  requirementText: {
    marginLeft: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textMuted,
  },

  requirementTextValid: {
    color: colors.primary.forest,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },

  checkboxSelected: {
    backgroundColor: colors.primary.deepForest,
    borderColor: colors.primary.deepForest,
  },

  checkmark: {
    color: colors.neutral.white,
    fontSize: 13,
    fontWeight: '700',
  },

  termsText: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },

  termsLink: {
    fontFamily: typography.fonts.inter.semiBold,
    color: colors.primary.forest,
  },

  buttonContainer: {
    marginTop: 26,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  loginText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },

  loginLink: {
    marginLeft: 5,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.forest,
  },
});
