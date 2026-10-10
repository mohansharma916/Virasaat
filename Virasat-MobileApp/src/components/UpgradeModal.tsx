import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

export function UpgradeModal({
  visible,
  onClose,
  title,
  message,
  benefits = [],
  ctaText = 'View Plans',
  onCtaPress,
  secondaryCtaText = 'Not now',
}: UpgradeModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.badgeRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.shieldIcon}>✦</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>VIRASAT PREMIUM</Text>
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>

          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Text style={styles.message}>Paid upgrades are not available yet. The benefits below describe planned tiers.</Text>

          {benefits.length > 0 && (
            <View style={styles.benefitsContainer}>
              {benefits.map((benefit, idx) => (
                <View key={idx} style={styles.benefitRow}>
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionContainer}>
            <Button
              title={ctaText}
              onPress={() => {
                onClose();
                onCtaPress();
              }}
            />

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryPressed,
              ]}
            >
              <Text style={styles.secondaryText}>{secondaryCtaText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 63, 52, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.neutral.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    shadowColor: colors.primary.deepForest,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    fontSize: 20,
    color: colors.primary.deepForest,
  },
  badge: {
    backgroundColor: colors.brand.mint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: typography.fonts.ui,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary.deepForest,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: typography.fonts.display,
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral.textPrimary,
    lineHeight: 28,
    marginBottom: 8,
  },
  message: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    color: colors.neutral.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  benefitsContainer: {
    backgroundColor: colors.brand.ivory,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: colors.neutral.white,
    fontSize: 12,
    fontWeight: '700',
  },
  benefitText: {
    flex: 1,
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    color: colors.neutral.textPrimary,
    fontWeight: '500',
  },
  actionContainer: {
    gap: 10,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    opacity: 0.7,
  },
  secondaryText: {
    fontFamily: typography.fonts.ui,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
  },
});
