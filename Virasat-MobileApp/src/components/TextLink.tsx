import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type TextLinkProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'brand' | 'danger' | 'muted';
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

// Inline text action with a 44dp minimum touch height.
export function TextLink({ title, onPress, disabled, tone = 'brand', accessibilityHint, style, textStyle }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ left: 8, right: 8 }}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, style]}
    >
      <Text style={[styles.text, toneStyles[tone], disabled && styles.disabled, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  text: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, lineHeight: 20 },
  disabled: { color: colors.state.disabledText },
});

const toneStyles = StyleSheet.create({
  brand: { color: colors.primary.forest },
  danger: { color: colors.semantic.error },
  muted: { color: colors.neutral.textSecondary },
});
