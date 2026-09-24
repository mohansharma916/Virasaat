import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type SelectInputProps = {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  required?: boolean;
};

export function SelectInput({
  label,
  value,
  placeholder,
  onPress,
  required = true,
}: SelectInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}

        {required && (
          <Text style={styles.required}> *</Text>
        )}
      </Text>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.input,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.value,
            !value && styles.placeholder,
          ]}
        >
          {value || placeholder}
        </Text>

        <Text style={styles.arrow}>
          ˅
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },

  required: {
    color: colors.primary.forest,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: colors.neutral.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pressed: {
    opacity: 0.8,
  },

  value: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },

  placeholder: {
    color: colors.neutral.textMuted,
  },

  arrow: {
    marginLeft: 10,
    fontSize: 18,
    color: colors.neutral.textSecondary,
  },
});