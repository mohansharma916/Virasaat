import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SelectionRow } from '@/src/components/SelectionRow';
import { TextLink } from '@/src/components/TextLink';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { createItemRequestKey } from '@/src/api/vault.api';
import { createRecipient, updateRecipient } from '@/src/api/recipients.api';
import type { RecipientNotificationMode as NotificationMode } from '@/src/api/recipients.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { haptics } from '@/src/utils/haptics';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { updateTrustedPersonDraft } from '@/src/store/trusted-person-draft.slice';
import { addRecipient, refreshVaultData } from '@/src/store/vault.slice';

// Review and save in one step (previously split across review + confirmation).
export default function TrustedPersonReviewScreen() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.trustedPersonDraft);

  const [notificationMode, setNotificationMode] = useState<NotificationMode>(draft?.notificationMode ?? 'INFORM_ON_ACTIVATION');
  const [verificationRequired, setVerificationRequired] = useState(draft?.verificationRequired ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const requestKey = useRef(createItemRequestKey());
  const savedId = useRef(draft?.recipientId ?? undefined);

  // Opened without the form (e.g. after a restart): start again from the people list.
  if (!draft) return <Redirect href="/(auth)/(tabs)/people" />;

  const name = draft.name?.trim() ?? '';
  const email = draft.email?.trim() ?? '';
  const phone = draft.phone?.trim() ?? '';
  const relationship = draft.relationship?.trim() ?? '';

  const handleSave = async () => {
    if (busy.current) return;

    if (!name || !email) {
      setError('Some details are missing. Go back and add their name and email.');
      haptics.error();
      return;
    }

    try {
      busy.current = true;
      setSaving(true);
      setError('');
      const preferences = { verificationRequired, notificationMode, phone, relationship } as const;
      const recipient = savedId.current
        ? await updateRecipient(savedId.current, { name, email, ...preferences })
        : await createRecipient({ requestKey: requestKey.current, name, email, ...preferences });
      savedId.current = recipient.id;
      dispatch(updateTrustedPersonDraft({ recipientId: recipient.id, name: recipient.name, notificationMode, verificationRequired }));
      if (draft.recipientId) {
        await dispatch(refreshVaultData()).unwrap();
      } else {
        dispatch(addRecipient(recipient));
      }
      haptics.success();
      router.replace('/(auth)/trusted-person-success');
    } catch (requestError) {
      haptics.error();
      setError(getApiErrorMessage(requestError, 'We couldn’t save this trusted person. Check your connection and try again.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">Review and save</Text>
        <Text style={styles.subtitle}>Check these details before saving.</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Trusted person</Text>
            <TextLink title="Edit" onPress={() => router.back()} accessibilityHint="Go back to the details form" />
          </View>

          <View style={styles.personRow}>
            <View style={styles.avatar}>
              {name ? (
                <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
              ) : (
                <AppIcon name="user" size={22} color={colors.primary.forest} />
              )}
            </View>
            <View style={styles.personDetails}>
              <Text style={styles.personName}>{name || 'Name missing'}</Text>
              {relationship ? <Text style={styles.meta}>{relationship}</Text> : null}
            </View>
          </View>

          {email ? (
            <View style={styles.contactRow}>
              <AppIcon name="mail" size={18} color={colors.neutral.textSecondary} />
              <Text style={styles.contactText}>{email}</Text>
            </View>
          ) : null}
          {phone ? (
            <View style={styles.contactRow}>
              <AppIcon name="phone" size={18} color={colors.neutral.textSecondary} />
              <Text style={styles.contactText}>{phone}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">When should we contact them?</Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          <SelectionRow
            kind="radio"
            selected={notificationMode === 'INFORM_ON_ACTIVATION'}
            onPress={() => setNotificationMode('INFORM_ON_ACTIVATION')}
            title="Only if they’re needed"
            description="We keep their details private. We email them only if you stop checking in and a review starts."
          />
          <SelectionRow
            kind="radio"
            selected={notificationMode === 'INFORM_NOW'}
            onPress={() => setNotificationMode('INFORM_NOW')}
            title="Invite them now"
            description="We email them today so they know you chose them. They still can’t see anything you saved."
          />
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">Identity check before access</Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          <SelectionRow
            kind="radio"
            selected={verificationRequired}
            onPress={() => setVerificationRequired(true)}
            title="Require an ID check"
            description="They must verify their identity before opening anything released to them."
          />
          <SelectionRow
            kind="radio"
            selected={!verificationRequired}
            onPress={() => setVerificationRequired(false)}
            title="No ID check"
            description="Sign-in and your release rules still apply."
          />
        </View>

        <InlineNotice
          tone="brand"
          title="Your vault stays private"
          message="Adding someone doesn’t give them access to your vault."
          style={styles.notice}
        />
      </ScrollView>

      <ActionBar>
        {error ? <InlineNotice tone="danger" message={error} style={styles.error} /> : null}
        <Button title="Save trusted person" onPress={() => void handleSave()} loading={saving} />
      </ActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
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
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    color: colors.neutral.textSecondary,
  },
  personRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.fonts.playfair.semiBold, fontSize: 20, color: colors.primary.forest },
  personDetails: { flex: 1 },
  personName: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textPrimary,
  },
  meta: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  contactText: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    color: colors.neutral.textSecondary,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.title3,
    lineHeight: typography.lineHeights.title3,
    color: colors.neutral.textPrimary,
  },
  options: { gap: 12 },
  notice: { marginTop: 24 },
  error: { marginBottom: 8 },
});
