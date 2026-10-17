import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { AppIcon } from '@/src/components/AppIcon';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type SelectInputProps = {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  required?: boolean;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function SelectInput({
  label,
  value,
  placeholder,
  onPress,
  required = true,
  error,
  containerStyle,
}: SelectInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {!required && <Text style={styles.optional}> (optional)</Text>}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'not selected'}`}
        accessibilityHint="Opens a list to choose from"
        onPress={onPress}
        style={({ pressed }) => [
          styles.input,
          !!error && styles.inputError,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>

        <AppIcon name="chevronDown" size={20} color={colors.neutral.textSecondary} />
      </Pressable>

      {error ? (
        <View style={styles.messageRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <AppIcon name="alert" size={16} color={colors.semantic.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  label: {
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    lineHeight: typography.lineHeights.label,
    color: colors.neutral.textPrimary,
  },

  optional: {
    fontFamily: typography.fonts.inter.regular,
    color: colors.neutral.textMuted,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.neutral.control,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.neutral.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  inputError: {
    borderColor: colors.semantic.error,
    borderWidth: 2,
  },

  pressed: {
    backgroundColor: colors.brand.mint,
  },

  value: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    color: colors.neutral.textPrimary,
  },

  placeholder: {
    color: colors.neutral.textMuted,
  },

  messageRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  error: {
    flex: 1,
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.semantic.error,
  },
});
