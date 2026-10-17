import { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { AppIcon } from '@/src/components/AppIcon';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  helper?: string;
  // Most fields are required, so only optional ones are marked.
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({
  label,
  error,
  helper,
  required = true,
  containerStyle,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label} nativeID={`${label}-label`}>
        {label}
        {!required && <Text style={styles.optional}> (optional)</Text>}
      </Text>

      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? helper}
        {...props}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          props.style,
        ]}
        placeholderTextColor={colors.neutral.textMuted}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
      />

      {error ? (
        <View style={styles.messageRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <AppIcon name="alert" size={16} color={colors.semantic.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
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
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    color: colors.neutral.textPrimary,
    backgroundColor: colors.neutral.white,
  },

  multiline: {
    minHeight: 140,
    textAlignVertical: 'top',
  },

  inputFocused: {
    borderColor: colors.primary.forest,
    borderWidth: 2,
  },

  inputError: {
    borderColor: colors.semantic.error,
    borderWidth: 2,
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

  helper: {
    marginTop: 6,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textMuted,
  },
});
