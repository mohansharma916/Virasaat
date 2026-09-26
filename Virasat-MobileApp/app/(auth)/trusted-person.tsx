import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import { Input } from '@/src/components/Input';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { useAppSelector } from '@/src/store/hooks';

export default function TrustedPersonScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ recipientId?: string }>();
  const existingRecipient = useAppSelector((state) =>
    state.vault.recipients.find((recipient) => recipient.id === params.recipientId),
  );
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

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
      newErrors.name = 'Please enter their full name.';
    }

    if (!email.trim()) {
      newErrors.email =
        'Please enter their email address.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      newErrors.email =
        'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      newErrors.phone =
        'Please enter their phone number.';
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

  const handleContinue = () => {
    if (!validate()) {
      return;
    }

    /*
     * We will NOT send the trusted person
     * invitation yet.
     *
     * First we'll show a Review screen.
     */

    router.push({
      pathname: '/(auth)/trusted-person-review',
      params: {
        recipientId: existingRecipient?.id ?? '',
        name: name.trim(),
        relationship,
        email: email.trim(),
        phone: phone.trim(),
        verificationRequired: String(existingRecipient?.verificationRequired ?? true),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
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

          {/* Heading */}

          <View style={styles.heading}>
            <Text style={styles.title}>
              Add your trusted person
            </Text>

            <Text style={styles.subtitle}>
              Choose someone you trust to help with
              your Virasat legacy.
            </Text>
          </View>

          {/* Form */}

          <View style={styles.form}>
            <Input
              label="Full name"
              placeholder="Enter their full name"
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
              placeholder="e.g. Spouse, Child, Friend (optional)"
              value={relationship}
              onChangeText={setRelationship}
              required={false}
              autoCapitalize="words"
            />

            <Input
              label="Email address"
              placeholder="Their email address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearError('email');
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!existingRecipient}
              autoComplete="email"
            />

            <Input
              label="Phone number"
              placeholder="Their phone number"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                clearError('phone');
              }}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          {/* Security information */}

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Text style={styles.securityIconText}>
                🔒
              </Text>
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Important
              </Text>

              <Text style={styles.securityText}>
                Adding this person does not give them
                access to your vault. They will only
                become part of the process you define.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom CTA */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              Continue
            </Text>

            <Text style={styles.buttonArrow}>
              →
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

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

  progressContainer: {
    marginTop: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  progressDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral.border,
  },

  progressDotActive: {
    backgroundColor: colors.primary.forest,
  },

  heading: {
    marginTop: 18,
    marginBottom: 16,
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 27,
    lineHeight: 34,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 6,
    maxWidth: 350,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },

  form: {
    width: '100%',
  },

  error: {
    marginTop: -12,
    marginBottom: 18,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: '#B42318',
  },

  securityCard: {
    flexDirection: 'row',
    marginTop: 4,
    padding: 15,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.brand.sage,
  },

  securityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityIconText: {
    fontSize: 13,
  },

  securityContent: {
    flex: 1,
    marginLeft: 10,
  },

  securityTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.primary.deepForest,
  },

  securityText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
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

  buttonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },

  buttonArrow: {
    marginLeft: 10,
    fontSize: 20,
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
