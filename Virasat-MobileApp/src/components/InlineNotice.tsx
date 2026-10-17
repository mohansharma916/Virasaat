import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { TextLink } from '@/src/components/TextLink';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'brand';

type InlineNoticeProps = {
  tone?: Tone;
  title?: string;
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

const TONES: Record<Tone, { bg: string; fg: string; icon: IconName }> = {
  info: { bg: colors.semantic.infoSoft, fg: colors.semantic.info, icon: 'info' },
  success: { bg: colors.semantic.successSoft, fg: colors.semantic.success, icon: 'checkCircle' },
  warning: { bg: colors.semantic.warningSoft, fg: colors.semantic.warning, icon: 'warning' },
  danger: { bg: colors.semantic.errorSoft, fg: colors.semantic.error, icon: 'alert' },
  brand: { bg: colors.brand.mint, fg: colors.primary.forest, icon: 'lock' },
};

// Inline status message. Errors and warnings are announced to screen readers.
export function InlineNotice({ tone = 'info', title, message, icon, actionLabel, onAction, style }: InlineNoticeProps) {
  const t = TONES[tone];
  const urgent = tone === 'danger' || tone === 'warning';

  return (
    <View
      style={[styles.notice, { backgroundColor: t.bg }, style]}
      accessibilityRole={urgent ? 'alert' : undefined}
      accessibilityLiveRegion={urgent ? 'polite' : 'none'}
    >
      <AppIcon name={icon ?? t.icon} size={20} color={t.fg} />
      <View style={styles.body}>
        {title ? <Text style={[styles.title, { color: tone === 'brand' ? colors.neutral.textPrimary : t.fg }]}>{title}</Text> : null}
        <Text style={styles.message}>{message}</Text>
        {actionLabel && onAction ? (
          <TextLink title={actionLabel} onPress={onAction} tone={tone === 'danger' ? 'danger' : 'brand'} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 12, alignItems: 'flex-start' },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, lineHeight: 20 },
  message: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
});
