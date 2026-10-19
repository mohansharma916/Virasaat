import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/src/components/AppIcon';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { Button } from './Button';

export interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  benefits?: string[];
  ctaText?: string;
  onCtaPress: () => void;
  secondaryCtaText?: string;
}

// Bottom sheet shown when a plan limit is reached. Paid plans can't be bought
// yet, so it says so and leads to the comparison, not a checkout.
export function UpgradeModal({
  visible,
  onClose,
  title,
  message,
  benefits = [],
  ctaText = 'Compare plans',
  onCtaPress,
  secondaryCtaText = 'Not now',
}: UpgradeModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          accessibilityViewIsModal
          importantForAccessibility="yes"
        >
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <AppIcon name="sparkles" size={22} color={colors.primary.deepForest} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
            >
              <AppIcon name="close" size={22} color={colors.neutral.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {benefits.length > 0 ? (
            <View style={styles.benefits}>
              {benefits.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <AppIcon name="checkCircle" size={20} color={colors.primary.forest} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          ) : null}


          <View style={styles.actions}>
            <Button
              title={ctaText}
              onPress={() => {
                onClose();
                onCtaPress();
              }}
            />
            <Button title={secondaryCtaText} variant="tertiary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(6, 63, 52, 0.45)' },
  sheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '90%',
  },
  handle: { alignSelf: 'center', width: 32, height: 4, borderRadius: 2, backgroundColor: colors.neutral.border, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  closePressed: { backgroundColor: colors.neutral.sunken },
  title: {
    marginTop: 12,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title2,
    lineHeight: typography.lineHeights.title2,
    color: colors.neutral.textPrimary,
  },
  message: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
  benefits: { marginTop: 16, gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.brand.ivory },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitText: {
    flex: 1,
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textPrimary,
  },
  actions: { marginTop: 16, gap: 4 },
});
