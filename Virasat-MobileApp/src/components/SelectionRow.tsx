import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon } from '@/src/components/AppIcon';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type SelectionRowProps = {
  kind: 'checkbox' | 'radio';
  selected: boolean;
  onPress: () => void;
  title: string;
  description?: string;
  leading?: ReactNode;
  disabled?: boolean;
  // `card` draws the full selectable-card treatment; `plain` is a bare row.
  appearance?: 'card' | 'plain';
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// A whole-row checkbox or radio with a 48dp+ target and announced state.
export function SelectionRow({
  kind,
  selected,
  onPress,
  title,
  description,
  leading,
  disabled,
  appearance = 'card',
  children,
  style,
}: SelectionRowProps) {
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        appearance === 'card' && styles.card,
        appearance === 'card' && selected && styles.cardSelected,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {leading}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children}
      </View>
      <View
        style={[
          kind === 'checkbox' ? styles.checkbox : styles.radio,
          selected && styles.controlSelected,
        ]}
      >
        {selected ? (
          kind === 'checkbox' ? (
            <AppIcon name="check" size={16} color={colors.neutral.white} strokeWidth={3} />
          ) : (
            <View style={styles.radioDot} />
          )
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  card: {
    minHeight: 72,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
  },
  cardSelected: { borderWidth: 2, borderColor: colors.primary.forest, backgroundColor: colors.brand.mint },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  body: { flex: 1, gap: 2 },
  title: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textPrimary,
  },
  description: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSelected: { backgroundColor: colors.primary.forest, borderColor: colors.primary.forest },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.neutral.white },
});
