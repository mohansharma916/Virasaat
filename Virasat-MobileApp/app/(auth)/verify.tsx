import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { TextLink } from '@/src/components/TextLink';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import {
  resendVerification,
  verifyEmail,
} from '@/src/api/auth.api';
import { saveAccessToken } from '@/src/storage/auth.storage';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { setSessionUser } from '@/src/store/session.slice';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const dispatch = useAppDispatch();
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
  const [currentDevelopmentOtp, setCurrentDevelopmentOtp] = useState(
    developmentOtp ?? '',
  );

  const inputs = useRef<(TextInput | null)[]>([]);

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
      if (digits.length === OTP_LENGTH) void handleVerify(digits);

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
    if (digit && nextOtp.every(Boolean)) void handleVerify(nextOtp.join(''));
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
      setError('We don’t know which email to verify. Go back and sign up again.');
      return;
    }

    try {
      setLoading(true);
      const result = await resendVerification(email);
      setCurrentDevelopmentOtp(result.developmentOtp ?? '');
    } catch (error) {
      setError(getApiErrorMessage(error, 'We couldn’t send a new code. Try again in a moment.'));
      return;
    } finally {
      setLoading(false);
    }

    setSecondsLeft(RESEND_SECONDS);

    setOtp(Array(OTP_LENGTH).fill(''));

    inputs.current[0]?.focus();
  };

  const handleVerify = async (entered?: string) => {
    if (loading) return;
    const code = entered ?? otp.join('');

    if (code.length !== OTP_LENGTH) {
      setError('Enter all 6 digits of the code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      if (!email) {
        setError('We don’t know which email to verify. Go back and sign up again.');
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const result = await verifyEmail(normalizedEmail, code.trim());
      await saveAccessToken(result.accessToken);
      dispatch(setSessionUser(result.user));
      haptics.success();
      router.replace({ pathname: '/(auth)/security', params: { onboarding: 'true' } } as never);
    } catch (error) {
      haptics.error();
      setError(getApiErrorMessage(error, 'That code didn’t work. Check it and try again, or send a new code.'));
    } finally {
      setLoading(false);
    }
  };

  const openMailApp = () => void Linking.openURL('message:').catch(() => undefined);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader onBack="default" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.iconCircle}>
            <AppIcon name="mailCheck" size={28} color={colors.primary.deepForest} />
          </View>

          <Text style={styles.title} accessibilityRole="header">Check your email</Text>
          <Text style={styles.description}>
            {email ? 'We sent a 6-digit code to' : 'We sent a 6-digit code to the email you signed up with.'}
          </Text>
          {email ? (
            <Text style={styles.email} numberOfLines={1} ellipsizeMode="middle">{email}</Text>
          ) : null}
          <View style={styles.inlineLinks}>
            <TextLink title="Wrong email? Change it" onPress={() => router.back()} />
            {Platform.OS === 'ios' ? <TextLink title="Open Mail" onPress={openMailApp} /> : null}
          </View>

          {__DEV__ && currentDevelopmentOtp ? (
            <Text style={styles.devCode}>Development code: {currentDevelopmentOtp}</Text>
          ) : null}

          <Text style={styles.otpLabel} nativeID="otpLabel">Verification code</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(event) => handleKeyPress(event, index)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                selectTextOnFocus
                accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
                editable={!loading}
                style={[styles.otpInput, !!error && styles.otpInputError, !!digit && styles.otpInputFilled]}
              />
            ))}
          </View>
          <Text style={styles.hint}>You can paste the whole code into the first box.</Text>

          {error ? <InlineNotice tone="danger" message={error} style={styles.error} /> : null}

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>{secondsLeft > 0 ? 'Didn’t get it?' : 'Your code may have expired.'}</Text>
            <TextLink
              title={secondsLeft > 0 ? `Resend in ${formattedTime()}` : 'Send a new code'}
              disabled={secondsLeft > 0 || loading}
              onPress={() => void handleResend()}
            />
          </View>
        </ScrollView>

        <ActionBar>
          <Button title="Verify email" onPress={() => void handleVerify()} loading={loading} />
        </ActionBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  keyboard: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 20,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  description: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  email: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textPrimary,
  },
  inlineLinks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 },
  devCode: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.caption,
    color: colors.semantic.warning,
  },
  otpLabel: {
    marginTop: 24,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    color: colors.neutral.textPrimary,
  },
  otpContainer: { flexDirection: 'row', gap: 8 },
  otpInput: {
    flex: 1,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.control,
    backgroundColor: colors.neutral.white,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 22,
    color: colors.neutral.textPrimary,
  },
  otpInputFilled: { borderColor: colors.primary.forest, borderWidth: 2 },
  otpInputError: { borderColor: colors.semantic.error, borderWidth: 2 },
  hint: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    color: colors.neutral.textMuted,
  },
  error: { marginTop: 16 },
  resendRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  resendText: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.callout, color: colors.neutral.textSecondary },
});
