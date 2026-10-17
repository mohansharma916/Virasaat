import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'destructiveOutline';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  icon?: ReactNode;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'lg',
  icon,
  accessibilityHint,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const filled = variant === 'primary' || variant === 'destructive';
  const spinnerColor = filled ? colors.neutral.white : variantText[variant].color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        variantStyles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && !loading && (filled ? styles.disabledFilled : styles.disabledOutline),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.text,
              size === 'lg' ? styles.textLg : styles.textMd,
              variantText[variant],
              isDisabled && styles.textDisabled,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: { minHeight: 56, paddingVertical: 14 },
  md: { minHeight: 48, paddingVertical: 10 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.85 },
  disabledFilled: { backgroundColor: colors.state.disabledFill, borderColor: colors.state.disabledFill },
  disabledOutline: { borderColor: colors.neutral.border },
  text: { fontFamily: typography.fonts.inter.semiBold, textAlign: 'center' },
  textLg: { fontSize: typography.sizes.body, lineHeight: 22 },
  textMd: { fontSize: typography.sizes.label, lineHeight: 20 },
  textDisabled: { color: colors.state.disabledText },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary.deepForest },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary.forest },
  tertiary: { backgroundColor: 'transparent', minHeight: 44, paddingHorizontal: 12 },
  destructive: { backgroundColor: colors.semantic.error },
  destructiveOutline: { backgroundColor: colors.neutral.white, borderWidth: 1.5, borderColor: colors.semantic.error },
});

const variantText = StyleSheet.create({
  primary: { color: colors.neutral.white },
  secondary: { color: colors.primary.forest },
  tertiary: { color: colors.primary.forest },
  destructive: { color: colors.neutral.white },
  destructiveOutline: { color: colors.semantic.error },
});
