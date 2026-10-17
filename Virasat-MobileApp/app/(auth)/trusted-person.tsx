import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Contact, ContactField, requestPermissionsAsync } from 'expo-contacts';

import { router, useLocalSearchParams } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StepProgress } from '@/src/components/StepProgress';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { setTrustedPersonDraft } from '@/src/store/trusted-person-draft.slice';

export default function TrustedPersonScreen() {
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ recipientId?: string; onboarding?: string }>();
  const existingRecipient = useAppSelector((state) =>
    state.vault.recipients.find((recipient) => recipient.id === params.recipientId),
  );
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickerError, setPickerError] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    relationship?: string;
    email?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    if (!existingRecipient) {
      return;
    }

    setName(existingRecipient.name);
    setRelationship(existingRecipient.relationship ?? '');
    setEmail(existingRecipient.email);
    setPhone(existingRecipient.phone ?? '');
  }, [existingRecipient]);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Enter their full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Enter their email address. We need it to reach them later.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      newErrors.email = 'Enter an email address like name@example.com.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const clearError = (
    field: keyof typeof errors
  ) => {
    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };

  const fillFromContact = (details: { fullName?: string | null; emails?: { address?: string }[]; phones?: { number?: string }[] }) => {
    if (details.fullName) setName(details.fullName);
    const pickedEmail = details.emails?.find((entry) => entry.address)?.address;
    const pickedPhone = details.phones?.find((entry) => entry.number)?.number;
    if (pickedEmail && !existingRecipient) setEmail(pickedEmail);
    if (pickedPhone) setPhone(pickedPhone);
    setErrors({});
  };

  const chooseFromContacts = async () => {
    setPickerError('');
    try {
      const contact = await Contact.presentPicker();
      if (!contact) return;
      const fields = [ContactField.FULL_NAME, ContactField.EMAILS, ContactField.PHONES] as const;
      try {
        fillFromContact(await contact.getDetails(fields));
      } catch {
        // Android needs read access to load the picked contact's details.
        const permission = await requestPermissionsAsync();
        if (!permission.granted) {
          setPickerError('Allow contacts access to fill in their details, or type them below.');
          return;
        }
        fillFromContact(await contact.getDetails(fields));
      }
    } catch {
      setPickerError('We couldn’t open your contacts. Type their details below instead.');
    }
  };

  const handleContinue = () => {
    if (!validate()) {
      return;
    }

    // Nothing is sent yet: the review screen saves after a final check.
    dispatch(setTrustedPersonDraft({
      recipientId: existingRecipient?.id ?? null,
      name: name.trim(),
      relationship,
      email: email.trim(),
      phone: phone.trim(),
      verificationRequired: existingRecipient?.verificationRequired ?? true,
      notificationMode: existingRecipient?.notificationMode ?? 'INFORM_ON_ACTIVATION',
      fromOnboarding: params.onboarding === 'true',
    }));
    router.push('/(auth)/trusted-person-review');
  };

  const fromOnboarding = params.onboarding === 'true';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader onBack="default" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {fromOnboarding ? <StepProgress phase="Account" /> : null}

          <Text style={[styles.title, fromOnboarding && styles.titleOnboarding]} accessibilityRole="header">
            {existingRecipient ? 'Edit trusted person' : 'Add a trusted person'}
          </Text>
          <Text style={styles.subtitle}>Someone you trust to receive parts of your legacy.</Text>

          {!existingRecipient ? (
            <>
              <Button
                title="Choose from contacts"
                variant="secondary"
                onPress={() => void chooseFromContacts()}
                icon={<AppIcon name="contact" size={20} color={colors.primary.forest} />}
              />
              {pickerError ? <InlineNotice tone="warning" message={pickerError} style={styles.notice} /> : null}
              <Text style={styles.orText}>or enter their details</Text>
            </>
          ) : null}

          <Input
            label="Full name"
            placeholder="Their full name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearError('name');
            }}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
          />

          <Input
            label="Relationship"
            placeholder="For example: spouse, child, friend"
            value={relationship}
            onChangeText={setRelationship}
            required={false}
            autoCapitalize="words"
          />

          <Input
            label="Email address"
            placeholder="their@email.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearError('email');
            }}
            error={errors.email}
            helper={existingRecipient ? 'Email can’t be changed after saving.' : undefined}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!existingRecipient}
            autoComplete="email"
          />

          <Input
            label="Phone number"
            placeholder="With country code, e.g. +91 98765 43210"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              clearError('phone');
            }}
            error={errors.phone}
            required={false}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />

          <InlineNotice
            tone="brand"
            title="They won’t get access yet"
            message="Adding someone doesn’t give them access to your vault or notify them."
          />
        </ScrollView>

        <ActionBar>
          <Button title="Review details" onPress={handleContinue} />
        </ActionBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  title: {
    marginTop: 8,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  titleOnboarding: { marginTop: 24 },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  notice: { marginTop: 12 },
  orText: {
    marginVertical: 20,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.caption,
    color: colors.neutral.textMuted,
  },
});
