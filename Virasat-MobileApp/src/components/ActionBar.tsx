import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { colors } from '@/src/theme/colors';

type ActionBarProps = {
  children: ReactNode;
  // Tab screens sit above the tab bar, which already handles the inset.
  aboveTabBar?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Bottom-pinned container for a screen's main action, so it is always
// visible and clear of the system gesture area. While the keyboard is open it
// rides on top of it, so the action stays reachable while typing.
export function ActionBar({ children, aboveTabBar, style }: ActionBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = aboveTabBar ? 12 : Math.max(insets.bottom, 16);
  const bar = (
    <View style={[styles.bar, { paddingBottom: bottomPadding }, style]}>
      {children}
    </View>
  );
  // The tab bar already sits under the keyboard; keep tab-screen bars in place.
  if (aboveTabBar) return bar;

  return (
    // Over the keyboard the gesture-area padding is not needed.
    <KeyboardStickyView offset={{ closed: 0, opened: bottomPadding - 12 }}>
      {bar}
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral.border,
  },
});
