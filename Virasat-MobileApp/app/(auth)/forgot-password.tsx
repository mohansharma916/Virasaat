import { useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';

import { Button } from '@/src/components/Button';
import { GoogleButton } from '@/src/components/GoogleButton';
import { IconButton } from '@/src/components/IconButton';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { TextLink } from '@/src/components/TextLink';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import {
  forgotPassword,
  googleLogin,
  resendPasswordReset,
  resetPassword,
} from '@/src/api/auth.api';
import { signInWithGoogle } from '@/src/utils/google-auth';
import { saveAccessToken } from '@/src/storage/auth.storage';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { setSessionUser } from '@/src/store/session.slice';
import { passwordTooLong } from '@/src/utils/password';

type Step = 'EMAIL_INPUT' | 'RESET_FORM' | 'SUCCESS';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const searchParams = useLocalSearchParams<{ email?: string; mode?: string }>();

  // State
  const [step, setStep] = useState<Step>(searchParams.mode === 'reset' && searchParams.email ? 'RESET_FORM' : 'EMAIL_INPUT');
  const [email, setEmail] = useState((searchParams.email ?? '').trim().toLowerCase());
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [developmentOtp, setDevelopmentOtp] = useState<string | null>(null);

  // Resend countdown
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  // OTP inputs ref
  const otpInputs = useRef<(TextInput | null)[]>([]);

  // Back (header, gesture or hardware) steps back to the email step instead of leaving the flow.
  const navigation = useNavigation();
  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (step !== 'RESET_FORM') return;
      event.preventDefault();
      setStep('EMAIL_INPUT');
      setError('');
    });
  }, [navigation, step]);

  useEffect(() => {
    if (searchParams.mode === 'reset' && searchParams.email) {
      setEmail(searchParams.email.trim().toLowerCase());
      setStep('RESET_FORM');
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
    }
  }, [searchParams.mode, searchParams.email]);

  // Countdown timer for resend
  useEffect(() => {
    if (step !== 'RESET_FORM' || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  // Focus first OTP box when entering RESET_FORM
  useEffect(() => {
    if (step === 'RESET_FORM') {
      const timer = setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle Account Lookup / Reset Request
  const handleCheckEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await forgotPassword(trimmedEmail);

      // The response is the same whether or not the account exists. Google-only
      // owners receive an email telling them to use Google Sign-In instead.
      setStep('RESET_FORM');
      setSecondsLeft(RESEND_COOLDOWN);
      setInfoMessage(response.message || `If an account uses ${trimmedEmail}, we've sent a 6-digit code.`);

      if (response.developmentOtp) {
        setDevelopmentOtp(response.developmentOtp);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to process request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setError('');

    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return;

      const result = await googleLogin(idToken);
      await saveAccessToken(result.accessToken);
      dispatch(setSessionUser(result.user));

      router.replace(result.isNewUser
        ? { pathname: '/(auth)/security', params: { onboarding: 'true' } } as never
        : '/(auth)/(tabs)/home');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Google sign-in failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  // OTP field change
  const handleOtpChange = (value: string, index: number) => {
    // Handle paste of 6 digits
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
      otpInputs.current[nextIndex]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = cleaned;
    setOtp(nextOtp);

    if (cleaned && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  // Resend OTP
  const handleResendCode = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      const res = await resendPasswordReset(email.trim().toLowerCase());
      setSecondsLeft(RESEND_COOLDOWN);
      setInfoMessage('A new reset code has been sent to your email.');

      if (res.developmentOtp) {
        setDevelopmentOtp(res.developmentOtp);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'We couldn’t send a new code. Try again in a moment.'));
    } finally {
      setResending(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      setError('Enter all 6 digits of the code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }

    if (passwordTooLong(newPassword)) {
      setError('Password must be 72 characters or fewer.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The two passwords don’t match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
        newPassword,
      });

      setStep('SUCCESS');
    } catch (err) {
      setError(getApiErrorMessage(err, 'That code didn’t work. Check it or send a new code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            onBack={step === 'SUCCESS' ? undefined : 'default'}
            backLabel={step === 'RESET_FORM' ? 'Back to email' : 'Go back'}
          />

          {/* ==================================================== */}
          {/* STEP 1: ENTER EMAIL FOR RECOVERY                     */}
          {/* ==================================================== */}
          {step === 'EMAIL_INPUT' && (
            <View style={styles.cardContainer}>
              <View style={styles.iconCircle}>
                <KeyRound size={28} color={colors.primary.forest} />
              </View>

              <Text style={styles.title} accessibilityRole="header">Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter your account email and we’ll send you a code to choose a new password.
              </Text>

              {error ? <InlineNotice tone="danger" message={error} style={styles.notice} /> : null}

              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color={colors.neutral.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (error) setError('');
                    }}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.neutral.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    style={styles.inputWithIcon}
                    returnKeyType="go"
                    onSubmitEditing={handleCheckEmail}
                  />
                </View>
              </View>

              <Button title="Send reset code" onPress={() => void handleCheckEmail()} loading={loading} disabled={!email.trim()} />

              <View style={styles.infoBox}>
                <ShieldCheck size={20} color={colors.primary.forest} />
                <Text style={styles.infoBoxText}>
                  Signed up with Google? Your account has no separate password. Continue with Google instead.
                </Text>
              </View>

              <GoogleButton onPress={() => void handleGoogleSignIn()} loading={googleLoading} disabled={loading} />

              <View style={styles.switchRow}>
                <Text style={styles.switchTextMuted}>Remember your password?</Text>
                <TextLink title="Sign in" onPress={() => router.back()} />
              </View>
            </View>
          )}

          {/* ==================================================== */}
          {/* STEP 2B: OTP & NEW PASSWORD FORM                     */}
          {/* ==================================================== */}
          {step === 'RESET_FORM' && (
            <View style={styles.cardContainer}>
              <View style={styles.iconCircle}>
                <Lock size={28} color={colors.primary.forest} />
              </View>

              <Text style={styles.title} accessibilityRole="header">Choose a new password</Text>
              <Text style={styles.subtitle}>
                If an account uses <Text style={styles.boldText}>{email}</Text>, we sent it a 6-digit
                code. Enter it below with your new password.
              </Text>

              {infoMessage ? <InlineNotice tone="info" message={infoMessage} style={styles.notice} /> : null}

              {error ? <InlineNotice tone="danger" message={error} style={styles.notice} /> : null}

              {/* Dev OTP Chip Helper (dev mode only) */}
              {developmentOtp ? (
                <Pressable accessibilityRole="button"
                  onPress={() => {
                    const digits = developmentOtp.split('').slice(0, OTP_LENGTH);
                    setOtp(digits);
                  }}
                  style={styles.devOtpChip}
                >
                  <Text style={styles.devOtpChipText}>
                    Development code: <Text style={styles.boldText}>{developmentOtp}</Text> (tap to fill)
                  </Text>
                </Pressable>
              ) : null}

              {/* 6-Digit OTP Code Input */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Verification code</Text>
                  {resending ? (
                    <ActivityIndicator size="small" color={colors.primary.forest} accessibilityLabel="Sending a new code" />
                  ) : (
                    <TextLink
                      title={secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Send a new code'}
                      disabled={secondsLeft > 0}
                      onPress={() => void handleResendCode()}
                    />
                  )}
                </View>

                <View style={styles.otpRow}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(el) => {
                        otpInputs.current[index] = el;
                      }}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={OTP_LENGTH}
                      selectTextOnFocus
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      accessibilityLabel={`Code digit ${index + 1} of ${OTP_LENGTH}`}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* New Password Input */}
              <View style={styles.field}>
                <Text style={styles.label}>New password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (error) setError('');
                    }}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.neutral.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    style={styles.inputWithToggle}
                  />
                  <IconButton
                    icon={showPassword ? 'eyeOff' : 'eye'}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword((prev) => !prev)}
                    color={colors.neutral.textSecondary}
                    size={22}
                  />
                </View>
              </View>

              {/* Confirm New Password Input */}
              <View style={styles.field}>
                <Text style={styles.label}>Confirm new password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (error) setError('');
                    }}
                    placeholder="Re-enter your new password"
                    placeholderTextColor={colors.neutral.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    style={styles.inputWithToggle}
                  />
                  <IconButton
                    icon={showConfirmPassword ? 'eyeOff' : 'eye'}
                    accessibilityLabel={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    color={colors.neutral.textSecondary}
                    size={22}
                  />
                </View>
              </View>

              <Button
                title="Update password"
                onPress={() => void handleResetPassword()}
                loading={loading}
                disabled={otp.join('').length < OTP_LENGTH || !newPassword || !confirmPassword}
              />
            </View>
          )}

          {/* ==================================================== */}
          {/* STEP 3: SUCCESS STATE                                */}
          {/* ==================================================== */}
          {step === 'SUCCESS' && (
            <View style={styles.cardContainer}>
              <View style={[styles.iconCircle, styles.successIconCircle]}>
                <CheckCircle2 size={36} color={colors.semantic.success} />
              </View>

              <Text style={styles.title} accessibilityRole="header">Password updated</Text>
              <Text style={styles.subtitle}>
                Sign in with your new password.
              </Text>

              <Button title="Go to sign in" onPress={() => router.replace('/(auth)/login')} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notice: { marginBottom: 16 },
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.white,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.brand.mint,
  },
  topBarBrand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 16,
    color: colors.primary.deepForest,
    letterSpacing: 2,
  },
  topBarPlaceholder: {
    width: 40,
  },
  cardContainer: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginTop: 8,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIconCircle: {
    backgroundColor: colors.semantic.successSoft,
  },
  title: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 24,
    color: colors.primary.deepForest,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textSecondary,
    lineHeight: 21,
    marginBottom: 24,
  },
  boldText: {
    fontWeight: '600',
    color: colors.primary.deepForest,
  },
  errorAlert: {
    backgroundColor: colors.semantic.errorSoft,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.semantic.error,
  },
  errorAlertText: {
    fontSize: 14,
    color: colors.semantic.error,
    lineHeight: 20,
  },
  infoAlert: {
    backgroundColor: colors.brand.mint,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.forest,
  },
  infoAlertText: {
    fontSize: 14,
    color: colors.primary.deepForest,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.brand.mint,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 24,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary.deepForest,
    lineHeight: 19,
  },
  devOtpChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.semantic.warningSoft,
    borderColor: colors.semantic.warning,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
  },
  devOtpChipText: {
    fontSize: 13,
    color: colors.semantic.warning,
  },
  field: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral.textSecondary,
    
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIcon: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },
  inputWithToggle: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },
  toggleButton: {
    padding: 8,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  otpBox: {
    width: 44,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary.deepForest,
  },
  otpBoxFilled: {
    borderColor: colors.primary.forest,
    backgroundColor: colors.brand.mint,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.forest,
  },
  resendTextDisabled: {
    color: colors.neutral.textMuted,
  },
  primaryButton: {
    backgroundColor: colors.primary.forest,
    borderRadius: 12,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonArrow: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: '600',
  },
  googleButton: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.white,
    gap: 12,
    marginBottom: 16,
  },
  googleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: colors.neutral.white,
    fontWeight: '800',
    fontSize: 15,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchTextMuted: {
    fontSize: 15,
    color: colors.neutral.textSecondary,
  },
  switchTextLink: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary.forest,
  },
});
