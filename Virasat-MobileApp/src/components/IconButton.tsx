import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { colors } from '@/src/theme/colors';

type IconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// 48x48 hit area (Material 48dp / Apple 44pt).
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  color = colors.primary.deepForest,
  size = 24,
  disabled,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <AppIcon name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.brand.mint },
  disabled: { opacity: 0.4 },
});
