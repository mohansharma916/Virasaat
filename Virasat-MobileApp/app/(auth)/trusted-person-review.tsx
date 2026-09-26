import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type NotificationMode =
  | 'INFORM_NOW'
  | 'INFORM_ON_ACTIVATION';

export default function TrustedPersonReviewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    recipientId?: string;
    name?: string;
    relationship?: string;
    email?: string;
    phone?: string;
    verificationRequired?: string;
  }>();

  const [notificationMode, setNotificationMode] =
    useState<NotificationMode | null>('INFORM_ON_ACTIVATION');

  const [verificationRequired, setVerificationRequired] = useState(params.verificationRequired !== 'false');

  const handleContinue = () => {
    if (!notificationMode) {
      return;
    }

    router.push({
      pathname: '/(auth)/trusted-person-confirmation',
      params: {
        recipientId: params.recipientId ?? '',
        name: params.name ?? '',
        relationship: params.relationship ?? '',
        email: params.email ?? '',
        phone: params.phone ?? '',
        notificationMode,
        verificationRequired: String(verificationRequired),
      },
    });
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
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={styles.brand}>
            VIRASAT
          </Text>
        </View>

        {/* Heading */}

        <View style={styles.heading}>
          <Text style={styles.title}>
            Review trusted person
          </Text>

          <Text style={styles.subtitle}>
            Make sure these details are correct
            before continuing.
          </Text>
        </View>

        {/* Person card */}

        <View style={styles.personCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>
              TRUSTED PERSON
            </Text>

            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
            >
              <Text style={styles.editText}>
                Edit →
              </Text>
            </Pressable>
          </View>

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
                {params.relationship?.trim() ||
                  'Relationship not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>
              ✉
            </Text>

            <Text style={styles.contactText}>
              {params.email || 'No email provided'}
            </Text>
          </View>

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>
              ☎
            </Text>

            <Text style={styles.contactText}>
              {params.phone || 'No phone provided'}
            </Text>
          </View>
        </View>

        {/* Notification heading */}

        <Text style={styles.sectionTitle}>
          When should we contact them?
        </Text>

        {/* Inform now */}

        <NotificationOption
          selected={
            notificationMode === 'INFORM_NOW'
          }
          title="Inform now"
          description="We'll send them an invitation now. They'll know you've chosen them."
          onPress={() =>
            setNotificationMode('INFORM_NOW')
          }
        />

        {/* Inform later */}

        <NotificationOption
          selected={
            notificationMode ===
            'INFORM_ON_ACTIVATION'
          }
          title="Keep private"
          description="Save without sending any invitation. You can choose to inform them later."
          onPress={() =>
            setNotificationMode(
              'INFORM_ON_ACTIVATION'
            )
          }
        />

        <Text style={styles.sectionTitle}>Identity verification preference</Text>
        <NotificationOption selected={verificationRequired} title="Required" description="If the assigned policy requires verification, it must be completed before released content can be opened." onPress={() => setVerificationRequired(true)} />
        <NotificationOption selected={!verificationRequired} title="Not required" description="Choose a compatible policy when assigning an item. Authentication and release authorization always apply." onPress={() => setVerificationRequired(false)} />
        {/* Security note */}

        <View style={styles.securityCard}>
          <View style={styles.lockCircle}>
            <Text style={styles.lock}>
              🔒
            </Text>
          </View>

          <Text style={styles.securityText}>
            They won't have access to your vault
            just by being added as a trusted person.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          disabled={!notificationMode}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            !notificationMode &&
              styles.buttonDisabled,
            pressed &&
              notificationMode &&
              styles.buttonPressed,
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
    </SafeAreaView>
  );
}

function NotificationOption({
  selected,
  title,
  description,
  onPress,
}: {
  selected: boolean;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View
        style={[
          styles.radio,
          selected && styles.radioSelected,
        ]}
      >
        {selected && (
          <View style={styles.radioInner} />
        )}
      </View>

      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>
          {title}
        </Text>

        <Text style={styles.optionDescription}>
          {description}
        </Text>
      </View>
    </Pressable>
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

  heading: {
    marginTop: 38,
    marginBottom: 27,
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 30,
    lineHeight: 39,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.neutral.textSecondary,
  },

  personCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardLabel: {
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

  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
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
    marginTop: 13,
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

  sectionTitle: {
    marginTop: 29,
    marginBottom: 13,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.textPrimary,
  },

  option: {
    flexDirection: 'row',
    padding: 17,
    marginBottom: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
  },

  optionSelected: {
    borderColor: colors.primary.forest,
    backgroundColor: colors.brand.mint,
  },

  optionPressed: {
    opacity: 0.85,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  radioSelected: {
    borderColor: colors.primary.forest,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.forest,
  },

  optionContent: {
    flex: 1,
    marginLeft: 12,
  },

  optionTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },

  optionDescription: {
    marginTop: 5,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textSecondary,
  },

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    padding: 14,
    borderRadius: 13,
    backgroundColor: colors.brand.mint,
  },

  lockCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lock: {
    fontSize: 12,
  },

  securityText: {
    flex: 1,
    marginLeft: 10,
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

  buttonDisabled: {
    opacity: 0.4,
  },

  buttonPressed: {
    transform: [{ scale: 0.99 }],
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
