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
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

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

type Step = 'EMAIL_INPUT' | 'GOOGLE_ACCOUNT' | 'RESET_FORM' | 'SUCCESS';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const searchParams = useLocalSearchParams<{ email?: string }>();

  // State
  const [step, setStep] = useState<Step>('EMAIL_INPUT');
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

      if (response.status === 'NOT_FOUND') {
        setError(response.message || 'No account found with this email. Please check or sign up.');
        return;
      }

      if (response.status === 'GOOGLE_ACCOUNT') {
        // Smart Strategy: User has a Google-only account!
        setStep('GOOGLE_ACCOUNT');
        return;
      }

      // Status is OTP_SENT
      setStep('RESET_FORM');
      setSecondsLeft(RESEND_COOLDOWN);
      setInfoMessage(`We've sent a 6-digit verification code to ${trimmedEmail}`);

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

      router.replace('/(auth)/home');
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
      setError(getApiErrorMessage(err, 'Could not resend code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit reset code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
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
      setError(getApiErrorMessage(err, 'Failed to reset password. Please check the code.'));
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
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => {
                if (step === 'RESET_FORM' || step === 'GOOGLE_ACCOUNT') {
                  setStep('EMAIL_INPUT');
                  setError('');
                } else {
                  router.back();
                }
              }}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
              hitSlop={12}
            >
              <ArrowLeft size={20} color={colors.neutral.textPrimary} />
            </Pressable>
            <Text style={styles.topBarBrand}>VIRASAAT</Text>
            <View style={styles.topBarPlaceholder} />
          </View>

          {/* ==================================================== */}
          {/* STEP 1: ENTER EMAIL FOR RECOVERY                     */}
          {/* ==================================================== */}
          {step === 'EMAIL_INPUT' && (
            <View style={styles.cardContainer}>
              <View style={styles.iconCircle}>
                <KeyRound size={28} color={colors.primary.forest} />
              </View>

              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your account email address and we will help you securely access your
                vault.
              </Text>

              {error ? (
                <View style={styles.errorAlert}>
                  <Text style={styles.errorAlertText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
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

              <Pressable
                disabled={loading || !email.trim()}
                onPress={handleCheckEmail}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (!email.trim() || loading) && styles.buttonDisabled,
                  pressed && email.trim() && !loading && styles.buttonPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.neutral.white} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Text style={styles.buttonArrow}>→</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                style={styles.switchRow}
                hitSlop={8}
              >
                <Text style={styles.switchTextMuted}>Remember your password? </Text>
                <Text style={styles.switchTextLink}>Sign In</Text>
              </Pressable>
            </View>
          )}

          {/* ==================================================== */}
          {/* STEP 2A: SMART GOOGLE ACCOUNT SUGGESTION             */}
          {/* ==================================================== */}
          {step === 'GOOGLE_ACCOUNT' && (
            <View style={styles.cardContainer}>
              <View style={[styles.iconCircle, styles.googleIconCircle]}>
                <Sparkles size={28} color="#EA4335" />
              </View>

              <View style={styles.googleBadge}>
                <Text style={styles.googleBadgeText}>GOOGLE SIGN-IN ACCOUNT</Text>
              </View>

              <Text style={styles.title}>You Sign In with Google</Text>
              <Text style={styles.subtitle}>
                We found your account for <Text style={styles.boldText}>{email}</Text>! Since you
                registered using Google, your account does not have or require a password.
              </Text>

              {error ? (
                <View style={styles.errorAlert}>
                  <Text style={styles.errorAlertText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.infoBox}>
                <ShieldCheck size={20} color={colors.primary.forest} />
                <Text style={styles.infoBoxText}>
                  Your digital vault is securely linked with Google OAuth. Tap below to sign in
                  directly.
                </Text>
              </View>

              <Pressable
                disabled={googleLoading}
                onPress={handleGoogleSignIn}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && !googleLoading && styles.buttonPressed,
                ]}
              >
                {googleLoading ? (
                  <ActivityIndicator color={colors.neutral.textPrimary} />
                ) : (
                  <>
                    <View style={styles.googleIconBox}>
                      <Text style={styles.googleIconText}>G</Text>
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setStep('EMAIL_INPUT');
                  setError('');
                }}
                style={styles.switchRow}
                hitSlop={8}
              >
                <Text style={styles.switchTextLink}>Try a different email address</Text>
              </Pressable>
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

              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to <Text style={styles.boldText}>{email}</Text> and choose a
                strong new password.
              </Text>

              {infoMessage ? (
                <View style={styles.infoAlert}>
                  <Text style={styles.infoAlertText}>{infoMessage}</Text>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorAlert}>
                  <Text style={styles.errorAlertText}>{error}</Text>
                </View>
              ) : null}

              {/* Dev OTP Chip Helper (dev mode only) */}
              {developmentOtp ? (
                <Pressable
                  onPress={() => {
                    const digits = developmentOtp.split('').slice(0, OTP_LENGTH);
                    setOtp(digits);
                  }}
                  style={styles.devOtpChip}
                >
                  <Text style={styles.devOtpChipText}>
                    ⚡ Dev Code: <Text style={styles.boldText}>{developmentOtp}</Text> (Tap to fill)
                  </Text>
                </Pressable>
              ) : null}

              {/* 6-Digit OTP Code Input */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>VERIFICATION CODE</Text>
                  <Pressable
                    disabled={secondsLeft > 0 || resending}
                    onPress={handleResendCode}
                    hitSlop={8}
                    style={styles.resendButton}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color={colors.primary.forest} />
                    ) : (
                      <>
                        <RotateCcw
                          size={12}
                          color={secondsLeft > 0 ? colors.neutral.textMuted : colors.primary.forest}
                        />
                        <Text
                          style={[
                            styles.resendText,
                            secondsLeft > 0 && styles.resendTextDisabled,
                          ]}
                        >
                          {secondsLeft > 0 ? `Resend (${secondsLeft}s)` : 'Resend Code'}
                        </Text>
                      </>
                    )}
                  </Pressable>
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
                <Text style={styles.label}>NEW PASSWORD</Text>
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
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}
                    style={styles.toggleButton}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.neutral.textMuted} />
                    ) : (
                      <Eye size={18} color={colors.neutral.textMuted} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Confirm New Password Input */}
              <View style={styles.field}>
                <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
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
                  <Pressable
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    hitSlop={8}
                    style={styles.toggleButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color={colors.neutral.textMuted} />
                    ) : (
                      <Eye size={18} color={colors.neutral.textMuted} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                disabled={
                  loading ||
                  otp.join('').length < OTP_LENGTH ||
                  !newPassword ||
                  !confirmPassword
                }
                onPress={handleResetPassword}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (loading ||
                    otp.join('').length < OTP_LENGTH ||
                    !newPassword ||
                    !confirmPassword) &&
                    styles.buttonDisabled,
                  pressed && !loading && styles.buttonPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.neutral.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Update Password & Sign In</Text>
                )}
              </Pressable>
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

              <Text style={styles.title}>Password Reset Complete</Text>
              <Text style={styles.subtitle}>
                Your Virasaat vault password has been successfully updated. You can now log in with
                your new password.
              </Text>

              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Go to Sign In</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
    width: 40,
    height: 40,
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
    fontFamily: typography.fonts.display,
    fontSize: 16,
    fontWeight: '700',
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
    borderColor: '#E8E4DC',
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
  googleIconCircle: {
    backgroundColor: '#FDEAE8',
  },
  successIconCircle: {
    backgroundColor: colors.semantic.successSoft,
  },
  googleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDEAE8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  googleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D93025',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: typography.fonts.display,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.deepForest,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
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
    fontSize: 13,
    color: colors.semantic.error,
    lineHeight: 18,
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
    fontSize: 13,
    color: colors.primary.deepForest,
    lineHeight: 18,
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
    fontSize: 13,
    color: colors.primary.deepForest,
    lineHeight: 19,
  },
  devOtpChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
  },
  devOtpChipText: {
    fontSize: 12,
    color: '#92400E',
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral.textSecondary,
    letterSpacing: 1,
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
    height: 48,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },
  inputWithToggle: {
    flex: 1,
    height: 48,
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
    height: 52,
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
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.forest,
  },
  resendTextDisabled: {
    color: colors.neutral.textMuted,
  },
  primaryButton: {
    backgroundColor: colors.primary.forest,
    borderRadius: 12,
    height: 50,
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
    height: 50,
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
    fontSize: 14,
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
    fontSize: 14,
    color: colors.neutral.textSecondary,
  },
  switchTextLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.forest,
  },
});
