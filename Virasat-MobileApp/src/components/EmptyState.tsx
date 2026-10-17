import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <AppIcon name={icon} size={28} color={colors.primary.forest} />
      </View>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} size="md" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.title3,
    lineHeight: typography.lineHeights.title3,
    color: colors.neutral.textPrimary,
  },
  message: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textSecondary,
  },
  action: { marginTop: 20, alignSelf: 'stretch' },
});
