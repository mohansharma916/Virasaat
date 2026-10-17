import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tabs } from 'expo-router';

import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home' },
  'saved-items': { label: 'Vault', icon: 'shield' },
  people: { label: 'People', icon: 'users' },
  account: { label: 'Account', icon: 'user' },
};

// Material 3 navigation bar: 80dp, 24dp icons, 12sp labels, 64x32 active pill.
export function BottomNavBar({ state, navigation, insets }: TabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptics.selection();
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={`${tab.label}, tab ${index + 1} of ${state.routes.length}`}
            onPress={onPress}
            style={styles.item}
          >
            <View style={[styles.pill, focused && styles.pillActive]}>
              <AppIcon
                name={tab.icon}
                size={24}
                strokeWidth={focused ? 2.25 : 1.75}
                color={focused ? colors.primary.deepForest : colors.neutral.textSecondary}
              />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 12,
    backgroundColor: colors.neutral.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral.border,
  },
  item: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pill: { width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: colors.brand.sage },
  label: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.micro,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },
  labelActive: { fontFamily: typography.fonts.inter.semiBold, color: colors.primary.deepForest },
});
