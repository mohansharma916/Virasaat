import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Home as HomeIcon,
  Shield as VaultIcon,
  Users as PeopleIcon,
  User as ProfileIcon,
} from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { LEGACY_CATEGORY_KEYS } from '@/src/utils/legacy-flow';

export type TabName = 'home' | 'vault' | 'people' | 'profile';

interface BottomNavBarProps {
  activeTab: TabName;
}

interface NavItemConfig {
  id: TabName;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'vault', label: 'Vault', icon: VaultIcon },
  { id: 'people', label: 'People', icon: PeopleIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
];

export function BottomNavBar({ activeTab }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: TabName) => {
    if (tab === activeTab) return;

    switch (tab) {
      case 'home':
        router.replace('/(auth)/home');
        break;
      case 'vault':
        router.replace({
          pathname: '/(auth)/legacy-category',
          params: { categories: LEGACY_CATEGORY_KEYS.join(',') },
        } as never);
        break;
      case 'people':
        router.replace('/(auth)/people' as never);
        break;
      case 'profile':
        router.replace({
          pathname: '/(auth)/profile',
          params: { mode: 'edit' },
        } as never);
        break;
    }
  };

  return (
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.id === activeTab;
        const IconComponent = item.icon;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            onPress={() => handleTabPress(item.id)}
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
          >
            <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
              <IconComponent
                size={20}
                color={active ? colors.primary.deepForest : colors.neutral.textMuted}
                strokeWidth={active ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {item.label}
            </Text>
            {active ? <View style={styles.activeDot} /> : <View style={styles.dotPlaceholder} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(215, 225, 221, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#063F34',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navItemPressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.85,
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: colors.brand.mint,
  },
  navLabel: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 10.5,
    color: colors.neutral.textMuted,
  },
  navLabelActive: {
    fontFamily: typography.fonts.inter.semiBold,
    color: colors.primary.deepForest,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.forest,
    marginTop: 3,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 3,
  },
});
