import { useState, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormScrollView } from '@/src/components/FormScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { createLegacyItem, createItemRequestKey } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';
import { useSubscription } from '@/src/store/subscription.slice';
import { PlanLimit } from '@/src/types/subscription.types';
import { UpgradeModal } from '@/src/components/UpgradeModal';

type Recipient = 'FAMILY' | 'SPOUSE' | 'CHILDREN' | 'OTHER';

const recipients = [
  {
    id: 'FAMILY' as Recipient,
    title: 'My family',
  },
  {
    id: 'SPOUSE' as Recipient,
    title: 'Spouse or partner',
  },
  {
    id: 'CHILDREN' as Recipient,
    title: 'My children',
  },
  {
    id: 'OTHER' as Recipient,
    title: 'Someone else',
  },
];

export default function LegacyMessageScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.vault.items);
  const { isAtLimit, getLimit, currentPlan } = useSubscription();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] =
    useState<Recipient | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; message?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const requestKey = useRef(createItemRequestKey());
  const busy = useRef(false);

  const messageLimit = getLimit(PlanLimit.PERSONAL_MESSAGES);
  const currentMessageCount = items.filter((item) => item.type === 'TEXT').length;
  const reachedLimit = isAtLimit(PlanLimit.PERSONAL_MESSAGES, currentMessageCount);

  const handleSave = async () => {
    if (busy.current) return;
    if (reachedLimit) {
      setUpgradeModalVisible(true);
      return;
    }
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = 'Give this message a title.';
    if (!message.trim()) nextErrors.message = 'Write your message before saving.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      haptics.error();
      return;
    }

    try {
      busy.current = true;
      setSaving(true);
      setSubmitError('');
      const item = await createLegacyItem({
        requestKey: requestKey.current,
        type: 'TEXT',
        category: 'MESSAGES',
        title: title.trim(),
        description: `Title: ${title.trim()}\nRecipient preference: ${recipient ?? 'Not assigned'}\n\n${message.trim()}`,
      });
      dispatch(addLegacyItem(item));
      haptics.success();
      if (router.canGoBack()) router.back();
      else router.replace('/(auth)/(tabs)/home');
    } catch (error) {
      haptics.error();
      setSubmitError(getApiErrorMessage(error, 'We couldn’t save your message. It’s still here. Try again.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const MAX_LENGTH = 20000;
  const nearLimit = message.length > MAX_LENGTH * 0.9;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.keyboard}>
        <ScreenHeader onBack="default" />
        <FormScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.category}>Personal message</Text>
          <Text style={styles.title} accessibilityRole="header">Say what matters</Text>
          <Text style={styles.subtitle}>Write something you’d want someone important to receive when the time comes.</Text>

          <Text style={styles.label} nativeID="recipientLabel">Who is this for?</Text>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabelledBy="recipientLabel">
            {recipients.map((option) => {
              const selected = recipient === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    haptics.selection();
                    setRecipient(selected ? null : option.id);
                  }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.title}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>You can link it to a specific trusted person later from your vault.</Text>

          <Input
            label="Title"
            placeholder="e.g. For my family"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
            }}
            error={errors.title}
            maxLength={200}
          />

          <Input
            label="Your message"
            placeholder="Write your message here…"
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (errors.message) setErrors((current) => ({ ...current, message: undefined }));
            }}
            error={errors.message}
            helper={nearLimit ? `${message.length.toLocaleString()} of ${MAX_LENGTH.toLocaleString()} characters` : undefined}
            multiline
            maxLength={MAX_LENGTH}
            scrollEnabled={false}
            style={styles.editor}
          />

          <InlineNotice tone="brand" title="Private until release" message="Your message is encrypted and stays private until your release rules are met." />
        </FormScrollView>

        <ActionBar>
          {submitError ? <InlineNotice tone="danger" message={submitError} style={styles.error} /> : null}
          <Button title="Save message" onPress={() => void handleSave()} loading={saving} />
        </ActionBar>
      </View>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        title="You’ve reached your message limit"
        message={`Your ${currentPlan?.name ?? 'Starter'} plan includes up to ${messageLimit ?? 3} written messages. Secure and Family include unlimited messages.`}
        benefits={['Unlimited written messages', 'Link messages to specific people', 'Kept private until release']}
        onCtaPress={() => router.push('/(auth)/plans' as never)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  keyboard: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  category: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, color: colors.primary.forest },
  title: {
    marginTop: 4,
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
  label: {
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    lineHeight: typography.lineHeights.label,
    color: colors.neutral.textPrimary,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.neutral.control,
    backgroundColor: colors.neutral.white,
  },
  chipSelected: { backgroundColor: colors.primary.deepForest, borderColor: colors.primary.deepForest },
  chipText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.label, color: colors.neutral.textPrimary },
  chipTextSelected: { color: colors.neutral.white },
  hint: {
    marginTop: 8,
    marginBottom: 20,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    color: colors.neutral.textMuted,
  },
  editor: { minHeight: 200 },
  error: { marginBottom: 8 },
});
