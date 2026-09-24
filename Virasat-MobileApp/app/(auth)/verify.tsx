import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

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

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import {
  resendVerification,
  verifyEmail,
} from '@/src/api/auth.api';
import { saveAccessToken } from '@/src/storage/auth.storage';
import { getApiErrorMessage } from '@/src/utils/api-error';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const { email, developmentOtp } = useLocalSearchParams<{
    email?: string;
    developmentOtp?: string;
  }>();

  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill('')
  );

  const [secondsLeft, setSecondsLeft] =
    useState(RESEND_SECONDS);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputs = useRef<Array<TextInput | null>>([]);

  /*
   * Countdown
   */
  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  /*
   * Focus first OTP field when screen opens.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      inputs.current[0]?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const formattedTime = () => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  /*
   * Handle typing into an OTP box.
   */
  const handleOtpChange = (
    value: string,
    index: number
  ) => {
    setError('');

    /*
     * Handles paste.
     *
     * If user pastes:
     * 123456
     *
     * distribute it across all six boxes.
     */
    if (value.length > 1) {
      const digits = value
        .replace(/\D/g, '')
        .slice(0, OTP_LENGTH);

      if (!digits) {
        return;
      }

      const nextOtp = Array(OTP_LENGTH).fill('');

      digits.split('').forEach((digit, i) => {
        nextOtp[i] = digit;
      });

      setOtp(nextOtp);

      const nextIndex = Math.min(
        digits.length,
        OTP_LENGTH - 1
      );

      inputs.current[nextIndex]?.focus();

      return;
    }

    const digit = value.replace(/\D/g, '');

    const nextOtp = [...otp];

    nextOtp[index] = digit;

    setOtp(nextOtp);

    /*
     * Automatically move to next field.
     */
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  /*
   * Handle backspace.
   */
  const handleKeyPress = (
    event: any,
    index: number
  ) => {
    if (
      event.nativeEvent.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) {
      return;
    }

    setError('');

    if (!email) {
      setError('Your signup email is missing. Please start again.');
      return;
    }

    try {
      setLoading(true);
      await resendVerification(email);
    } catch (error) {
      setError(getApiErrorMessage(error, 'We could not resend the code. Please try again.'));
      return;
    } finally {
      setLoading(false);
    }

    setSecondsLeft(RESEND_SECONDS);

    setOtp(Array(OTP_LENGTH).fill(''));

    inputs.current[0]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');

    if (code.length !== OTP_LENGTH) {
      setError(
        'Please enter the complete 6-digit verification code.'
      );
      return;
    }

    try {
      setLoading(true);
      setError('');
      if (!email) {
        setError('Your signup email is missing. Please start again.');
        return;
      }

      const result = await verifyEmail(email, code);
      await saveAccessToken(result.accessToken);
      router.replace('/(auth)/security');
    } catch (error) {
      setError(getApiErrorMessage(error, 'The verification code is incorrect. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
              <Text style={styles.backArrow}>
                ‹
              </Text>
            </Pressable>

            <Text style={styles.brand}>
              VIRASAT
            </Text>
          </View>

          {/* Main */}
          <View style={styles.main}>
            <Text style={styles.icon}>
              ✉
            </Text>

            <Text style={styles.title}>
              Verify your email
            </Text>

            <Text style={styles.description}>
              We've sent a 6-digit verification code
              to your email address.
            </Text>

            <Text
              style={styles.email}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {email || 'your email address'}
            </Text>

            {__DEV__ && developmentOtp ? (
              <Text style={styles.devCode}>
                Development code: {developmentOtp}
              </Text>
            ) : null}

            {/* OTP */}
            <View style={styles.otpSection}>
              <Text style={styles.otpLabel}>
                Enter verification code
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputs.current[index] = ref;
                    }}
                    value={digit}
                    onChangeText={(value) =>
                      handleOtpChange(
                        value,
                        index
                      )
                    }
                    onKeyPress={(event) =>
                      handleKeyPress(
                        event,
                        index
                      )
                    }
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    selectTextOnFocus
                    style={[
                      styles.otpInput,
                      error &&
                        styles.otpInputError,
                      digit &&
                        styles.otpInputFilled,
                    ]}
                  />
                ))}
              </View>

              {/* Error */}
              {error && (
                <Text style={styles.error}>
                  {error}
                </Text>
              )}
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              {secondsLeft > 0 ? (
                <>
                  <Text style={styles.timerLabel}>
                    Code expires in
                  </Text>

                  <Text style={styles.timer}>
                    {formattedTime()}
                  </Text>
                </>
              ) : (
                <Text style={styles.expired}>
                  Your code has expired
                </Text>
              )}
            </View>

            {/* Resend */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive it?
              </Text>

              <Pressable
                disabled={secondsLeft > 0}
                onPress={handleResend}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.resendButton,
                    secondsLeft > 0 &&
                      styles.resendDisabled,
                  ]}
                >
                  Resend code
                </Text>
              </Pressable>
            </View>

            {/* Verify */}
            <Pressable
              onPress={handleVerify}
              disabled={loading}
              style={({ pressed }) => [
                styles.verifyButton,
                pressed &&
                  !loading &&
                  styles.buttonPressed,
                loading &&
                  styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  color={colors.neutral.white}
                />
              ) : (
                <Text style={styles.verifyText}>
                  Verify Email
                </Text>
              )}
            </Pressable>
          </View>

          {/* Security */}
          <View style={styles.security}>
            <View style={styles.securityIcon}>
              <Text style={styles.securityCheck}>
                ✓
              </Text>
            </View>

            <Text style={styles.securityText}>
              Your information is securely protected
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingBottom: 28,
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

  main: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 48,
  },

  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.brand.sage,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 25,
    color: colors.primary.forest,
    marginBottom: 24,
    overflow: 'hidden',
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.primary.deepForest,
    textAlign: 'center',
  },

  description: {
    marginTop: 14,
    maxWidth: 330,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  email: {
    marginTop: 8,
    maxWidth: 280,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.primary.forest,
  },

  devCode: {
    marginTop: 10,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.primary.forest,
    textAlign: 'center',
  },

  otpSection: {
    width: '100%',
    marginTop: 42,
  },

  otpLabel: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    color: colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  otpInput: {
    width: 46,
    height: 54,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 20,
    color: colors.primary.deepForest,
  },

  otpInputFilled: {
    borderColor: colors.primary.forest,
    backgroundColor: colors.brand.mint,
  },

  otpInputError: {
    borderColor: '#B42318',
  },

  error: {
    marginTop: 10,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#B42318',
    textAlign: 'center',
  },

  timerContainer: {
    alignItems: 'center',
    marginTop: 28,
  },

  timerLabel: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textMuted,
  },

  timer: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.primary.forest,
  },

  expired: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    color: '#B42318',
  },

  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  resendText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },

  resendButton: {
    marginLeft: 5,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.forest,
  },

  resendDisabled: {
    color: colors.neutral.textMuted,
  },

  verifyButton: {
    width: '100%',
    height: 56,
    marginTop: 30,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  verifyText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },

  security: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },

  securityIcon: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityCheck: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary.forest,
  },

  securityText: {
    marginLeft: 7,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
  },
});
