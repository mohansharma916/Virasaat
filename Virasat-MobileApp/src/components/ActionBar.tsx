import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/colors';

type ActionBarProps = {
  children: ReactNode;
  // Tab screens sit above the tab bar, which already handles the inset.
  aboveTabBar?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Bottom-pinned container for a screen's main action, so it is always
// visible and clear of the system gesture area.
export function ActionBar({ children, aboveTabBar, style }: ActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: aboveTabBar ? 12 : Math.max(insets.bottom, 16) }, style]}>
      {children}
    </View>
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
