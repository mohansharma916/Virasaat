import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { api } from '@/src/api/client';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setMessage('');
    api
      .get<{ status: 'UNAVAILABLE'; message: string }>('/users/me/deletion', {
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setMessage(
            data.status === 'UNAVAILABLE'
              ? data.message
              : 'Deletion eligibility could not be confirmed. Your account has not been changed.',
          );
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.replace({
              pathname: '/(auth)/profile',
              params: { mode: 'edit' },
            })
          }
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.brand}>VIRASAT</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>CRITICAL ACTION</Text>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.subtitle}>
            Please review the security and vault retention implications below before continuing.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <Text style={styles.warningSymbol}>⚠️</Text>
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Permanent Vault Deletion</Text>
            <Text style={styles.warningText}>
              Account deletion permanently deletes your vault content, recipient assignments, invitations, check-ins, and active sessions.
            </Text>
            <Text style={[styles.warningText, { marginTop: 6 }]}>
              Copies already downloaded or retrieved by authorized recipients cannot be remotely recalled.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Verification & Audit Requirements</Text>
          <Text style={styles.infoText}>
            Before account deletion can be completed, Virasat checks for active custody cases, enforces audit-retention timelines, and requires two-factor identity verification.
          </Text>
        </View>

        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.primary.deepForest} size="small" />
            <Text style={styles.statusText}>
              Checking account deletion eligibility…
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Error checking status</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {message ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>Deletion Notice</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.safeNote}>
          <Text style={styles.safeIcon}>🛡</Text>
          <Text style={styles.safeText}>
            No deletion request has been submitted. Your vault and account remain intact.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!loading && (
          <Pressable
            onPress={() => setRetry((v) => v + 1)}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Check Eligibility Again</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() =>
            router.replace({
              pathname: '/(auth)/profile',
              params: { mode: 'edit' },
            })
          }
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Keep Account & Return</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 34,
    fontWeight: '300',
    color: colors.primary.deepForest,
  },
  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.primary.deepForest,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  heading: {
    marginTop: 14,
    marginBottom: 20,
  },
  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#B42318',
  },
  title: {
    marginTop: 6,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 27,
    lineHeight: 34,
    color: '#9B1C1C',
  },
  subtitle: {
    marginTop: 6,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningSymbol: {
    fontSize: 20,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 4,
  },
  warningText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 17,
    color: '#7F1D1D',
  },
  infoCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: 14,
  },
  infoTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.deepForest,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.neutral.textSecondary,
  },
  statusBox: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textMuted,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F87171',
    marginBottom: 14,
  },
  errorTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 2,
  },
  errorText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11.5,
    color: '#7F1D1D',
  },
  noticeBox: {
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  noticeTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: '#92400E',
    marginBottom: 2,
  },
  noticeText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#78350F',
  },
  safeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  safeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  safeText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    gap: 10,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.white,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: '#991B1B',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
