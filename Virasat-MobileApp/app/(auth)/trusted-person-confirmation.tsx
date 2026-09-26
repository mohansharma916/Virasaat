import { createItemRequestKey } from '@/src/api/vault.api';
import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { createRecipient, updateRecipient, inviteRecipient } from '@/src/api/recipients.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { addRecipient, refreshVaultData } from '@/src/store/vault.slice';

export default function TrustedPersonConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{
    name?: string;
    relationship?: string;
    email?: string;
    phone?: string;
    notificationMode?: string;
    recipientId?: string;
    verificationRequired?: string;
  }>();

  const isInformNow =
    params.notificationMode === 'INFORM_NOW';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const requestKey = useRef(createItemRequestKey());
  const savedId = useRef(params.recipientId);

  const handleConfirm = async () => {
    if (busy.current) return;
    const name = params.name?.trim();
    const email = params.email?.trim();

    if (!name || !email) {
      setError('The trusted person details are incomplete. Please go back and review them.');
      return;
    }

    try {
      busy.current = true;
      setSaving(true);
      setError('');
      const recipient = savedId.current
        ? await updateRecipient(savedId.current, {
            name,
            verificationRequired: params.verificationRequired !== 'false',
            phone: params.phone?.trim() || undefined,
            relationship: params.relationship?.trim() || undefined,
          })
        : await createRecipient({
            requestKey: requestKey.current,
            name,
            verificationRequired: params.verificationRequired !== 'false',
            email,
            phone: params.phone?.trim() || undefined,
            relationship: params.relationship?.trim() || undefined,
          });
      savedId.current = recipient.id;
      if (params.recipientId) {
        await dispatch(refreshVaultData()).unwrap();
      } else {
        dispatch(addRecipient(recipient));
      }

      if (isInformNow) await inviteRecipient(recipient.id);

      router.replace({
        pathname: '/(auth)/trusted-person-success',
        params: {
          notificationMode: params.notificationMode ?? '',
          name: recipient.name,
        },
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not add this trusted person. Please try again.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleEditNotification = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
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

        {/* Hero */}

        <View style={styles.hero}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>
              ✓
            </Text>
          </View>

          <Text style={styles.eyebrow}>
            ALMOST THERE
          </Text>

          <Text style={styles.title}>
            Confirm your trusted person
          </Text>

          <Text style={styles.subtitle}>
            Review your choice one last time before
            we securely save it.
          </Text>
        </View>

        {/* Person */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            TRUSTED PERSON
          </Text>

          <View style={styles.personRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {params.name
                  ?.charAt(0)
                  .toUpperCase() || '?'}
              </Text>
            </View>

            <View style={styles.personDetails}>
              <Text style={styles.personName}>
                {params.name || 'Trusted Person'}
              </Text>

              <Text style={styles.relationship}>
                {params.relationship || ''}
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>
              ✉
            </Text>

            <Text style={styles.contactText}>
              {params.email || ''}
            </Text>
          </View>

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>
              ☎
            </Text>

            <Text style={styles.contactText}>
              {params.phone || ''}
            </Text>
          </View>
        </View>

        {/* Notification */}

        <View style={styles.notificationHeader}>
          <Text style={styles.sectionTitle}>
            NOTIFICATION
          </Text>

          <Pressable
            onPress={handleEditNotification}
          >
            <Text style={styles.editText}>
              Edit
            </Text>
          </Pressable>
        </View>

        <View style={styles.notificationCard}>
          <View style={styles.checkCircle}>
            <Text style={styles.check}>
              ✓
            </Text>
          </View>

          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              {isInformNow
                ? 'Inform Person Now'
                : 'Inform Person Later'}
            </Text>

            <Text style={styles.notificationText}>
              {isInformNow
                ? 'An invitation will be sent after you confirm.'
                : 'No invitation will be sent. Saving this person does not grant access to any item.'}
            </Text>
          </View>
        </View>

        {/* Privacy */}

        <View style={styles.privacyCard}>
          <View style={styles.lockCircle}>
            <Text style={styles.lock}>
              🔒
            </Text>
          </View>

          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>
              Your vault remains private
            </Text>

            <Text style={styles.privacyText}>
              Being designated as a trusted person
              does not give them access to your
              encrypted vault.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={saving}
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.button,
            saving && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.neutral.white} />
          ) : (
            <>
              <Text style={styles.buttonText}>
                Confirm & Continue
              </Text>

              <Text style={styles.buttonArrow}>
                →
              </Text>
            </>
          )}
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

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 35,
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

  progressContainer: {
    marginTop: 27,
    flexDirection: 'row',
    gap: 5,
  },

  progressItem: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral.border,
  },

  progressItemActive: {
    backgroundColor: colors.primary.forest,
  },

  hero: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 27,
  },

  successCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  successIcon: {
    fontSize: 25,
    fontWeight: '600',
    color: colors.primary.forest,
  },

  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.7,
    color: colors.primary.forest,
  },

  title: {
    marginTop: 8,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 29,
    lineHeight: 38,
    color: colors.primary.deepForest,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,
    maxWidth: 340,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  card: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  cardLabel: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.neutral.textMuted,
  },

  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 20,
    color: colors.primary.forest,
  },

  personDetails: {
    marginLeft: 12,
  },

  personName: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },

  relationship: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textSecondary,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  contactIcon: {
    width: 24,
    fontSize: 13,
    color: colors.primary.forest,
  },

  contactText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },

  notificationHeader: {
    marginTop: 27,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.neutral.textMuted,
  },

  editText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.primary.forest,
  },

  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 15,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.brand.sage,
  },

  checkCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.forest,
  },

  notificationContent: {
    flex: 1,
    marginLeft: 11,
  },

  notificationTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.deepForest,
  },

  notificationText: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textSecondary,
  },

  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  lockCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lock: {
    fontSize: 12,
  },

  privacyContent: {
    flex: 1,
    marginLeft: 10,
  },

  privacyTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },

  privacyText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  error: {
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: '#B42318',
  },

  buttonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },

  buttonArrow: {
    marginLeft: 10,
    fontSize: 19,
    color: colors.neutral.white,
  },

  footer: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },
});
