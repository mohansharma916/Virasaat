import { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useFocusEffect } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';

export default function LegacyReviewScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.vault.items);
  const trustedPerson = useAppSelector((state) =>
    state.vault.recipients.find((recipient) => recipient.status !== 'REVOKED') ?? null,
  );

  useFocusEffect(
    useCallback(() => {
      void dispatch(refreshVaultData());
    }, [dispatch]),
  );

  const documentsCount = items.filter((item) =>
    ['DOCUMENT', 'IMAGE', 'OTHER'].includes(item.type),
  ).length;
  const investmentsCount = items.filter((item) => item.type === 'FINANCIAL').length;
  const messagesCount = items.filter((item) => item.type === 'TEXT').length;
  const handleContinue = () => {
    router.push('/(auth)/check-in-preferences');
  };

  const handleSaveExit = () => {
    router.replace('/(auth)/home');
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

        {/* Heading */}

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>
            FINAL REVIEW
          </Text>

          <Text style={styles.title}>
            Your legacy, your way.
          </Text>

          <Text style={styles.subtitle}>
            Review everything before you activate
            Virasat.
          </Text>
        </View>

        {/* Legacy Summary */}

        <View style={styles.card}>
          <Text style={styles.cardHeading}>
            YOUR LEGACY
          </Text>

          <ReviewRow
            icon="📄"
            title="Documents"
            value={`${documentsCount} ${documentsCount === 1 ? 'item' : 'items'}`}
            onPress={() =>
              router.push(
                '/(auth)/legacy-documents',
              )
            }
          />

          <View style={styles.divider} />

          <ReviewRow
            icon="📈"
            title="Investments"
            value={`${investmentsCount} ${investmentsCount === 1 ? 'asset' : 'assets'}`}
            onPress={() =>
              router.push(
                '/(auth)/legacy-investments',
              )
            }
          />

          <View style={styles.divider} />

          <ReviewRow
            icon="💌"
            title="Personal Messages"
            value={`${messagesCount} ${messagesCount === 1 ? 'message' : 'messages'}`}
            onPress={() =>
              router.push(
                '/(auth)/legacy-message',
              )
            }
          />
        </View>

        {/* Trusted Person */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeading}>
              TRUSTED PERSON
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  '/(auth)/trusted-person',
                )
              }
              hitSlop={10}
            >
              <Text style={styles.edit}>
                Edit
              </Text>
            </Pressable>
          </View>

          <View style={styles.personRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {trustedPerson?.name.charAt(0).toUpperCase() ?? '+'}
              </Text>
            </View>

            <View style={styles.personInfo}>
              <Text style={styles.personName}>
                {trustedPerson?.name ?? 'No trusted person added'}
              </Text>

              <Text style={styles.personRelation}>
                {trustedPerson?.relationship ?? 'Optional during setup'}
              </Text>

              <Text style={styles.personEmail}>
                {trustedPerson?.email ?? 'You can add one later'}
              </Text>
            </View>
          </View>
        </View>

        {/* Release Condition */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeading}>
              RELEASE CONDITION
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  '/(auth)/release-rules',
                )
              }
              hitSlop={10}
            >
              <Text style={styles.edit}>
                Edit
              </Text>
            </Pressable>
          </View>

          <View style={styles.conditionBox}>
            <View style={styles.conditionIcon}>
              <Text style={styles.conditionEmoji}>
                ⏱
              </Text>
            </View>

            <View style={styles.conditionContent}>
              <Text style={styles.conditionTitle}>
                3 missed check-ins
              </Text>

              <Text style={styles.conditionDescription}>
                Followed by Virasat's verification
                process before anything is released.
              </Text>
            </View>
          </View>
        </View>

        {/* Security Confirmation */}

        <View style={styles.securitySection}>
          <SecurityRow text="Everything is encrypted" />

          <SecurityRow text="You control who receives it" />

          <SecurityRow text="You can change this anytime" />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Continue */}
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

        {/* Save */}
        <Pressable
          onPress={handleSaveExit}
          style={styles.saveExit}
        >
          <Text style={styles.saveExitText}>
            Not ready yet?{' '}
            <Text style={styles.saveExitBold}>
              Save & exit
            </Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ReviewRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: string;
  title: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.reviewRow}
    >
      <View style={styles.reviewIcon}>
        <Text style={styles.reviewEmoji}>
          {icon}
        </Text>
      </View>

      <View style={styles.reviewInfo}>
        <Text style={styles.reviewTitle}>
          {title}
        </Text>

        <Text style={styles.reviewValue}>
          {value}
        </Text>
      </View>

      <Text style={styles.reviewArrow}>
        →
      </Text>
    </Pressable>
  );
}

function SecurityRow({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.securityRow}>
      <View style={styles.checkCircle}>
        <Text style={styles.check}>
          ✓
        </Text>
      </View>

      <Text style={styles.securityText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
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
    backgroundColor: colors.primary.forest,
  },

  progressItemActive: {
    backgroundColor: colors.primary.forest,
  },

  heading: {
    marginTop: 18,
    marginBottom: 16,
  },

  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary.forest,
  },

  title: {
    marginTop: 7,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 30,
    lineHeight: 38,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12.5,
    lineHeight: 20,
    color: colors.neutral.textSecondary,
  },

  card: {
    marginBottom: 13,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  cardHeading: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.neutral.textMuted,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  edit: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 10,
    color: colors.primary.forest,
  },

  reviewRow: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
  },

  reviewIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reviewEmoji: {
    fontSize: 16,
  },

  reviewInfo: {
    flex: 1,
    marginLeft: 11,
  },

  reviewTitle: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },

  reviewValue: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10,
    color: colors.neutral.textSecondary,
  },

  reviewArrow: {
    fontSize: 17,
    color: colors.primary.forest,
  },

  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
  },

  personRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: colors.primary.deepForest,
  },

  personInfo: {
    marginLeft: 12,
  },

  personName: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12.5,
    color: colors.neutral.textPrimary,
  },

  personRelation: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10,
    color: colors.neutral.textSecondary,
  },

  personEmail: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    color: colors.neutral.textMuted,
  },

  conditionBox: {
    marginTop: 13,
    padding: 11,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
  },

  conditionIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  conditionEmoji: {
    fontSize: 15,
  },

  conditionContent: {
    flex: 1,
    marginLeft: 10,
  },

  conditionTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11.5,
    color: colors.neutral.textPrimary,
  },

  conditionDescription: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    lineHeight: 15,
    color: colors.neutral.textSecondary,
  },

  securitySection: {
    marginTop: 5,
    paddingHorizontal: 3,
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },

  checkCircle: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    fontSize: 11,
    color: colors.primary.forest,
  },

  securityText: {
    marginLeft: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
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
    fontSize: 14,
    color: colors.neutral.white,
  },

  buttonArrow: {
    marginLeft: 9,
    fontSize: 18,
    color: colors.neutral.white,
  },

  saveExit: {
    marginTop: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },

  saveExitText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
  },

  saveExitBold: {
    fontFamily: typography.fonts.inter.semiBold,
    color: colors.primary.forest,
  },
});
